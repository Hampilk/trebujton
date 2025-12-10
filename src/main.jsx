import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@contexts/themeContext';
import { ShopProvider } from '@contexts/shopContext';
import StyledComponentsProvider from '@providers/StyledComponentsProvider';
import App from './App';
import store from './app/store';

// Performance monitoring setup for JSX audit
// Import React DevTools Profiler in development
if (process.env.NODE_ENV === 'development') {
  // Enable React DevTools Profiler API
  import('react-dom/profiling');
  
  // Enable why-did-you-render if available (install via: npm i --save-dev @welldone-software/why-did-you-render)
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

// Root element megszerzése biztonságosan
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure your HTML file contains a <div id="root"></div> element.'
  );
}

// Root létrehozása
const root = createRoot(rootElement);

// Provider hierarchia optimalizálása
// Megjegyzés: StrictMode kikapcsolva a third-party library kompatibilitás miatt
// Ha szükséges, később visszakapcsolható amikor minden dependency frissítve van
const AppProviders = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <StyledComponentsProvider>
          <ShopProvider>
            {children}
          </ShopProvider>
        </StyledComponentsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);

// Error boundary wrapper (opcionális, de ajánlott production környezetben)
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
    // Itt küldhetsz error report-ot a monitoring service-ednek
  }

  render() {
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