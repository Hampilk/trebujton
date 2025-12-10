import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for loading page layout from CMS
export const loadCmsPageLayout = createAsyncThunk(
  'cmsPage/loadLayout',
  async ({ slug }, { rejectWithValue }) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { getPageBySlug, loadPageLayout } = await import('@services/cms/pageLayouts');
      
      // First get the page by slug
      const page = await getPageBySlug(slug);
      if (!page) {
        return rejectWithValue({ error: 'Page not found', slug });
      }

      // Then load the layout
      const layoutData = await loadPageLayout(page.id);
      
      return {
        page,
        layout: layoutData,
        slug,
      };
    } catch (error) {
      console.error('Error loading CMS page layout:', error);
      return rejectWithValue({ error: error.message, slug });
    }
  }
);

const initialState = {
  // Current page data
  currentPage: null,
  
  // Layout data
  layout: null,
  instances: {},
  
  // Theme overrides
  themeOverrides: {},
  
  // Loading states
  isLoading: false,
  isInitialized: false,
  
  // Error handling
  error: null,
  lastAttemptedSlug: null,
};

const cmsPageSlice = createSlice({
  name: 'cmsPage',
  initialState,
  reducers: {
    // Initialize page overrides (called when CMS layout is successfully loaded)
    initializePageOverrides: (state, action) => {
      const { layout, instances, theme_overrides } = action.payload;
      
      state.layout = layout;
      state.instances = instances || {};
      state.themeOverrides = theme_overrides || {};
      state.isInitialized = true;
      state.error = null;
    },
    
    // Clear page data (useful for navigation or cleanup)
    clearPageData: (state) => {
      state.currentPage = null;
      state.layout = null;
      state.instances = {};
      state.themeOverrides = {};
      state.isInitialized = false;
      state.error = null;
      state.lastAttemptedSlug = null;
    },
    
    // Update theme overrides (for real-time theme updates)
    updateThemeOverrides: (state, action) => {
      state.themeOverrides = {
        ...state.themeOverrides,
        ...action.payload,
      };
    },
    
    // Update widget instance props
    updateWidgetInstance: (state, action) => {
      const { instanceId, props } = action.payload;
      if (state.instances[instanceId]) {
        state.instances[instanceId] = {
          ...state.instances[instanceId],
          props: {
            ...state.instances[instanceId].props,
            ...props,
          },
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load page layout - pending
      .addCase(loadCmsPageLayout.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.lastAttemptedSlug = action.meta.arg.slug;
      })
      
      // Load page layout - fulfilled
      .addCase(loadCmsPageLayout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPage = action.payload.page;
        state.lastAttemptedSlug = null;
        
        // Extract layout data
        const layoutData = action.payload.layout;
        if (layoutData && layoutData.layout_json) {
          const { layout, instances, theme_overrides } = layoutData.layout_json;
          
          state.layout = layout || [];
          state.instances = instances || {};
          state.themeOverrides = theme_overrides || {};
          state.isInitialized = true;
        } else {
          // No layout found, but page exists
          state.layout = null;
          state.instances = {};
          state.themeOverrides = {};
          state.isInitialized = false;
        }
        
        state.error = null;
      })
      
      // Load page layout - rejected
      .addCase(loadCmsPageLayout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || 'Failed to load page layout';
        state.isInitialized = false;
        
        // Don't clear the last attempted slug so components can decide whether to retry
      });
  },
});

export const {
  initializePageOverrides,
  clearPageData,
  updateThemeOverrides,
  updateWidgetInstance,
} = cmsPageSlice.actions;

// Selectors
export const selectCmsPageData = (state) => state.cmsPage;
export const selectCmsPageLayout = (state) => state.cmsPage.layout;
export const selectCmsPageInstances = (state) => state.cmsPage.instances;
export const selectCmsPageThemeOverrides = (state) => state.cmsPage.themeOverrides;
export const selectCmsPageLoading = (state) => state.cmsPage.isLoading;
export const selectCmsPageError = (state) => state.cmsPage.error;
export const selectCmsPageInitialized = (state) => state.cmsPage.isInitialized;
export const selectCmsCurrentPage = (state) => state.cmsPage.currentPage;

export default cmsPageSlice.reducer;