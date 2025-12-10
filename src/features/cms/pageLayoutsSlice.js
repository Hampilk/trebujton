import { createSlice, createSelector } from "@reduxjs/toolkit";

/**
 * Initial state for page layouts slice
 * Manages page builder layouts, instances, and UI state
 */
const initialState = {
  // Current page being edited
  currentPageId: null,

  // Layout data structure: { [pageId]: { instances: {}, layout: [] } }
  layouts: {},

  // Track if current layout has unsaved changes
  isDirty: false,

  // Last saved snapshot for comparison (stringified JSON)
  lastSavedSnapshot: null,

  // Loading and error states
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaveTime: null,

  // Builder UI state
  selectedInstanceId: null,
  
  // History management (undo/redo)
  history: {
    past: [],
    future: [],
  },

  // Grid settings
  gridSettings: {
    cols: 12,
    rowHeight: 30,
    compactType: "vertical",
  },
};

/**
 * Default layout structure
 */
const DEFAULT_LAYOUT = {
  instances: {},
  layout: [],
};

/**
 * Helper function to generate unique widget ID
 */
const generateWidgetId = (type) => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper function to deep clone layout data
 */
const cloneLayout = (layout) => {
  return JSON.parse(JSON.stringify(layout));
};

/**
 * Page Layouts Slice
 * Manages all page builder state including layouts, instances, and UI
 */
