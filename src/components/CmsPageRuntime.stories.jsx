import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Component to story
import CmsPageRuntime from '@components/CmsPageRuntime';

// Import the reducer
import cmsPageReducer from '@redux/slices/cmsPageSlice';

// Mock the services
const mockGetPageBySlug = jest.fn();
const mockLoadPageLayout = jest.fn();

jest.mock('@services/cms/pageLayouts', () => ({
  getPageBySlug: mockGetPageBySlug,
  loadPageLayout: mockLoadPageLayout,
}));

// Mock the widget registry
jest.mock('@cms/registry/widgetRegistry', () => ({
  getWidgetById: jest.fn((type) => ({
    id: type,
    name: `Widget ${type}`,
    Component: ({ title }) => (
      <div style={{ 
        padding: '16px', 
        border: '2px solid #3b82f6', 
        borderRadius: '8px',
        backgroundColor: '#eff6ff'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
          {type} Widget
        </h3>
        {title && <p style={{ margin: 0, color: '#64748b' }}>{title}</p>}
      </div>
    ),
    styleVariants: [],
  })),
}));

const meta: Meta<typeof CmsPageRuntime> = {
  title: 'Components/CmsPageRuntime',
  component: CmsPageRuntime,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
CmsPageRuntime is a wrapper component that enhances AppGrid with CMS capabilities:

1. **CMS Integration**: Fetches page layouts from Supabase when a slug is provided
2. **Graceful Fallback**: Falls back to static widgets when CMS data is unavailable
3. **Dynamic Rendering**: Renders widgets using WidgetRenderer for CMS-driven layouts
4. **Theme Support**: Applies theme overrides via CmsThemeProvider
5. **Error Handling**: Provides loading and error states with retry functionality

## Usage

\`\`\`jsx
<CmsPageRuntime 
  id="admin_dashboard_page" 
  widgets={staticWidgets}
  cmsSlug="admin-dashboard"
  onFallbackMode={(reason) => console.log('Fallback:', reason)}
  onCmsDataLoaded={(data) => console.log('CMS loaded:', data)}
/>
\`\`\`

## Props

- **id**: Layout ID for static fallback (required)
- **widgets**: Static widgets for fallback mode (required)
- **cmsSlug**: CMS page slug to fetch layout from (optional)
- **fallbackLayout**: Optional fallback layout when CMS data not found
- **onCmsDataLoaded**: Callback when CMS data is successfully loaded
- **onFallbackMode**: Callback when falling back to static mode
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const store = configureStore({
        reducer: {
          cmsPage: cmsPageReducer,
        },
      });

      return (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <Story />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </Provider>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock widgets for stories
const mockWidgets = {
  header: (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#1e293b', 
      color: 'white',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <h2 style={{ margin: 0 }}>Static Header Widget</h2>
    </div>
  ),
  content: (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px'
    }}>
      <h3>Static Content Widget</h3>
      <p>This is a fallback widget that displays when CMS data is not available.</p>
    </div>
  ),
  footer: (
    <div style={{ 
      padding: '16px', 
      backgroundColor: '#f1f5f9',
      borderRadius: '8px',
      marginTop: '16px'
    }}>
      <p style={{ margin: 0, textAlign: 'center', color: '#64748b' }}>
        Static Footer Widget
      </p>
    </div>
  ),
};

// Mock CMS data
const mockCmsLayout = [
  { i: 'stats-widget', x: 0, y: 0, w: 2, h: 2 },
  { i: 'chart-widget', x: 2, y: 0, w: 2, h: 2 },
  { i: 'activity-widget', x: 0, y: 2, w: 4, h: 1 },
];

const mockCmsInstances = {
  'stats-widget': {
    type: 'stats',
    props: { title: 'System Statistics' },
    variant: 'default',
  },
  'chart-widget': {
    type: 'chart',
    props: { title: 'Performance Chart' },
    variant: 'default',
  },
  'activity-widget': {
    type: 'activity',
    props: { title: 'Recent Activity' },
    variant: 'compact',
  },
};

export const StaticOnly: Story = {
  name: 'Static Only (No CMS)',
  render: () => (
    <CmsPageRuntime 
      id="static-layout" 
      widgets={mockWidgets}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Renders only static widgets when no CMS slug is provided. This is the fallback mode.',
      },
    },
  },
};

export const CmsNotFound: Story = {
  name: 'CMS Page Not Found',
  render: () => {
    mockGetPageBySlug.mockResolvedValue(null);
    
    return (
      <CmsPageRuntime 
        id="fallback-layout" 
        widgets={mockWidgets}
        cmsSlug="non-existent-page"
        onFallbackMode={(reason) => {
          console.log('Fallback reason:', reason);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Attempts to load CMS data but falls back to static widgets when the page is not found in the CMS.',
      },
    },
  },
};

export const CmsLoaded: Story = {
  name: 'CMS Layout Loaded',
  render: () => {
    mockGetPageBySlug.mockResolvedValue({ 
      id: 1, 
      slug: 'test-page', 
      title: 'Test Page',
      is_published: true 
    });
    
    mockLoadPageLayout.mockResolvedValue({
      layout_json: {
        layout: mockCmsLayout,
        instances: mockCmsInstances,
        theme_overrides: {
          variant: 'default',
          mode: 'light',
          primaryColor: '#3b82f6',
        },
      },
    });

    return (
      <CmsPageRuntime 
        id="cms-layout" 
        widgets={mockWidgets}
        cmsSlug="test-page"
        onCmsDataLoaded={(data) => {
          console.log('CMS data loaded:', data);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Successfully loads and renders CMS layout with dynamic widgets. The static widgets are replaced with CMS-rendered widgets.',
      },
    },
  },
};

export const CmsWithTheme: Story = {
  name: 'CMS with Theme Overrides',
  render: () => {
    mockGetPageBySlug.mockResolvedValue({ 
      id: 1, 
      slug: 'themed-page', 
      title: 'Themed Page',
      is_published: true 
    });
    
    mockLoadPageLayout.mockResolvedValue({
      layout_json: {
        layout: mockCmsLayout,
        instances: mockCmsInstances,
        theme_overrides: {
          variant: 'dark',
          mode: 'dark',
          primaryColor: '#8b5cf6',
          backgroundColor: '#1e293b',
        },
      },
    });

    return (
      <CmsPageRuntime 
        id="themed-layout" 
        widgets={mockWidgets}
        cmsSlug="themed-page"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Loads CMS layout with theme overrides. The CmsThemeProvider wraps the content to apply the custom theme.',
      },
    },
  },
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => {
    mockGetPageBySlug.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 2000))
    );

    return (
      <CmsPageRuntime 
        id="loading-layout" 
        widgets={mockWidgets}
        cmsSlug="slow-page"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while fetching CMS data from the server.',
      },
    },
  },
};

export const ErrorState: Story = {
  name: 'Error State',
  render: () => {
    mockGetPageBySlug.mockRejectedValue(new Error('Network connection failed'));

    return (
      <CmsPageRuntime 
        id="error-layout" 
        widgets={mockWidgets}
        cmsSlug="error-page"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays an error state when CMS data fails to load. Includes a retry button for users to attempt loading again.',
      },
    },
  },
};