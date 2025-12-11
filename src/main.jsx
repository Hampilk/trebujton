import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Styling
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

// Contexts
import { ThemeProvider } from '@contexts/themeContext';
import { ShopProvider } from '@contexts/shopContext';
import { SidebarProvider } from '@contexts/sidebarContext';
import { SupabaseProvider } from '@contexts/SupabaseProvider';
import { AuthProvider } from '@contexts/AuthContext';
import { useThemeProvider } from '@contexts/themeContext';

// Providers
import StyledComponentsProvider from '@providers/StyledComponentsProvider';

// Components
import App from './App';
import store from './app/store';

// Grid and UI libs
import 'react-grid-layout/css/styles.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// Performance monitoring setup for development
if (process.env.NODE_ENV === 'development') {
  import('react-dom/profiling');
  
  try {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React, {
      trackAllPureComponents: true,
      trackHooks: true,
      logOnDifferentValues: true,
    });
    console.log('🔍 why-did-you-render enabled for performance audit');
  } catch (e) {
    console.log('⚠️  why-did-you-render not installed. Install with: npm i --save-dev @welldone-software/why-did-you-render');
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure your HTML file contains a <div id="root"></div> element.'
  );
}

const root = createRoot(rootElement);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Inner component for theme access
const AppWithTheme = ({ children }) => {
  const { theme, direction } = useThemeProvider();
  
  const muiTheme = React.useMemo(() => createTheme({ direction }), [direction]);
  const plugins = React.useMemo(() => (direction === 'rtl' ? [rtlPlugin] : []), [direction]);
  const emotionCache = React.useMemo(
    () =>
      createCache({
        key: direction === 'rtl' ? 'muirtl' : 'muiltr',
        stylisPlugins: plugins,
      }),
    [direction]
  );
  const toastPosition = direction === 'rtl' ? 'top-left' : 'top-right';

  return (
    <CacheProvider value={emotionCache}>
      <MuiThemeProvider theme={muiTheme}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </MuiThemeProvider>
    </CacheProvider>
  );
};

// Main provider composition
// Hierarchy: Redux → Router → Supabase → Theme → StyledComponents → Shop → QueryClient → Auth → Layout/Toast
const AppProviders = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SupabaseProvider>
        <ThemeProvider>
          <StyledComponentsProvider>
            <ShopProvider>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <AppWithTheme>
                    <ToastContainer autoClose={2500} />
                    {children}
                  </AppWithTheme>
                </AuthProvider>
              </QueryClientProvider>
            </ShopProvider>
          </StyledComponentsProvider>
        </ThemeProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </Provider>
);

// Error boundary wrapper
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

root.render(
  <ErrorBoundary>
    <AppProviders>
      <App />
    </AppProviders>
  </ErrorBoundary>
);