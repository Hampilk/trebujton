
import React, { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@contexts/themeContext';
import { ShopProvider } from '@contexts/shopContext';
import { AuthProvider } from '@contexts/AuthContext';
import StyledComponentsProvider from '@providers/StyledComponentsProvider';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import store from './app/store';
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure your HTML file contains a <div id="root"></div> element.'
  );
}

const root = createRoot(rootElement);

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <StyledComponentsProvider>
              <ShopProvider>
                {children}
              </ShopProvider>
            </StyledComponentsProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </Provider>
);

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Valami hiba történt</h1>
          <p>Kérjük, frissítsd az oldalt vagy próbáld újra később.</p>
          <button onClick={() => window.location.reload()}>
            Újratöltés
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Alkalmazás renderelése
root.render(
  <ErrorBoundary>
    <AppProviders>
      <App />
    </AppProviders>
  </ErrorBoundary>
);