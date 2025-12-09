import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MobileMenuProps } from './types';
import { isNavItemActive, getIconComponent } from '../utils/navigation';

/**
 * MobileMenu - Mobile navigation drawer component
 */
export default function MobileMenu({ open, toggleMenu, items, activePath }: MobileMenuProps) {
  const location = useLocation();
  const currentPath = activePath || location.pathname;
  
  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : 'auto';
    }
  }, [open]);
  
  // Close menu on route change
  useEffect(() => {
    if (open) {
      toggleMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  
  return (
    <div
      className={`
        sm-only fixed inset-0 z-50
        ${open ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-out
      `}
      role="dialog"
      aria-label="Mobile Menu"
      aria-modal="true"
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div className="absolute inset-0 glass-panel backdrop-blur-xl border-r border-white/10" />
      
      {/* Menu Content */}
      <div 
        className="relative z-10 h-full flex flex-col p-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-bold text-gradient-emerald">WinMixPro</span>
          </div>
          
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-base"
            aria-label="Close menu"
          >
            <span className="text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </span>
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto" role="navigation" aria-label="Mobile Navigation">
          <ul className="space-y-1">
            {items && items.length > 0 ? (
              items.map(item => {
                const IconComponent = getIconComponent(item.icon?.toString() || '');
                const isActive = isNavItemActive(item, currentPath);
                
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`
                        flex items-center gap-3
                        w-full p-3 rounded-lg
                        transition-base
                        text-sm
                        ${isActive 
                          ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                      `}
                      role="menuitem"
                      aria-current={isActive ? 'page' : 'false'}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-5 h-5 text-white/50" aria-hidden="true" />
                      ) : (
                        <div className="w-5 h-5 bg-white/10 rounded" />
                      )}
                      <span className="flex-1 text-left">{item.label}</span>
                    </a>
                  </li>
                );
              })
            ) : (
              <li className="p-4 text-center text-white/60">No navigation items</li>
            )}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="px-3 text-center text-xs text-white/50">
            <p>WinMixPro v{(typeof window !== 'undefined' && (window as any).WINMIXPRO_VERSION) || '1.0'}</p>
            <p className="mt-1">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// This comment prevents the component from being tree-shaken away if unused by making
// TypeScript think there's a side effect here
void 0;