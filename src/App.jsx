import React, { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import ReactGA from "react-ga4";
import { StyleSheetManager } from "styled-components";
import rtlPlugin from "stylis-plugin-rtl";

// Styling
import ThemeStyles from "@styles/theme";
import "./style.scss";

// Contexts
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
const Profile = lazy(() => import("@pages/Profile"));
const Settings = lazy(() => import("@pages/Settings"));
const Teams = lazy(() => import("@pages/Teams"));
const TeamDetail = lazy(() => import("@pages/TeamDetail"));

// Admin Pages
const AdminDashboard = lazy(() => import("@pages/admin/AdminDashboard"));
const ModelsPage = lazy(() => import("@pages/ModelsPage"));
const PredictionReviewPage = lazy(() => import("@pages/admin/PredictionReviewPage"));
const ModelStatusDashboard = lazy(() => import("@pages/admin/ModelStatusDashboard"));

// WinMix Pro Admin (CMS)
const WinmixProAdmin = lazy(() => import("@pages/winmixpro"));

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
    if (gaKey) {
      try {
        ReactGA.initialize(gaKey);
      } catch (err) {
        console.warn("GA4 initialization failed:", err);
      }
    } else {
      console.warn("VITE_PUBLIC_GA environment variable not configured");
    }
  }, []);

  // RTL Support
  const plugins = useMemo(() => (direction === "rtl" ? [rtlPlugin] : []), [direction]);

  // Scroll to top on route change
  useEffect(() => {
    appRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <ThemeStyles />
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
    </>
  );
};

export default App;
