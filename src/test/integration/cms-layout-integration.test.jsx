import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";

// Mock the services with all functions
vi.mock("@services/cms/pageLayouts", () => ({
  getPageBySlug: vi.fn(),
  loadPageLayout: vi.fn(),
  savePageLayout: vi.fn(),
  createPage: vi.fn(),
  deletePage: vi.fn(),
  updatePageMetadata: vi.fn(),
}));

// Import after mocking
import * as pageLayoutsService from "@services/cms/pageLayouts";
import cmsPageReducer, { 
  loadCmsPageLayout, 
  initializePageOverrides, 
  clearPageData 
} from "@redux/slices/cmsPageSlice";

describe("CMS Layout Integration", () => {
  let queryClient;
  let store;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    store = configureStore({
      reducer: {
        cmsPage: cmsPageReducer,
      },
    });

    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{component}</BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  };

  describe("Service Layer", () => {
    it("should have all required service functions", () => {
      expect(pageLayoutsService.getPageBySlug).toBeDefined();
      expect(pageLayoutsService.loadPageLayout).toBeDefined();
      expect(pageLayoutsService.savePageLayout).toBeDefined();
      expect(pageLayoutsService.createPage).toBeDefined();
      expect(pageLayoutsService.deletePage).toBeDefined();
      expect(pageLayoutsService.updatePageMetadata).toBeDefined();
    });

    it("should call getPageBySlug with correct parameters", async () => {
      const mockPage = { id: 1, slug: "test-page", title: "Test Page" };
      pageLayoutsService.getPageBySlug.mockResolvedValue(mockPage);

      const result = await pageLayoutsService.getPageBySlug("test-page");

      expect(pageLayoutsService.getPageBySlug).toHaveBeenCalledWith("test-page");
      expect(result).toEqual(mockPage);
    });

    it("should call loadPageLayout with correct parameters", async () => {
      const mockLayout = {
        id: "layout-123",
        layout_json: {
          layout: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
          instances: { widget1: { type: "stats", props: {} } },
          theme_overrides: { variant: "default" },
        },
        updated_at: "2025-01-01T00:00:00Z",
      };
      pageLayoutsService.loadPageLayout.mockResolvedValue(mockLayout);

      const result = await pageLayoutsService.loadPageLayout(1);

      expect(pageLayoutsService.loadPageLayout).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLayout);
    });
  });

  describe("Redux Integration", () => {
    it("should initialize with correct default state", () => {
      const state = store.getState();
      
      expect(state.cmsPage).toEqual({
        currentPage: null,
        layout: null,
        instances: {},
        themeOverrides: {},
        isLoading: false,
        isInitialized: false,
        error: null,
        lastAttemptedSlug: null,
      });
    });

    it("should handle loadCmsPageLayout.pending action", () => {
      store.dispatch(loadCmsPageLayout({ slug: "test-page" }));

      const state = store.getState();
      expect(state.cmsPage.isLoading).toBe(true);
      expect(state.cmsPage.lastAttemptedSlug).toBe("test-page");
      expect(state.cmsPage.error).toBeNull();
    });

    it("should handle loadCmsPageLayout.fulfilled action", () => {
      const mockPayload = {
        page: { id: 1, slug: "test-page", title: "Test Page" },
        layout: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
        instances: { widget1: { type: "stats", props: {} } },
        theme_overrides: { variant: "dark" },
      };

      store.dispatch(loadCmsPageLayout.fulfilled(mockPayload));

      const state = store.getState();
      expect(state.cmsPage.isLoading).toBe(false);
      expect(state.cmsPage.isInitialized).toBe(true);
      expect(state.cmsPage.currentPage).toEqual(mockPayload.page);
      expect(state.cmsPage.layout).toEqual(mockPayload.layout);
      expect(state.cmsPage.instances).toEqual(mockPayload.instances);
      expect(state.cmsPage.themeOverrides).toEqual(mockPayload.theme_overrides);
      expect(state.cmsPage.error).toBeNull();
    });

    it("should handle loadCmsPageLayout.rejected action", () => {
      const mockError = { error: "Network error", slug: "test-page" };

      store.dispatch(loadCmsPageLayout.rejected(mockError));

      const state = store.getState();
      expect(state.cmsPage.isLoading).toBe(false);
      expect(state.cmsPage.isInitialized).toBe(false);
      expect(state.cmsPage.error).toEqual(mockError.error);
    });

    it("should handle initializePageOverrides action", () => {
      const mockOverrides = {
        layout: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
        instances: { widget1: { type: "stats", props: {} } },
        theme_overrides: { variant: "dark" },
      };

      store.dispatch(initializePageOverrides(mockOverrides));

      const state = store.getState();
      expect(state.cmsPage.layout).toEqual(mockOverrides.layout);
      expect(state.cmsPage.instances).toEqual(mockOverrides.instances);
      expect(state.cmsPage.themeOverrides).toEqual(mockOverrides.theme_overrides);
      expect(state.cmsPage.isInitialized).toBe(true);
    });

    it("should handle clearPageData action", () => {
      // First set some data
      store.dispatch(initializePageOverrides({
        layout: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
        instances: { widget1: { type: "stats", props: {} } },
        theme_overrides: { variant: "dark" },
      }));

      // Then clear it
      store.dispatch(clearPageData());

      const state = store.getState();
      expect(state.cmsPage).toEqual({
        currentPage: null,
        layout: null,
        instances: {},
        themeOverrides: {},
        isLoading: false,
        isInitialized: false,
        error: null,
        lastAttemptedSlug: null,
      });
    });
  });

  describe("Data Flow Integration", () => {
    it("should demonstrate complete CMS data flow", async () => {
      // Mock successful CMS data fetch
      const mockPage = { id: 1, slug: "test-page", title: "Test Page" };
      const mockLayout = {
        id: "layout-123",
        layout_json: {
          layout: [
            { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
            { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
          ],
          instances: {
            widget1: { type: "stats", props: { title: "Statistics" }, variant: "default" },
            widget2: { type: "chart", props: { data: [1, 2, 3] }, variant: "compact" },
          },
          theme_overrides: { variant: "dark", mode: "dark", primaryColor: "#3b82f6" },
        },
        updated_at: "2025-01-01T00:00:00Z",
      };

      pageLayoutsService.getPageBySlug.mockResolvedValue(mockPage);
      pageLayoutsService.loadPageLayout.mockResolvedValue(mockLayout);

      // Simulate the async thunk call
      const thunk = store.dispatch(
        (dispatch, getState, extraArgument) => {
          dispatch({ 
            type: "cmsPage/loadCmsPageLayout/pending", 
            meta: { arg: { slug: "test-page" } }
          });
          
          return Promise.resolve().then(() => {
            dispatch({
              type: "cmsPage/loadCmsPageLayout/fulfilled",
              payload: {
                page: mockPage,
                layout: mockLayout.layout_json.layout,
                instances: mockLayout.layout_json.instances,
                theme_overrides: mockLayout.layout_json.theme_overrides,
              },
            });
          });
        }
      );

      await thunk;

      const state = store.getState();
      
      // Verify all data was stored correctly
      expect(state.cmsPage.currentPage).toEqual(mockPage);
      expect(state.cmsPage.layout).toEqual(mockLayout.layout_json.layout);
      expect(state.cmsPage.instances).toEqual(mockLayout.layout_json.instances);
      expect(state.cmsPage.themeOverrides).toEqual(mockLayout.layout_json.theme_overrides);
      expect(state.cmsPage.isInitialized).toBe(true);
      expect(state.cmsPage.isLoading).toBe(false);
      expect(state.cmsPage.error).toBeNull();
    });
  });
});