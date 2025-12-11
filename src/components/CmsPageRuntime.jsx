import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';

// Redux
import {
  loadCmsPageLayout,
  selectCmsPageData,
  selectCmsPageLoading,
  selectCmsPageError,
  selectCmsPageInitialized,
  selectCmsPageLayout,
  selectCmsPageInstances,
  selectCmsPageThemeOverrides,
} from '@redux/slices/cmsPageSlice';

// CMS Components
import { WidgetRenderer } from '@cms/runtime/WidgetRenderer';
import { CmsThemeProvider } from '@cms/theme/ThemeProvider';
import { buildWidgetMap } from '@cms/runtime/buildWidgetMap';

// Layout
import AppGrid from '@layout/AppGrid';

// Services
import { getPageBySlug, loadPageLayout } from '@services/cms/pageLayouts';

/**
 * CmsPageRuntime - Wrapper component that hydrates AppGrid from CMS data
 * 
 * This component:
 * 1. Fetches page layout data from Supabase when a slug is provided
 * 2. Falls back to static layout if no CMS data exists
 * 3. Renders widgets using WidgetRenderer for CMS-driven layouts
 * 4. Applies theme overrides via CmsThemeProvider
 * 5. Handles loading and error states gracefully
 */
const CmsPageRuntime = ({ 
  id, 
  widgets, 
  cmsSlug, 
  fallbackLayout = null,
  onCmsDataLoaded = null,
  onFallbackMode = null,
}) => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const cmsPageData = useSelector(selectCmsPageData);
  const isLoading = useSelector(selectCmsPageLoading);
  const error = useSelector(selectCmsPageError);
  const isInitialized = useSelector(selectCmsPageInitialized);
  const cmsLayout = useSelector(selectCmsPageLayout);
  const cmsInstances = useSelector(selectCmsPageInstances);
  const cmsThemeOverrides = useSelector(selectCmsPageThemeOverrides);

  // React Query for fetching CMS data
  const {
    data: cmsQueryData,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['cmsPage', cmsSlug],
    queryFn: async () => {
      if (!cmsSlug) return null;
      
      try {
        // First get the page by slug
        const page = await getPageBySlug(cmsSlug);
        if (!page) {
          return { page: null, layout: null, notFound: true };
        }

        // Then load the layout
        const layoutData = await loadPageLayout(page.id);
        
        return {
          page,
          layout: layoutData,
          notFound: false,
        };
      } catch (err) {
        console.error('Error fetching CMS page:', err);
        throw err;
      }
    },
    enabled: !!cmsSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Process CMS data and update Redux state
  useEffect(() => {
    if (cmsQueryData && !cmsQueryData.notFound) {
      const { layout } = cmsQueryData;
      
      if (layout && layout.layout_json) {
        const { layout: layoutArray, instances, theme_overrides } = layout.layout_json;
        
        // Dispatch to Redux state
        dispatch({
          type: 'cmsPage/initializePageOverrides',
          payload: {
            layout: layoutArray,
            instances,
            theme_overrides,
          },
        });
        
        // Notify parent component
        if (onCmsDataLoaded) {
          onCmsDataLoaded({
            layout: layoutArray,
            instances,
            theme_overrides,
            page: cmsQueryData.page,
          });
        }
      } else {
        // No layout data found
        if (onFallbackMode) {
          onFallbackMode('no_layout');
        }
      }
    } else if (cmsQueryData?.notFound) {
      // Page not found in CMS
      if (onFallbackMode) {
        onFallbackMode('page_not_found');
      }
    }
  }, [cmsQueryData, dispatch, onCmsDataLoaded, onFallbackMode]);

  // Generate widgets from CMS layout data using buildWidgetMap
  const cmsWidgets = useMemo(() => {
    if (!isInitialized || !cmsLayout || !cmsInstances) {
      return null;
    }

    // Use buildWidgetMap to build widgets from registry
    const generatedWidgets = buildWidgetMap(cmsLayout, cmsInstances);
    
    return generatedWidgets;
  }, [isInitialized, cmsLayout, cmsInstances]);

  // Determine which widgets to use and whether to wrap with theme provider
  const shouldUseCmsData = cmsSlug && isInitialized && cmsWidgets;
  const finalWidgets = shouldUseCmsData ? cmsWidgets : widgets;
  const shouldWrapWithTheme = shouldUseCmsData && Object.keys(cmsThemeOverrides).length > 0;

  // Loading state
  if (cmsSlug && (isQueryLoading || isLoading)) {
    return (
      <div className="layout w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading CMS layout...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (cmsSlug && (error || queryError)) {
    return (
      <div className="layout w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Failed to load CMS layout
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error?.message || queryError?.message || 'Unknown error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the AppGrid with optional CMS theme provider
  const appGrid = (
    <AppGrid
      id={id}
      widgets={finalWidgets}
    />
  );

  // Wrap with CMS theme provider if we have CMS data with theme overrides
  if (shouldWrapWithTheme) {
    return (
      <CmsThemeProvider
        defaultVariant={cmsThemeOverrides.variant || 'default'}
        defaultMode={cmsThemeOverrides.mode || 'light'}
      >
        {appGrid}
      </CmsThemeProvider>
    );
  }

  return appGrid;
};

CmsPageRuntime.propTypes = {
  /** Layout ID for static fallback */
  id: PropTypes.string.isRequired,
  /** Static widgets for fallback mode */
  widgets: PropTypes.objectOf(PropTypes.node).isRequired,
  /** CMS page slug to fetch layout from */
  cmsSlug: PropTypes.string,
  /** Optional fallback layout when CMS data not found */
  fallbackLayout: PropTypes.object,
  /** Callback when CMS data is successfully loaded */
  onCmsDataLoaded: PropTypes.func,
  /** Callback when falling back to static mode */
  onFallbackMode: PropTypes.func,
};

CmsPageRuntime.displayName = 'CmsPageRuntime';

export default CmsPageRuntime;