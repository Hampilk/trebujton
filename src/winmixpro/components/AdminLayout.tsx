import { ReactNode, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import { AdminLayoutProps } from '../components/types';
import { adminNavigationItems } from '../utils/navigation';

/**
 * AdminLayout - Main shell component for admin pages
 * Provides sticky header, sidebar, mobile drawer, and glassmorphism styling
 */
export default function AdminLayout({ 
  children, 
  userEmail,
  userName,
  userAvatar,
  navigation = adminNavigationItems,
  collapsed = false,
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(collapsed);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  const userDisplayName = userName || userEmail?.split('@')[0] || 'User';

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-winmix-dark text-white overflow-hidden">
        {/* Global page metadata */}
        <Helmet>
          <title>WinMixPro Admin</title>
          <meta name="description" content="WinMixPro Admin Panel - Premium dark theme with glassmorphism" />
          <meta name="theme-color" content="#050505" />
        </Helmet>

        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-glass focus:backdrop-blur-xl focus:ring-2 focus:ring-emerald-500/50 focus:px-4 focus:py-2 focus:rounded transition-slow"
        >
          Ugrás a tartalomra
        </a>

        {/* Skip to navigation - accessibility */}
        <a
          href="#admin-navigation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-glass focus:backdrop-blur-xl focus:ring-2 focus:ring-emerald-500/50 focus:px-4 focus:py-2 focus:rounded transition-slow"
        >
          Ugrás a navigációra
        </a>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-base"
            onClick={toggleMobileMenu}
            role="button"
            aria-label="Close mobile menu"
          />
        )}

        {/* Sticky Header */}
        <Header
          sticky={true}
          logo={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-lg font-bold text-gradient-emerald">WinMixPro</span>
            </div>
          }
          userMenu={
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <button className="flex items-center gap-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-full transition-base">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{userDisplayName}</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Toggle mobile menu"
              >
                <div className={`flex flex-col gap-1 ${isMobileMenuOpen ? 'text-emerald-400' : 'text-white'}`}>
                  <span className={`w-6 h-0.5 bg-current transition-fast ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`w-6 h-0.5 bg-current transition-fast ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`w-6 h-0.5 bg-current transition-fast ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>

              {/* Logout Button - Desktop */}
              <button
                onClick={handleLogout}
                className="hidden md:block px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Logout"
              >
                Kijelentkezés
              </button>
            </div>
          }
        />

        {/* Admin Layout Shell */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
          {/* Sidebar - Desktop */}
          <aside
            id="admin-navigation"
            className={`
              order-2 md:order-1
              w-full md:w-72 lg:w-80 
              h-auto md:h-full
              p-4 md:p-6
              glass-panel
              border-r border-white/10
              overflow-y-auto
              fixed md:relative
              z-30
              ${isSidebarCollapsed ? 'md:w-16' : 'md:w-72 lg:w-80'}
              md:translate-y-0
              transform
              ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
              transition-base md:transition-none
              transition-slow md:transition-fast
            `}
            role="navigation"
            aria-label="Admin Sidebar"
          >
            <Sidebar
              collapsed={isSidebarCollapsed}
              items={navigation}
              activePath={typeof window !== 'undefined' ? window.location.pathname : '/admin'}
            />
          </aside>

          {/* Main Content Area */}
          <main
            id="main-content"
            className={`
              order-1 md:order-2
              flex-1
              w-full md:flex-1
              min-h-[calc(100vh-64px)]
              overflow-y-auto
              p-4 md:p-6 lg:p-8
              ${isSidebarCollapsed ? 'md:pl-4' : 'md:pl-6 lg:pl-8'}
              md:pr-6 lg:pr-8
              pb-20 md:pb-8
            `}
            role="main"
            tabIndex={-1}
          >
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Menu Drawer */}
        <MobileMenu
          open={isMobileMenuOpen}
          toggleMenu={toggleMobileMenu}
          items={navigation}
          activePath={typeof window !== 'undefined' ? window.location.pathname : '/admin'}
        />

        {/* Responsive Toolbar for Sidebar Collapse */}
        {typeof window !== 'undefined' && window.innerWidth >= 768 && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 -ml-3 z-50 w-6 h-16 bg-emerald-500/20 glass-panel backdrop-blur-lg border border-white/10 rounded-r-lg items-center justify-center hover:bg-emerald-500/40 transition-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className={`w-0 h-0 border-y-4 border-y-transparent transition-base ${isSidebarCollapsed ? 'border-r-0 border-l-2 border-l-white' : 'border-l-0 border-r-2 border-r-white'}`}></div>
          </button>
        )}
      </div>
    </HelmetProvider>
  );
}