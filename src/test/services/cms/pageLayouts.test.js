import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadPageLayout,
  savePageLayout,
  createPage,
  getPageBySlug,
  deletePage,
  updatePageMetadata,
  updatePageThemeOverrides,
  mergePageThemeOverrides,
  getPageThemeOverrideAuditLog,
  getAllPages,
} from "@/services/cms/pageLayouts";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
      }),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("pageLayouts service", () => {
  const mockPageId = "page-123";
  const mockLayoutData = {
    instances: {
      "widget-1": { type: "TeamStats", title: "Team Statistics" },
      "widget-2": { type: "Leaderboard", title: "Leaderboard" },
    },
    layout: [
      { i: "widget-1", x: 0, y: 0, w: 6, h: 4 },
      { i: "widget-2", x: 6, y: 0, w: 6, h: 4 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadPageLayout", () => {
    it("should load layout data for a page with theme overrides", async () => {
      const mockPageData = {
        id: mockPageId,
        slug: "test-page",
        title: "Test Page",
        is_published: false,
        created_at: "2025-02-01T00:00:00Z",
        theme_overrides: {
          themeMode: "dark",
          themeVariant: "pro",
        },
      };

      const mockLayoutData_Response = {
        id: "layout-123",
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
      };

      // First call for pages table
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockPageData, error: null }),
          }),
        }),
      });

      // Second call for page_layouts table
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockLayoutData_Response,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await loadPageLayout(mockPageId);
      expect(result.layout_json).toEqual(mockLayoutData);
      expect(result.theme_overrides).toEqual({
        themeMode: "dark",
        themeVariant: "pro",
      });
      expect(result.pages).toEqual(mockPageData);
    });

    it("should return null when no page exists", async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const result = await loadPageLayout(mockPageId);
      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      const mockError = new Error("Database connection failed");

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(loadPageLayout(mockPageId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("savePageLayout", () => {
    it("should save layout data for a page", async () => {
      const mockResponse = {
        id: "layout-123",
        page_id: mockPageId,
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
      };

      supabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockResponse, error: null }),
          }),
        }),
      });

      const result = await savePageLayout(mockPageId, mockLayoutData);
      expect(result).toEqual(mockResponse);
      expect(result.layout_json).toEqual(mockLayoutData);
    });

    it("should save layout data and theme overrides", async () => {
      const mockThemeOverrides = {
        themeMode: "dark",
        themeVariant: "pro",
      };

      const mockLayoutResponse = {
        id: "layout-123",
        page_id: mockPageId,
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
      };

      // First call for page_layouts upsert
      supabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockLayoutResponse, error: null }),
          }),
        }),
      });

      // Second call for pages update
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockResolvedValue({ data: { theme_overrides: mockThemeOverrides }, error: null }),
        }),
      });

      const result = await savePageLayout(
        mockPageId,
        mockLayoutData,
        mockThemeOverrides,
      );
      expect(result).toEqual(mockLayoutResponse);
    });

    it("should throw error on save failure", async () => {
      const mockError = new Error("Failed to save layout");

      supabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(savePageLayout(mockPageId, mockLayoutData)).rejects.toThrow(
        "Failed to save layout",
      );
    });
  });

  describe("createPage", () => {
    it("should create a new page with layout", async () => {
      const mockPageResponse = {
        id: mockPageId,
        slug: "new-page",
        title: "New Page",
      };

      supabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPageResponse,
              error: null,
            }),
          }),
        }),
      });

      supabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await createPage("new-page", "New Page", mockLayoutData);
      expect(result).toEqual(mockPageResponse);
    });
  });

  describe("getPageBySlug", () => {
    it("should retrieve page by slug", async () => {
      const mockPageResponse = {
        id: mockPageId,
        slug: "test-page",
        title: "Test Page",
        is_published: false,
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPageResponse,
              error: null,
            }),
          }),
        }),
      });

      const result = await getPageBySlug("test-page");
      expect(result).toEqual(mockPageResponse);
    });
  });

  describe("deletePage", () => {
    it("should delete a page", async () => {
      supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(deletePage(mockPageId)).resolves.toBeUndefined();
    });
  });

  describe("updatePageMetadata", () => {
    it("should update page metadata", async () => {
      const updates = { title: "Updated Title", is_published: true };
      const mockResponse = {
        id: mockPageId,
        slug: "test-page",
        ...updates,
      };

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updatePageMetadata(mockPageId, updates);
      expect(result).toEqual(mockResponse);
      expect(result.title).toBe("Updated Title");
      expect(result.is_published).toBe(true);
    });
  });

  describe("updatePageThemeOverrides", () => {
    it("should update theme overrides for a page", async () => {
      const mockThemeOverrides = {
        themeMode: "dark",
        themeVariant: "pro",
      };

      const mockResponse = {
        id: mockPageId,
        theme_overrides: mockThemeOverrides,
      };

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updatePageThemeOverrides(
        mockPageId,
        mockThemeOverrides,
      );
      expect(result).toEqual(mockResponse);
      expect(result.theme_overrides).toEqual(mockThemeOverrides);
    });
  });

  describe("mergePageThemeOverrides", () => {
    it("should merge partial overrides with existing overrides", async () => {
      const existingOverrides = {
        themeMode: "light",
        themeVariant: "default",
      };

      const partialOverrides = {
        themeMode: "dark",
      };

      const mockPageData = {
        id: mockPageId,
        slug: "test-page",
        title: "Test Page",
        is_published: false,
        created_at: "2025-02-01T00:00:00Z",
        theme_overrides: existingOverrides,
      };

      const mockLayoutData_Response = {
        id: "layout-123",
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
      };

      // Mock loadPageLayout calls
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockPageData, error: null }),
          }),
        }),
      });

      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockLayoutData_Response,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Mock updatePageThemeOverrides call
      const expectedMerged = {
        themeMode: "dark",
        themeVariant: "default",
      };

      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { theme_overrides: expectedMerged },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await mergePageThemeOverrides(mockPageId, partialOverrides);
      expect(result.theme_overrides).toEqual(expectedMerged);
    });
  });

  describe("getPageThemeOverrideAuditLog", () => {
    it("should retrieve audit log entries", async () => {
      const mockAuditLog = [
        {
          id: "audit-1",
          page_id: mockPageId,
          user_id: "user-123",
          old_overrides: { themeMode: "light" },
          new_overrides: { themeMode: "dark" },
          change_description: "Theme overrides updated",
          created_at: "2025-02-01T00:00:00Z",
        },
      ];

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockAuditLog,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await getPageThemeOverrideAuditLog(mockPageId);
      expect(result).toEqual(mockAuditLog);
    });

    it("should return empty array if audit table does not exist", async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "42P01" },
              }),
            }),
          }),
        }),
      });

      const result = await getPageThemeOverrideAuditLog(mockPageId);
      expect(result).toEqual([]);
    });
  });

  describe("getAllPages", () => {
    it("should retrieve all pages with theme overrides", async () => {
      const mockPages = [
        {
          id: "page-1",
          slug: "page-1",
          title: "Page 1",
          is_published: true,
          created_at: "2025-02-01T00:00:00Z",
          theme_overrides: { themeMode: "dark" },
        },
        {
          id: "page-2",
          slug: "page-2",
          title: "Page 2",
          is_published: false,
          created_at: "2025-02-01T00:00:00Z",
          theme_overrides: {},
        },
      ];

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPages,
            error: null,
          }),
        }),
      });

      const result = await getAllPages();
      expect(result).toEqual(mockPages);
      expect(result[0].theme_overrides).toEqual({ themeMode: "dark" });
    });
  });
});
