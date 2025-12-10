import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePageLayout } from "@/hooks/cms/usePageLayout";
import { useSavePageLayout } from "@/hooks/cms/useSavePageLayout";
import { useAutosaveLayout } from "@/hooks/cms/useAutosaveLayout";
import {
  updateLayout,
  setCurrentPageId,
  selectIsDirty,
  selectLoadingState,
} from "@features/cms/pageLayoutsSlice";
import { GridEditor } from "@/cms/builder/GridEditor";
import { WidgetPicker } from "@/cms/builder/WidgetPicker";
import PropsEditor from "@/cms/runtime/PropsEditor";
import { toast } from "react-toastify";

// Constants
const PANEL_TYPES = {
  WIDGETS: "widgets",
  PROPS: "props",
};

const DEFAULT_LAYOUT = {
  instances: {},
  layout: [],
};

const AUTOSAVE_DEBOUNCE_MS = 5000;

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({ error, title = "Failed to load layout" }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center max-w-md px-4">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-600 mb-2 font-semibold">{title}</p>
      {error?.message && (
        <p className="text-sm text-gray-500">{error.message}</p>
      )}
    </div>
  </div>
);

/**
 * Status Badge Component
 */
const StatusBadge = ({ type, children }) => {
  const styles = {
    unsaved: "bg-yellow-100 text-yellow-800",
    saving: "bg-blue-100 text-blue-800 animate-pulse",
    info: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}
    >
      {children}
    </span>
  );
};

/**
 * Toolbar Component
 */
const Toolbar = ({
  isDirty,
  isAutosaving,
  isSaving,
  lastSaveTime,
  onSave,
}) => {
  const formattedSaveTime = useMemo(() => {
    if (!lastSaveTime) return null;
    return new Date(lastSaveTime).toLocaleTimeString();
  }, [lastSaveTime]);

  const isSaveDisabled = !isDirty || isSaving || isAutosaving;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Page Builder</h2>

        <div className="flex items-center gap-2">
          {isDirty && <StatusBadge type="unsaved">Unsaved Changes</StatusBadge>}
          {isAutosaving && <StatusBadge type="saving">Autosaving...</StatusBadge>}
          {formattedSaveTime && (
            <StatusBadge type="info">Last saved: {formattedSaveTime}</StatusBadge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaveDisabled}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isSaveDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
          }`}
          aria-label={isSaving ? "Saving changes" : "Save changes"}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Sidebar Panel Tabs Component
 */
const PanelTabs = ({ activePanel, onPanelChange }) => {
  const tabs = [
    { id: PANEL_TYPES.WIDGETS, label: "Widgets", icon: "🧩" },
    { id: PANEL_TYPES.PROPS, label: "Properties", icon: "⚙️" },
  ];

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activePanel === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
            aria-pressed={activePanel === tab.id}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * BuilderLayout Component
 * Manages page layout editing with Supabase persistence and autosave
 *
 * @param {Object} props
 * @param {string} props.pageId - The ID of the page being edited
 * @param {Object} props.initialLayout - Initial layout structure (optional)
 * @param {Function} props.onSave - Callback function after successful save (optional)
 */
function BuilderLayout({ pageId, initialLayout = null, onSave = null }) {
  const dispatch = useDispatch();
  const [activePanel, setActivePanel] = useState(PANEL_TYPES.WIDGETS);

  // Redux selectors
  const layouts = useSelector((state) => state.pageLayouts.layouts);
  const isDirty = useSelector(selectIsDirty);
  const { isLoading, error, lastSaveTime } = useSelector(selectLoadingState);

  // Load layout from Supabase
  const { isLoading: isLoadingLayout, error: loadError } = usePageLayout(
    pageId,
    {
      onSuccess: (data) => {
        if (!data) {
          // No layout found, initialize with default
          const defaultLayout = initialLayout || DEFAULT_LAYOUT;
          dispatch(updateLayout({ pageId, layoutData: defaultLayout }));
        }
      },
    }
  );

  // Save layout to Supabase
  const { save: saveLayout, isPending: isSaving } = useSavePageLayout();

  // Autosave functionality
  const { isSaving: isAutosaving } = useAutosaveLayout(pageId, {
    debounceMs: AUTOSAVE_DEBOUNCE_MS,
    enabled: true,
    showToasts: false,
  });

  // Set current page in Redux on mount or page change
  useEffect(() => {
    dispatch(setCurrentPageId(pageId));

    // Cleanup function
    return () => {
      // Optional: Clear current page on unmount
      // dispatch(setCurrentPageId(null));
    };
  }, [pageId, dispatch]);

  // Handle manual save with error handling
  const handleSave = useCallback(async () => {
    const currentLayout = layouts[pageId];

    if (!currentLayout) {
      toast.error("No layout to save");
      return;
    }

    try {
      await saveLayout({
        pageId,
        layoutPayload: currentLayout,
      });

      toast.success("Layout saved successfully");

      // Call optional callback
      if (onSave) {
        onSave(currentLayout);
      }
    } catch (err) {
      toast.error("Failed to save layout");
      console.error("Save error:", err);
    }
  }, [pageId, layouts, saveLayout, onSave]);

  // Memoize current layout
  const currentLayout = useMemo(
    () => layouts[pageId] || DEFAULT_LAYOUT,
    [layouts, pageId]
  );

  // Handle panel change
  const handlePanelChange = useCallback((panelId) => {
    setActivePanel(panelId);
  }, []);

  // Loading state
  if (isLoadingLayout) {
    return <LoadingSpinner message="Loading layout..." />;
  }

  // Error state
  if (loadError || error) {
    return <ErrorDisplay error={loadError || error} />;
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar
        isDirty={isDirty}
        isAutosaving={isAutosaving}
        isSaving={isSaving}
        lastSaveTime={lastSaveTime}
        onSave={handleSave}
      />

      {/* Main Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Widget Picker & Properties */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <PanelTabs
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activePanel === PANEL_TYPES.WIDGETS && <WidgetPicker />}
            {activePanel === PANEL_TYPES.PROPS && (
              <PropsEditor pageId={pageId} onSave={handleSave} />
            )}
          </div>
        </aside>

        {/* Main Grid Editor */}
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm h-full min-h-[600px] p-4">
            <GridEditor layoutData={currentLayout} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default BuilderLayout;
