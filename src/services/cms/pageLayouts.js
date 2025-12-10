import { supabase } from "@/integrations/supabase/client";

/**
 * Load a page layout by page ID
 * Returns both page metadata, layout_json (from page_layouts), and theme_overrides (from pages)
 */
export async function loadPageLayout(pageId) {
  try {
    // First, get the page metadata including theme_overrides
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .eq("id", pageId)
      .single();

    if (pageError) {
      if (pageError.code === "PGRST116") {
        return null; // No page found
      }
      throw pageError;
    }

    // Then get the latest layout from page_layouts
    const { data: layoutData, error: layoutError } = await supabase
      .from("page_layouts")
      .select("id, layout_json, updated_at")
      .eq("page_id", pageId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (layoutError) {
      throw layoutError;
    }

    // Combine the data
    return {
      id: layoutData?.id,
      layout_json: layoutData?.layout_json || {},
      updated_at: layoutData?.updated_at,
      pages: pageData,
      theme_overrides: pageData.theme_overrides || {},
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
  pageId,
  layoutPayload,
  themeOverrides = null,
) {
  try {
    // Save layout_json to page_layouts
    const { data: layoutData, error: layoutError } = await supabase
      .from("page_layouts")
      .upsert(
        {
          page_id: pageId,
          layout_json: layoutPayload,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "page_id",
        },
      )
      .select()
      .single();

    if (layoutError) {
      throw layoutError;
    }

    // If theme_overrides are provided, update the pages table
    if (themeOverrides !== null) {
      const { error: themeError } = await supabase
        .from("pages")
        .update({
          theme_overrides: themeOverrides,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data?.user?.id,
        })
        .eq("id", pageId);

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
  slug,
  title,
  initialLayout = null,
  themeOverrides = null,
) {
  try {
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .insert({
        slug,
        title,
        theme_overrides: themeOverrides || {},
      })
      .select()
      .single();

    if (pageError) {
      throw pageError;
    }

    if (initialLayout) {
      const { error: layoutError } = await supabase
        .from("page_layouts")
        .insert({
          page_id: pageData.id,
          layout_json: initialLayout,
        });

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
export async function getPageBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .eq("slug", slug)
      .single();

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
export async function deletePage(pageId) {
  try {
    const { error } = await supabase.from("pages").delete().eq("id", pageId);

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
export async function updatePageMetadata(pageId, updates) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .update(updates)
      .eq("id", pageId)
      .select()
      .single();

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
export async function updatePageThemeOverrides(pageId, themeOverrides) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .update({
        theme_overrides: themeOverrides,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data?.user?.id,
      })
      .eq("id", pageId)
      .select()
      .single();

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
export async function mergePageThemeOverrides(pageId, partialOverrides) {
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
export async function getPageThemeOverrideAuditLog(pageId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("page_theme_override_audit")
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
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, title, is_published, created_at, theme_overrides")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all pages:", error);
    return [];
  }
}
