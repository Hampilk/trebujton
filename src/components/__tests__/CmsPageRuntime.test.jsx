// Mock everything before any imports
jest.mock('@cms/registry/widgetRegistry', () => ({
  getWidgetById: jest.fn(),
  widgetRegistry: [],
}));

jest.mock('@services/cms/pageLayouts', () => ({
  getPageBySlug: jest.fn(),
  loadPageLayout: jest.fn(),
}));

jest.mock('@cms/theme/ThemeProvider', () => ({
  CmsThemeProvider: ({ children }) => (
    <div data-testid="cms-theme-provider">{children}</div>
  ),
}));

jest.mock('@layout/AppGrid', () => {
  return function MockAppGrid({ id, widgets }) {
    return (
      <div data-testid="app-grid" data-layout-id={id}>
        {Object.entries(widgets).map(([key, widget]) => (
          <div key={key} data-testid={`grid-item-${key}`}>
            {widget}
          </div>
        ))}
      </div>
    );
  };
});

import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Component to test
import CmsPageRuntime from '@components/CmsPageRuntime';

// Import the mocked functions
const { getPageBySlug, loadPageLayout } = require('@services/cms/pageLayouts');

describe('CmsPageRuntime', () => {
  let queryClient;
  let store;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    store = configureStore({
      reducer: {
        cmsPage: require('@redux/slices/cmsPageSlice').default,
      },
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {component}
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  };

  const mockWidgets = {
    testWidget: <div data-testid="static-widget">Static Widget</div>,
  };

  describe('Fallback behavior', () => {
    it('should render static widgets when no CMS slug provided', async () => {
      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
        />
      );

      expect(screen.getByTestId('app-grid')).toBeInTheDocument();
      expect(screen.getByTestId('static-widget')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-testWidget')).toBeInTheDocument();
    });

    it('should render static widgets when CMS page not found', async () => {
      getPageBySlug.mockResolvedValue(null);

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="non-existent-page"
        />
      );

      await waitFor(() => {
        expect(getPageBySlug).toHaveBeenCalledWith('non-existent-page');
      });

      // Should fall back to static widgets
      expect(screen.getByTestId('static-widget')).toBeInTheDocument();
    });

    it('should render static widgets when CMS layout not found', async () => {
      getPageBySlug.mockResolvedValue({ id: 1, slug: 'test-page', title: 'Test Page' });
      loadPageLayout.mockResolvedValue(null);

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="test-page"
        />
      );

      await waitFor(() => {
        expect(getPageBySlug).toHaveBeenCalledWith('test-page');
        expect(loadPageLayout).toHaveBeenCalledWith(1);
      });

      // Should fall back to static widgets
      expect(screen.getByTestId('static-widget')).toBeInTheDocument();
    });
  });

  describe('CMS rendering', () => {
    const mockCmsLayout = [
      { i: 'widget1', x: 0, y: 0, w: 2, h: 2 },
      { i: 'widget2', x: 2, y: 0, w: 2, h: 2 },
    ];

    const mockCmsInstances = {
      widget1: {
        type: 'stats',
        props: { title: 'Statistics' },
        variant: 'default',
      },
      widget2: {
        type: 'chart',
        props: { data: [1, 2, 3] },
        variant: 'compact',
      },
    };

    const mockThemeOverrides = {
      variant: 'dark',
      mode: 'dark',
      primaryColor: '#3b82f6',
    };

    it('should render CMS widgets when layout data is available', async () => {
      getPageBySlug.mockResolvedValue({ id: 1, slug: 'test-page', title: 'Test Page' });
      loadPageLayout.mockResolvedValue({
        layout_json: {
          layout: mockCmsLayout,
          instances: mockCmsInstances,
          theme_overrides: mockThemeOverrides,
        },
      });

      // Mock the widget renderer to return simple elements
      const { getWidgetById } = require('@cms/registry/widgetRegistry');
      getWidgetById.mockImplementation((type) => ({
        id: type,
        name: `Widget ${type}`,
        Component: ({ title }) => (
          <div data-testid={`widget-${type}`}>
            <h3>{type} Widget</h3>
            {title && <p>{title}</p>}
          </div>
        ),
        styleVariants: [],
      }));

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="test-page"
        />
      );

      await waitFor(() => {
        expect(getPageBySlug).toHaveBeenCalledWith('test-page');
        expect(loadPageLayout).toHaveBeenCalledWith(1);
      });

      // Should render CMS widgets instead of static
      expect(screen.queryByTestId('static-widget')).not.toBeInTheDocument();
      expect(screen.getByTestId('widget-stats')).toBeInTheDocument();
      expect(screen.getByTestId('widget-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cms-theme-provider')).toBeInTheDocument();
    });

    it('should call onCmsDataLoaded when CMS data is loaded', async () => {
      const onCmsDataLoaded = jest.fn();

      getPageBySlug.mockResolvedValue({ id: 1, slug: 'test-page', title: 'Test Page' });
      loadPageLayout.mockResolvedValue({
        layout_json: {
          layout: mockCmsLayout,
          instances: mockCmsInstances,
          theme_overrides: mockThemeOverrides,
        },
      });

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="test-page"
          onCmsDataLoaded={onCmsDataLoaded}
        />
      );

      await waitFor(() => {
        expect(onCmsDataLoaded).toHaveBeenCalledWith({
          layout: mockCmsLayout,
          instances: mockCmsInstances,
          theme_overrides: mockThemeOverrides,
          page: { id: 1, slug: 'test-page', title: 'Test Page' },
        });
      });
    });

    it('should call onFallbackMode when fallback occurs', async () => {
      const onFallbackMode = jest.fn();

      getPageBySlug.mockResolvedValue(null);

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="non-existent-page"
          onFallbackMode={onFallbackMode}
        />
      );

      await waitFor(() => {
        expect(onFallbackMode).toHaveBeenCalledWith('page_not_found');
      });
    });
  });

  describe('Loading and error states', () => {
    it('should show loading state while fetching CMS data', async () => {
      getPageBySlug.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="loading-page"
        />
      );

      // Should show loading state initially
      expect(screen.getByText('Loading CMS layout...')).toBeInTheDocument();
      
      // Static widgets should not be visible during loading
      expect(screen.queryByTestId('static-widget')).not.toBeInTheDocument();
    });

    it('should show error state when CMS fetch fails', async () => {
      getPageBySlug.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <CmsPageRuntime 
          id="test-layout" 
          widgets={mockWidgets}
          cmsSlug="error-page"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load CMS layout')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });
});