export const pageLayoutsSlice = createSlice({
  name: "pageLayouts",
  initialState,
  reducers: {
    // ========================================
    // PAGE MANAGEMENT
    // ========================================

    /**
     * Set the current page being edited
     */
    setCurrentPageId: (state, action) => {
      state.currentPageId = action.payload;
      state.selectedInstanceId = null; // Clear selection when switching pages
    },

    // ========================================
    // LAYOUT LOADING
    // ========================================

    /**
     * Start loading layout
     */
    loadLayoutPending: (state, action) => {
      const { pageId } = action.payload || {};
      state.isLoading = true;
      state.error = null;
      
      if (pageId) {
        state.currentPageId = pageId;
      }
    },

    /**
     * Successfully loaded layout from Supabase
     */
    loadLayoutSuccess: (state, action) => {
      const { pageId, layoutData } = action.payload;
      
      // Validate layout data structure
      const validatedLayout = {
        instances: layoutData?.instances || {},
        layout: layoutData?.layout || [],
      };
      
      state.layouts[pageId] = validatedLayout;
      state.isDirty = false;
      state.lastSavedSnapshot = JSON.stringify(validatedLayout);
      state.isLoading = false;
      state.error = null;
      
      // Reset history when loading new layout
      state.history.past = [];
      state.history.future = [];
    },

    /**
     * Failed to load layout
     */
    loadLayoutError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // ========================================
    // LAYOUT UPDATES
    // ========================================

    /**
     * Update entire layout data for a page
     */
    updateLayout: (state, action) => {
      const { pageId, layoutData } = action.payload;
      
      // Save to history before updating
      if (state.layouts[pageId]) {
        state.history.past.push(cloneLayout(state.layouts[pageId]));
        state.history.future = []; // Clear future on new change
        
        // Limit history to 50 items
        if (state.history.past.length > 50) {
          state.history.past.shift();
        }
      }
      
      state.layouts[pageId] = layoutData;
      state.isDirty = true;
    },

    /**
     * Update only layout instances
     */
    updateLayoutInstances: (state, action) => {
      const { pageId, instances } = action.payload;
      
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { ...DEFAULT_LAYOUT };
      }
      
      state.layouts[pageId].instances = instances;
      state.isDirty = true;
    },

    /**
     * Update only layout grid configuration
     */
    updateLayoutGrid: (state, action) => {
      const { pageId, layout } = action.payload;
      
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { ...DEFAULT_LAYOUT };
      }
      
      state.layouts[pageId].layout = layout;
      state.isDirty = true;
    },

    // ========================================
    // SAVE OPERATIONS
    // ========================================

    /**
     * Start saving
     */
    savePending: (state) => {
      state.isSaving = true;
      state.error = null;
    },

    /**
     * Successfully saved layout
     */
    markAsSaved: (state, action) => {
      const { pageId } = action.payload;
      
      state.isDirty = false;
      state.isSaving = false;
      state.lastSaveTime = new Date().toISOString();
      state.lastSavedSnapshot = JSON.stringify(state.layouts[pageId]);
      state.error = null;
    },

    /**
     * Failed to save
     */
    saveError: (state, action) => {
      state.error = action.payload;
      state.isSaving = false;
      // Keep isDirty true so user can retry
    },

    // ========================================
    // RESET & CLEAR
    // ========================================

    /**
     * Reset layout for a specific page
     */
    resetLayout: (state, action) => {
      const { pageId } = action.payload;
      
      state.layouts[pageId] = { ...DEFAULT_LAYOUT };
      state.isDirty = false;
      state.lastSavedSnapshot = null;
      state.error = null;
      state.history.past = [];
      state.history.future = [];
      
      if (state.currentPageId === pageId) {
        state.selectedInstanceId = null;
      }
    },

    /**
     * Clear all layouts and reset state
     */
    clearAllLayouts: (state) => {
      return { ...initialState };
    },

    // ========================================
    // WIDGET INSTANCE MANAGEMENT
    // ========================================

    /**
     * Add a widget instance to the current page
     */
    addWidgetInstance: (state, action) => {
      const { pageId, instance } = action.payload;
      
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { ...DEFAULT_LAYOUT };
      }
      
      // Generate unique ID if not provided
      const instanceId = instance.id || generateWidgetId(instance.type);
      const newInstance = { ...instance, id: instanceId };
      
      // Add instance
      state.layouts[pageId].instances[instanceId] = newInstance;
      
      // Add to layout grid with smart positioning
      const layoutItem = {
        i: instanceId,
        x: instance.layout?.x ?? 0,
        y: instance.layout?.y ?? Infinity, // Place at bottom
        w: instance.layout?.w ?? 4,
        h: instance.layout?.h ?? 3,
        minW: instance.layout?.minW ?? 2,
        minH: instance.layout?.minH ?? 2,
      };
      
      state.layouts[pageId].layout.push(layoutItem);
      state.isDirty = true;
      
      // Auto-select newly added instance
      state.selectedInstanceId = instanceId;
    },

    /**
     * Update instance grid layout (position/size)
     */
    updateInstanceLayout: (state, action) => {
      const { pageId, layout } = action.payload;
      
      if (!state.layouts[pageId]) return;
      
      state.layouts[pageId].layout = layout;
      state.isDirty = true;
    },

    /**
     * Update instance props/configuration
     */
    updateInstanceProps: (state, action) => {
      const { pageId, instanceId, props } = action.payload;
      
      if (!state.layouts[pageId]?.instances[instanceId]) return;
      
      state.layouts[pageId].instances[instanceId].props = {
        ...state.layouts[pageId].instances[instanceId].props,
        ...props,
      };
      state.isDirty = true;
    },

    /**
     * Update entire instance
     */
    updateInstance: (state, action) => {
      const { pageId, instanceId, updates } = action.payload;
      
      if (!state.layouts[pageId]?.instances[instanceId]) return;
      
      state.layouts[pageId].instances[instanceId] = {
        ...state.layouts[pageId].instances[instanceId],
        ...updates,
      };
      state.isDirty = true;
    },

    /**
     * Remove an instance
     */
    removeInstance: (state, action) => {
      const { pageId, instanceId } = action.payload;
      
      if (!state.layouts[pageId]) return;
      
      // Remove from instances
      delete state.layouts[pageId].instances[instanceId];
      
      // Remove from layout grid
      state.layouts[pageId].layout = state.layouts[pageId].layout.filter(
        (item) => item.i !== instanceId
      );
      
      // Clear selection if this instance was selected
      if (state.selectedInstanceId === instanceId) {
        state.selectedInstanceId = null;
      }
      
      state.isDirty = true;
    },

    /**
     * Duplicate an instance
     */
    duplicateInstance: (state, action) => {
      const { pageId, instanceId } = action.payload;
      
      if (!state.layouts[pageId]?.instances[instanceId]) return;
      
      const originalInstance = state.layouts[pageId].instances[instanceId];
      const originalLayout = state.layouts[pageId].layout.find(
        (item) => item.i === instanceId
      );
      
      if (!originalLayout) return;
      
      // Create new instance with unique ID
      const newId = generateWidgetId(originalInstance.type);
      const newInstance = {
        ...cloneLayout(originalInstance),
        id: newId,
      };
      
      // Add new instance
      state.layouts[pageId].instances[newId] = newInstance;
      
      // Add to layout with smart offset positioning
      const offset = 2;
      state.layouts[pageId].layout.push({
        ...originalLayout,
        i: newId,
        x: (originalLayout.x + offset) % state.gridSettings.cols,
        y: originalLayout.y + offset,
      });
      
      state.isDirty = true;
      state.selectedInstanceId = newId; // Select duplicated instance
    },

    /**
     * Batch update multiple instances
     */
    batchUpdateInstances: (state, action) => {
      const { pageId, updates } = action.payload;
      
      if (!state.layouts[pageId]) return;
      
      updates.forEach(({ instanceId, props }) => {
        if (state.layouts[pageId].instances[instanceId]) {
          state.layouts[pageId].instances[instanceId].props = {
            ...state.layouts[pageId].instances[instanceId].props,
            ...props,
          };
        }
      });
      
      state.isDirty = true;
    },

    // ========================================
    // SELECTION MANAGEMENT
    // ========================================

    /**
     * Select an instance
     */
    selectInstance: (state, action) => {
      const { instanceId } = action.payload;
      state.selectedInstanceId = instanceId;
    },

    /**
     * Clear selection
     */
    clearSelection: (state) => {
      state.selectedInstanceId = null;
    },

    // ========================================
    // HISTORY MANAGEMENT (Undo/Redo)
    // ========================================

    /**
     * Undo last change
     */
    undo: (state) => {
      const { currentPageId } = state;
      
      if (!currentPageId || state.history.past.length === 0) return;
      
      const previous = state.history.past.pop();
      state.history.future.unshift(cloneLayout(state.layouts[currentPageId]));
      state.layouts[currentPageId] = previous;
      state.isDirty = true;
    },

    /**
     * Redo last undone change
     */
    redo: (state) => {
      const { currentPageId } = state;
      
      if (!currentPageId || state.history.future.length === 0) return;
      
      const next = state.history.future.shift();
      state.history.past.push(cloneLayout(state.layouts[currentPageId]));
      state.layouts[currentPageId] = next;
      state.isDirty = true;
    },

    /**
     * Clear history
     */
    clearHistory: (state) => {
      state.history.past = [];
      state.history.future = [];
    },

    // ========================================
    // GRID SETTINGS
    // ========================================

    /**
     * Update grid settings
     */
    updateGridSettings: (state, action) => {
      state.gridSettings = {
        ...state.gridSettings,
        ...action.payload,
      };
    },
  },
});

