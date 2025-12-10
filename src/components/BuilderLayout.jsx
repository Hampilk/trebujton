import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePageLayout } from "@/hooks/cms/usePageLayout";
import { useSavePageLayout } from "@/hooks/cms/useSavePageLayout";
import { useAutosaveLayout } from "@/hooks/cms/useAutosaveLayout";
import {
  updateLayout,
  setCurrentPageId,
  selectIsDirty,
  selectLoadingState,
} from "../../features/cms/pageLayoutsSlice";
import { GridEditor } from "@/cms/builder/GridEditor";
import { WidgetPicker } from "@/cms/builder/WidgetPicker";
import PropsEditor from "@/cms/runtime/PropsEditor";
import { toast } from "react-toastify";

/**
 * BuilderLayout Component
 * Manages page layout editing with Supabase persistence and autosave
 */
function BuilderLayout({ pageId, initialLayout = null, onSave = null }) {
  const dispatch = useDispatch();
  const [activePanel, setActivePanel] = useState("widgets"); // "widgets" | "props"
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
          const defaultLayout = initialLayout || { instances: {}, layout: [] };
          dispatch(updateLayout({ pageId, layoutData: defaultLayout }));
        }
      },
    },
  );

  // Save layout to Supabase
  const { save: saveLayout, isPending: isSaving } = useSavePageLayout();

  // Autosave functionality
  const { isSaving: isAutosaving } = useAutosaveLayout(pageId, {
    debounceMs: 5000,
    enabled: true,
    showToasts: false,
  });

  // Set current page in Redux
  useEffect(() => {
    dispatch(setCurrentPageId(pageId));
  }, [pageId, dispatch]);

  // Handle manual save
  const handleSave = useCallback(() => {
    const currentLayout = layouts[pageId];
    if (!currentLayout) {
      toast.error("No layout to save");
      return;
    }

    saveLayout({
      pageId,
      layoutPayload: currentLayout,
    });
    if (onSave) {
      onSave(currentLayout);
    }
  }, [pageId, layouts, saveLayout, onSave]);

  // Get current layout
  const currentLayout = layouts[pageId] || { instances: {}, layout: [] };

  // Loading state
  if (isLoadingLayout) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load layout</p>
          <p className="text-sm text-gray-500">{loadError?.message || error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Page Builder</h2>
          {isDirty && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </span>
          )}
          {isAutosaving && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Autosaving...
            </span>
          )}
          {lastSaveTime && (
            <span className="text-xs text-gray-500">
              Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving || isAutosaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDirty && !isSaving && !isAutosaving
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Widget Picker */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePanel("widgets")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === "widgets"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Widgets
              </button>
              <button
                onClick={() => setActivePanel("props")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === "props"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Properties
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activePanel === "widgets" && <WidgetPicker />}
            {activePanel === "props" && <PropsEditor pageId={pageId} onSave={handleSave} />}
          </div>
        </div>

        {/* Main Grid Editor */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm h-full min-h-[600px]">
            <GridEditor />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuilderLayout;
