import React, { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import ReactGA from "react-ga4";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Styling & Providers
import { ThemeProvider as StyledThemeProvider, StyleSheetManager } from "styled-components";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import rtlPlugin from "stylis-plugin-rtl";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import ThemeStyles from "@styles/theme";
import "./style.scss";

// Contexts
import { SidebarProvider } from "@/contexts/sidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useThemeProvider } from "@/contexts/themeContext";

// Hooks
import { useWindowSize } from "react-use";
import useAuthRoute from "@/hooks/useAuthRoute";

// Components
import { Route, Routes, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/layout/Sidebar";
import Navbar from "@/layout/Navbar";
import BottomNav from "@/layout/BottomNav";
import ShoppingCart from "@/widgets/ShoppingCart";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGate from "@/components/RoleGate";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

// Grid and UI libs
import "react-grid-layout/css/styles.css";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

// Pages
const ClubSummary = lazy(() => import("@pages/ClubSummary"));
const GameSummary = lazy(() => import("@pages/GameSummary"));
const Championships = lazy(() => import("@pages/Championships"));
const LeagueOverview = lazy(() => import("@pages/LeagueOverview"));
const FansCommunity = lazy(() => import("@pages/FansCommunity"));
const Statistics = lazy(() => import("@pages/Statistics"));
const PageNotFound = lazy(() => import("@pages/PageNotFound"));
const MatchSummary = lazy(() => import("@pages/MatchSummary"));
const MatchOverview = lazy(() => import("@pages/MatchOverview"));
const PlayerProfile = lazy(() => import("@pages/PlayerProfile"));
const Schedule = lazy(() => import("@pages/Schedule"));
const Tickets = lazy(() => import("@pages/Tickets"));
const FootballStore = lazy(() => import("@pages/FootballStore"));
const BrandStore = lazy(() => import("@pages/BrandStore"));
const Product = lazy(() => import("@pages/Product"));
const Login = lazy(() => import("@pages/Login"));
const SignUp = lazy(() => import("@pages/SignUp"));
const Settings = lazy(() => import("@pages/Settings"));

// WinMix Pro Admin (CMS)
const WinmixProAdmin = lazy(() => import("@pages/winmixpro"));

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const appRef = useRef(null);
  const { theme, direction } = useThemeProvider();
  const location = useLocation();
  const isAuthRoute = useAuthRoute();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Google Analytics
  useEffect(() => {
    const gaKey = import.meta.env.VITE_PUBLIC_GA;
    if (gaKey) ReactGA.initialize(gaKey);
  }, []);

  // RTL Support
  const plugins = useMemo(() => (direction === "rtl" ? [rtlPlugin] : []), [direction]);

  // MUI Theme
  const muiTheme = useMemo(() => createTheme({ direction }), [direction]);

  // Emotion RTL Cache
  const emotionCache = useMemo(
    () =>
      createCache({
        key: direction === "rtl" ? "muirtl" : "muiltr",
        stylisPlugins: plugins,
      }),
    [direction]
  );

  // Toast Position
  const toastPosition = direction === "rtl" ? "top-left" : "top-right";

  // Scroll to top on route change
  useEffect(() => {
    appRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CacheProvider value={emotionCache}>
          <MuiThemeProvider theme={muiTheme}>
            <SidebarProvider>
              <StyledThemeProvider theme={{ theme }}>
                <ThemeStyles />

                <ToastContainer theme={theme} position={toastPosition} autoClose={2500} />

                <StyleSheetManager stylisPlugins={plugins}>
                  <div className={`app ${isAuthRoute ? "fluid" : ""}`} ref={appRef}>
                    <ScrollToTop />

                    {/* Layout wrappers except auth pages */}
                    {!isAuthRoute && (
                      <>
                        <Sidebar />
                        {isMobile && <Navbar />}
                        {isMobile && <BottomNav />}
                      </>
                    )}

                    <div className="app_container">
                      <div className="app_container-content d-flex flex-column flex-1">
                        <Suspense fallback={<LoadingScreen />}>
                          <Routes>
                            {/* Public */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/sign-up" element={<SignUp />} />

                            {/* Protected */}
                            <Route path="/" element={<ProtectedRoute><ClubSummary /></ProtectedRoute>} />
                            <Route path="/game-summary" element={<ProtectedRoute><GameSummary /></ProtectedRoute>} />
                            <Route path="/championships" element={<ProtectedRoute><Championships /></ProtectedRoute>} />
                            <Route path="/league-overview" element={<ProtectedRoute><LeagueOverview /></ProtectedRoute>} />
                            <Route path="/fans-community" element={<ProtectedRoute><FansCommunity /></ProtectedRoute>} />
                            <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                            <Route path="/match-summary" element={<ProtectedRoute><MatchSummary /></ProtectedRoute>} />
                            <Route path="/match-overview" element={<ProtectedRoute><MatchOverview /></ProtectedRoute>} />
                            <Route path="/player-profile" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
                            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
                            <Route path="/football-store" element={<ProtectedRoute><FootballStore /></ProtectedRoute>} />
                            <Route path="/brand-store" element={<ProtectedRoute><BrandStore /></ProtectedRoute>} />
                            <Route path="/product" element={<ProtectedRoute><Product /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                            {/* Admin (CMS) */}
                            <Route
                              path="/winmixpro/admin/*"
                              element={
                                <ProtectedRoute>
                                  <RoleGate allowedRoles={["admin"]}>
                                    <WinmixProAdmin />
                                  </RoleGate>
                                </ProtectedRoute>
                              }
                            />

                            {/* 404 */}
                            <Route path="*" element={<PageNotFound />} />
                          </Routes>
                        </Suspense>
                      </div>
                    </div>

                    <ShoppingCart isPopup />
                  </div>
                </StyleSheetManager>
              </StyledThemeProvider>
            </SidebarProvider>
          </MuiThemeProvider>
        </CacheProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
