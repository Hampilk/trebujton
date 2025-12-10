import { supabase } from "@/integrations/supabase/client";

/**
 * Load a page layout by page ID
 * Returns both page metadata, layout_json (from page_layouts), and theme_overrides (from pages)
 */
export async function loadPageLayout(pageId: string) {
  try {
    // First, get the page metadata including theme_overrides
    const { data: pageData, error: pageError } = await supabase
      .from("pages" as any)
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .eq("id", pageId)
      .single();

    if (pageError) {
      if (pageError.code === "PGRST116") {
        return null; // No page found
      }
      throw pageError;
    }

    if (!pageData) return null;

    // Then get the latest layout from page_layouts
    const { data: layoutData, error: layoutError } = await supabase
      .from("page_layouts" as any)
      .select("id, layout_json, updated_at")
      .eq("page_id", pageId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (layoutError) {
      throw layoutError;
    }

    // Combine the data
    const layout = layoutData as any
    const page = pageData as any
    return {
      id: layout?.id || null,
      layout_json: layout?.layout_json || {},
      updated_at: layout?.updated_at || null,
      pages: page,
      theme_overrides: page?.theme_overrides || {},
    };
  } catch (error) {
    console.error("Error loading page layout:", error);
    throw error;
  }
}

/**
 * Save or update a page layout
 * Upserts the layout_json in page_layouts table
 * Optionally updates theme_overrides in pages table
 */
export async function savePageLayout(
  pageId: string,
  layoutPayload: any,
  themeOverrides: any = null,
) {
  try {
    // Save layout_json to page_layouts
    const _resLayout = await (supabase.from("page_layouts" as any) as any)
      .upsert(
        {
          page_id: pageId,
          layout_json: layoutPayload,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: "page_id",
        },
      )
      .select()
      .single();

    const layoutData = _resLayout.data as any
    const layoutError = _resLayout.error
    if (layoutError) {
      throw layoutError;
    }

    // If theme_overrides are provided, update the pages table
    if (themeOverrides !== null) {
      const { data: userData } = await supabase.auth.getUser();
      
      const _resTheme = await (supabase.from("pages" as any) as any)
        .update({
          theme_overrides: themeOverrides,
          updated_at: new Date().toISOString(),
          updated_by: userData?.user?.id,
        } as any)
        .eq("id", pageId);

      const themeError = _resTheme.error
      if (themeError) {
        throw themeError;
      }
    }

    return layoutData;
  } catch (error) {
    console.error("Error saving page layout:", error);
    throw error;
  }
}

/**
 * Create a new page with initial layout and theme overrides
 */
export async function createPage(
  slug: string,
  title: string,
  initialLayout: any = null,
  themeOverrides: any = null,
) {
  try {
    const _resPage = await (supabase.from("pages" as any) as any)
      .insert({
        slug,
        title,
        theme_overrides: themeOverrides || {},
      } as any)
      .select()
      .single();

    const pageData = _resPage.data as any
    const pageError = _resPage.error
    if (pageError) {
      throw pageError;
    }

    if (initialLayout && pageData) {
      const _resLayoutInsert = await (supabase.from("page_layouts" as any) as any)
        .insert({
          page_id: pageData.id,
          layout_json: initialLayout,
        } as any);

      const layoutError = _resLayoutInsert.error
      if (layoutError) {
        throw layoutError;
      }
    }

    return pageData;
  } catch (error) {
    console.error("Error creating page:", error);
    throw error;
  }
}

/**
 * Get page by slug
 * Includes theme_overrides
 */
export async function getPageBySlug(slug: string) {
  try {
    const _res = await supabase
      .from("pages" as any)
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .eq("slug", slug)
      .single();

    const data = _res.data as any
    const error = _res.error
    if (error) {
      if (error.code === "PGRST116") {
        return null; // No page found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting page by slug:", error);
    throw error;
  }
}

/**
 * Delete a page and its layouts
 */
export async function deletePage(pageId: string) {
  try {
        const _resDel = await (supabase.from("pages" as any) as any).delete().eq("id", pageId);
        const error = _resDel.error
        if (error) {
          throw error;
        }
  } catch (error) {
    console.error("Error deleting page:", error);
    throw error;
  }
}

/**
 * Update page metadata (slug, title, is_published)
 */
export async function updatePageMetadata(pageId: string, updates: any) {
  try {
    const _res = await (supabase.from("pages" as any) as any)
      .update(updates as any)
      .eq("id", pageId)
      .select()
      .single();

    const data = _res.data as any
    const error = _res.error
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating page metadata:", error);
    throw error;
  }
}

/**
 * Update only the theme overrides for a page
 */
export async function updatePageThemeOverrides(pageId: string, themeOverrides: any) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const _res = await (supabase.from("pages" as any) as any)
      .update({
        theme_overrides: themeOverrides,
        updated_at: new Date().toISOString(),
        updated_by: userData?.user?.id,
      } as any)
      .eq("id", pageId)
      .select()
      .single();

    const data = _res.data as any
    const error = _res.error
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating page theme overrides:", error);
    throw error;
  }
}

/**
 * Merge page theme overrides (useful for partial updates)
 */
export async function mergePageThemeOverrides(pageId: string, partialOverrides: any) {
  try {
    // First load the existing page
    const existingPageLayout = await loadPageLayout(pageId);

    if (!existingPageLayout) {
      throw new Error("Page not found");
    }

    // Merge the overrides
    const mergedOverrides = {
      ...(existingPageLayout.theme_overrides || {}),
      ...partialOverrides,
    };

    // Save the merged overrides
    return await updatePageThemeOverrides(pageId, mergedOverrides);
  } catch (error) {
    console.error("Error merging page theme overrides:", error);
    throw error;
  }
}

/**
 * Get page theme override audit log
 */
export async function getPageThemeOverrideAuditLog(pageId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("page_theme_override_audit" as any)
      .select("*")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        // Table might not exist yet
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return [];
  }
}

/**
 * Get all pages with their theme overrides
 */
export async function getAllPages() {
  try {
    const _res = await supabase
      .from("pages" as any)
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .order("created_at", { ascending: false });

    const data = _res.data as any
    const error = _res.error
    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all pages:", error);
    return [];
  }
}