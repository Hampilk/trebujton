
// utils
import React, { lazy, Suspense, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { preventDefault } from '@utils/helpers';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// styles
import ThemeStyles from '@styles/theme';
import './style.scss';

// libs styles
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-grid-layout/css/styles.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// contexts
import { SidebarProvider } from '@contexts/sidebarContext';
import { useThemeProvider } from '@contexts/themeContext';

// hooks
import { useWindowSize } from 'react-use';
import useAuthRoute from '@hooks/useAuthRoute';

// components
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoadingScreen from '@components/LoadingScreen';
import { ProtectedRoute, RoleProtectedRoute } from '@components/ProtectedRoute';
import Sidebar from '@layout/Sidebar';
import BottomNav from '@layout/BottomNav';
import Navbar from '@layout/Navbar';
import ShoppingCart from '@widgets/ShoppingCart';
import ScrollToTop from '@components/ScrollToTop';

// pages
const ClubSummary = lazy(() => import('@pages/ClubSummary'));
const GameSummary = lazy(() => import('@pages/GameSummary'));
const Championships = lazy(() => import('@pages/Championships'));
const LeagueOverview = lazy(() => import('@pages/LeagueOverview'));
const FansCommunity = lazy(() => import('@pages/FansCommunity'));
const Statistics = lazy(() => import('@pages/Statistics'));
const PageNotFound = lazy(() => import('@pages/PageNotFound'));
const MatchSummary = lazy(() => import('@pages/MatchSummary'));
const MatchOverview = lazy(() => import('@pages/MatchOverview'));
const PlayerProfile = lazy(() => import('@pages/PlayerProfile'));
const Schedule = lazy(() => import('@pages/Schedule'));
const Tickets = lazy(() => import('@pages/Tickets'));
const FootballStore = lazy(() => import('@pages/FootballStore'));
const BrandStore = lazy(() => import('@pages/BrandStore'));
const Product = lazy(() => import('@pages/Product'));
const Login = lazy(() => import('@pages/Login'));
const SignUp = lazy(() => import('@pages/SignUp'));
const Settings = lazy(() => import('@pages/Settings'));

// admin pages
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@pages/admin/AdminUsers'));
const AdminPredictions = lazy(() => import('@pages/admin/AdminPredictions'));
const AdminModels = lazy(() => import('@pages/admin/AdminModels'));
const AdminJobs = lazy(() => import('@pages/admin/AdminJobs'));
const AdminMonitoring = lazy(() => import('@pages/admin/AdminMonitoring'));
const AdminSettings = lazy(() => import('@pages/admin/AdminSettings'));

const App: React.FC = () => {
    const appRef = useRef<HTMLDivElement>(null);
    const { theme, direction } = useThemeProvider();
    const { width = 0 } = useWindowSize();
    
    const isAuthRoute = useAuthRoute();

    const gaKey = import.meta.env.VITE_PUBLIC_GA;
    useEffect(() => {
         if (gaKey) ReactGA.initialize(gaKey);
    }, [gaKey]);

    const plugins = direction === 'rtl' ? [rtlPlugin] : [];

    const muiTheme = createTheme({
        direction: direction as 'ltr' | 'rtl',
    });

    const cacheRtl = createCache({
        key: direction === 'rtl' ? 'muirtl' : 'muiltr',
        stylisPlugins: plugins,
    });

    useEffect(() => {
        // scroll to top on route change
        if (appRef.current) {
            appRef.current.scrollTo(0, 0);
        }
        preventDefault();
    }, []);

    return (
        <CacheProvider value={cacheRtl}>
            <MuiThemeProvider theme={muiTheme}>
                <SidebarProvider>
                    <ThemeProvider theme={{ theme: theme }}>
                        <ThemeStyles />
                        <ToastContainer theme={theme} autoClose={2500} position={direction === 'ltr' ? 'top-right' : 'top-left'} />
                        <StyleSheetManager stylisPlugins={plugins}>
                            <div className={`app ${isAuthRoute ? 'fluid' : ''}`} ref={appRef}>
                                <ScrollToTop />
                                {
                                    !isAuthRoute && (
                                        <>
                                            <Sidebar />
                                            {width < 768 && <Navbar />}
                                            {width < 768 && <BottomNav />}
                                        </>
                                    )
                                }
                                <div className="app_container">
                                    <div className="app_container-content d-flex flex-column flex-1">
                                        <Suspense fallback={<LoadingScreen />}>
                                            <Routes>
                                                <Route path="*" element={<PageNotFound />} />
                                                <Route path="/" element={<ClubSummary />} />
                                                <Route path="/game-summary" element={<GameSummary />} />
                                                <Route path="/championships" element={<Championships />} />
                                                <Route path="/league-overview" element={<LeagueOverview />} />
                                                <Route path="/fans-community" element={<FansCommunity />} />
                                                <Route path="/statistics" element={<Statistics />} />
                                                <Route path="/match-summary" element={<MatchSummary />} />
                                                <Route path="/match-overview" element={<MatchOverview />} />
                                                <Route path="/player-profile" element={<PlayerProfile />} />
                                                <Route path="/schedule" element={<Schedule />} />
                                                <Route path="/tickets" element={<Tickets />} />
                                                <Route path="/football-store" element={<FootballStore />} />
                                                <Route path="/brand-store" element={<BrandStore />} />
                                                <Route path="/product" element={<Product />} />
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/sign-up" element={<SignUp />} />
                                                <Route path="/settings" element={<Settings />} />
                                                
                                                {/* Admin routes - protected and role-based */}
                                                <Route path="/admin" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminDashboard />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/users" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminUsers />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/predictions" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminPredictions />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/models" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminModels />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/jobs" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminJobs />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/monitoring" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminMonitoring />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/admin/settings" element={
                                                    <ProtectedRoute>
                                                        <RoleProtectedRoute allowedRoles={['admin', 'analyst']}>
                                                            <AdminSettings />
                                                        </RoleProtectedRoute>
                                                    </ProtectedRoute>
                                                } />
                                            </Routes>
                                        </Suspense>
                                    </div>
                                </div>
                                <ShoppingCart isPopup />
                            </div>
                        </StyleSheetManager>
                    </ThemeProvider>
                </SidebarProvider>
            </MuiThemeProvider>
        </CacheProvider>
    );
}

export default App;