// ========================================
// ACTIONS EXPORT
// ========================================

export const {
  // Page management
  setCurrentPageId,
  
  // Loading
  loadLayoutPending,
  loadLayoutSuccess,
  loadLayoutError,
  
  // Layout updates
  updateLayout,
  updateLayoutInstances,
  updateLayoutGrid,
  
  // Save operations
  savePending,
  markAsSaved,
  saveError,
  
  // Reset & clear
  resetLayout,
  clearAllLayouts,
  
  // Widget instances
  addWidgetInstance,
  updateInstanceLayout,
  updateInstanceProps,
  updateInstance,
  removeInstance,
  duplicateInstance,
  batchUpdateInstances,
  
  // Selection
  selectInstance,
  clearSelection,
  
  // History
  undo,
  redo,
  clearHistory,
  
  // Grid settings
  updateGridSettings,
} = pageLayoutsSlice.actions;

export default pageLayoutsSlice.reducer;

// ========================================
// SELECTORS
// ========================================

// Basic selectors
export const selectCurrentPageId = (state) => state.pageLayouts.currentPageId;
export const selectLayouts = (state) => state.pageLayouts.layouts;
export const selectIsDirty = (state) => state.pageLayouts.isDirty;
export const selectIsLoading = (state) => state.pageLayouts.isLoading;
export const selectIsSaving = (state) => state.pageLayouts.isSaving;
export const selectError = (state) => state.pageLayouts.error;
export const selectLastSaveTime = (state) => state.pageLayouts.lastSaveTime;
export const selectSelectedInstanceId = (state) => state.pageLayouts.selectedInstanceId;
export const selectGridSettings = (state) => state.pageLayouts.gridSettings;

