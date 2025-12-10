import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Current page being edited
  currentPageId: null,

  // Layout data structure: { [pageId]: { instances: {}, layout: [] } }
  layouts: {},

  // Track if current layout has unsaved changes
  isDirty: false,

  // Last saved snapshot for comparison
  lastSavedSnapshot: null,

  // UI state
  isLoading: false,
  error: null,
  lastSaveTime: null,

  // Builder UI state
  selectedInstanceId: null,
};

export const PageLayouts = createSlice({
  name: "pageLayouts",
  initialState,
  reducers: {
    // Set the current page being edited
    setCurrentPageId: (state, action) => {
      state.currentPageId = action.payload;
    },

    // Load layout data from Supabase
    loadLayoutSuccess: (state, action) => {
      const { pageId, layoutData } = action.payload;
      state.layouts[pageId] = layoutData;
      state.isDirty = false;
      state.lastSavedSnapshot = JSON.stringify(layoutData);
      state.isLoading = false;
      state.error = null;
    },

    // Load layout error
    loadLayoutError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Load layout pending
    loadLayoutPending: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    // Update layout instances (the actual widget configuration)
    updateLayoutInstances: (state, action) => {
      const { pageId, instances } = action.payload;
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { instances: {}, layout: [] };
      }
      state.layouts[pageId].instances = instances;
      state.isDirty = true;
    },

    // Update layout grid configuration
    updateLayoutGrid: (state, action) => {
      const { pageId, layout } = action.payload;
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { instances: {}, layout: [] };
      }
      state.layouts[pageId].layout = layout;
      state.isDirty = true;
    },

    // Bulk update layout data
    updateLayout: (state, action) => {
      const { pageId, layoutData } = action.payload;
      state.layouts[pageId] = layoutData;
      state.isDirty = true;
    },

    // Mark as saved
    markAsSaved: (state, action) => {
      const { pageId } = action.payload;
      state.isDirty = false;
      state.lastSaveTime = new Date().toISOString();
      state.lastSavedSnapshot = JSON.stringify(state.layouts[pageId]);
      state.error = null;
    },

    // Mark save as failed
    saveError: (state, action) => {
      state.error = action.payload;
      // Keep isDirty true so we can retry
    },

    // Reset layout for a page
    resetLayout: (state, action) => {
      const { pageId } = action.payload;
      state.layouts[pageId] = { instances: {}, layout: [] };
      state.isDirty = false;
      state.lastSavedSnapshot = null;
      state.error = null;
    },

    // Clear all layouts
    clearAllLayouts: (state) => {
      state.layouts = {};
      state.isDirty = false;
      state.lastSavedSnapshot = null;
      state.error = null;
      state.currentPageId = null;
      state.selectedInstanceId = null;
    },

    // === Builder Actions ===

    // Add a widget instance to the current page
    addWidgetInstance: (state, action) => {
      const { pageId, instance } = action.payload;
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { instances: {}, layout: [] };
      }
      
      // Add instance
      state.layouts[pageId].instances[instance.id] = instance;
      
      // Add to layout grid
      state.layouts[pageId].layout.push({
        i: instance.id,
        x: instance.layout?.x || 0,
        y: instance.layout?.y || 0,
        w: instance.layout?.w || 3,
        h: instance.layout?.h || 2,
      });
      
      state.isDirty = true;
    },

    // Update instance layout (position/size)
    updateInstanceLayout: (state, action) => {
      const { pageId, layout } = action.payload;
      if (!state.layouts[pageId]) return;
      
      state.layouts[pageId].layout = layout;
      state.isDirty = true;
    },

    // Update instance props
    updateInstanceProps: (state, action) => {
      const { pageId, instanceId, props } = action.payload;
      if (!state.layouts[pageId]?.instances[instanceId]) return;
      
      state.layouts[pageId].instances[instanceId].props = props;
      state.isDirty = true;
    },

    // Remove an instance
    removeInstance: (state, action) => {
      const { pageId, instanceId } = action.payload;
      if (!state.layouts[pageId]) return;
      
      // Remove from instances
      delete state.layouts[pageId].instances[instanceId];
      
      // Remove from layout
      state.layouts[pageId].layout = state.layouts[pageId].layout.filter(
        (item) => item.i !== instanceId
      );
      
      // Clear selection if this instance was selected
      if (state.selectedInstanceId === instanceId) {
        state.selectedInstanceId = null;
      }
      
      state.isDirty = true;
    },

    // Duplicate an instance
    duplicateInstance: (state, action) => {
      const { pageId, instanceId } = action.payload;
      if (!state.layouts[pageId]?.instances[instanceId]) return;
      
      const originalInstance = state.layouts[pageId].instances[instanceId];
      const originalLayout = state.layouts[pageId].layout.find(
        (item) => item.i === instanceId
      );
      
      // Create new instance with unique ID
      const newId = `${originalInstance.type}-${Date.now()}`;
      const newInstance = {
        ...originalInstance,
        id: newId,
      };
      
      // Add new instance
      state.layouts[pageId].instances[newId] = newInstance;
      
      // Add to layout with offset position
      state.layouts[pageId].layout.push({
        i: newId,
        x: (originalLayout?.x || 0) + 1,
        y: (originalLayout?.y || 0) + 1,
        w: originalLayout?.w || 3,
        h: originalLayout?.h || 2,
      });
      
      state.isDirty = true;
    },

    // Select an instance
    selectInstance: (state, action) => {
      const { instanceId } = action.payload;
      state.selectedInstanceId = instanceId;
    },

    // Clear selection
    clearSelection: (state) => {
      state.selectedInstanceId = null;
    },
  },
});

export const {
  setCurrentPageId,
  loadLayoutSuccess,
  loadLayoutError,
  loadLayoutPending,
  updateLayoutInstances,
  updateLayoutGrid,
  updateLayout,
  markAsSaved,
  saveError,
  resetLayout,
  clearAllLayouts,
  // Builder actions
  addWidgetInstance,
  updateInstanceLayout,
  updateInstanceProps,
  removeInstance,
  duplicateInstance,
  selectInstance,
  clearSelection,
} = PageLayouts.actions;

export default PageLayouts.reducer;

// Selectors
export const selectCurrentPageId = (state) => state.pageLayouts.currentPageId;
export const selectLayouts = (state) => state.pageLayouts.layouts;
export const selectCurrentLayout = (state) => {
  const { currentPageId, layouts } = state.pageLayouts;
  return currentPageId ? layouts[currentPageId] || { instances: {}, layout: [] } : { instances: {}, layout: [] };
};
export const selectCurrentPageLayout = (pageId) => (state) => {
  return state.pageLayouts.layouts[pageId] || { instances: {}, layout: [] };
};
export const selectIsDirty = (state) => state.pageLayouts.isDirty;
export const selectSelectedInstanceId = (state) => state.pageLayouts.selectedInstanceId;
export const selectSelectedInstance = (state) => {
  const { selectedInstanceId, currentPageId, layouts } = state.pageLayouts;
  if (!selectedInstanceId || !currentPageId || !layouts[currentPageId]) return null;
  return layouts[currentPageId].instances[selectedInstanceId];
};
export const selectLoadingState = (state) => ({
  isLoading: state.pageLayouts.isLoading,
  error: state.pageLayouts.error,
  lastSaveTime: state.pageLayouts.lastSaveTime,
});