// Loading state selector
export const selectLoadingState = (state) => ({
  isLoading: state.pageLayouts.isLoading,
  isSaving: state.pageLayouts.isSaving,
  error: state.pageLayouts.error,
  lastSaveTime: state.pageLayouts.lastSaveTime,
});

// History selectors
export const selectCanUndo = (state) => state.pageLayouts.history.past.length > 0;
export const selectCanRedo = (state) => state.pageLayouts.history.future.length > 0;

// Memoized selectors using createSelector for better performance

/**
 * Get current page layout
 */
export const selectCurrentLayout = createSelector(
  [selectCurrentPageId, selectLayouts],
  (currentPageId, layouts) => {
    return currentPageId ? layouts[currentPageId] || DEFAULT_LAYOUT : DEFAULT_LAYOUT;
  }
);

/**
 * Get layout for specific page (factory selector)
 */
export const selectCurrentPageLayout = (pageId) =>
  createSelector(
    [selectLayouts],
    (layouts) => layouts[pageId] || DEFAULT_LAYOUT
  );

/**
 * Get selected instance
 */
export const selectSelectedInstance = createSelector(
  [selectSelectedInstanceId, selectCurrentLayout],
  (selectedInstanceId, currentLayout) => {
    if (!selectedInstanceId) return null;
    return currentLayout.instances[selectedInstanceId] || null;
  }
);

/**
 * Get all instances for current page
 */
export const selectCurrentInstances = createSelector(
  [selectCurrentLayout],
  (currentLayout) => currentLayout.instances
);

/**
 * Get current layout grid
 */
export const selectCurrentLayoutGrid = createSelector(
  [selectCurrentLayout],
  (currentLayout) => currentLayout.layout
);

/**
 * Get instance count for current page
 */
export const selectInstanceCount = createSelector(
  [selectCurrentInstances],
  (instances) => Object.keys(instances).length
);

/**
 * Get instances by type
 */
export const selectInstancesByType = (type) =>
  createSelector(
    [selectCurrentInstances],
    (instances) => {
      return Object.values(instances).filter(
        (instance) => instance.type === type
      );
    }
  );

/**
 * Check if page has unsaved changes
 */
export const selectHasUnsavedChanges = createSelector(
  [selectIsDirty, selectCurrentLayout, (state) => state.pageLayouts.lastSavedSnapshot],
  (isDirty, currentLayout, lastSavedSnapshot) => {
    if (!lastSavedSnapshot) return isDirty;
    const currentSnapshot = JSON.stringify(currentLayout);
    return currentSnapshot !== lastSavedSnapshot;
  }
);

/**
 * Get layout metadata
 */
export const selectLayoutMetadata = createSelector(
  [selectCurrentLayout, selectIsDirty, selectLastSaveTime],
  (currentLayout, isDirty, lastSaveTime) => ({
    instanceCount: Object.keys(currentLayout.instances).length,
    layoutItemCount: currentLayout.layout.length,
    isDirty,
    lastSaveTime,
  })
);
