import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProps } from '../components/types';
import { isNavItemActive, getIconComponent } from '../utils/navigation';

/**
 * Sidebar - Desktop navigation sidebar with Hungarian labels
 * Supports collapsed state and displays navigation items
 */
export default function Sidebar({ collapsed, items, activePath }: SidebarProps) {
  const location = useLocation();
  const currentPath = activePath || location.pathname;

  useEffect(() => {
    // Ensure proper ARIA attributes on active items
    const navItems = document.querySelectorAll('[data-nav-item]');
    navItems.forEach(item => {
      const href = item.getAttribute('data-href') || '';
      const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }, [currentPath]);

  if (!items || items.length === 0) {
    return <div className="text-center py-8 text-white/60">No navigation items</div>;
  }

  return (
    <nav 
      className="h-full flex flex-col" 
      role="navigation" 
      aria-label="Admin Navigation"
      aria-describedby="aria-desc"
    >
      {/* SR-only description for screen readers */}
      <span id="aria-desc" className="sr-only">
        Admin navigation menu with {items.length} destinations
      </span>
      
      {/* Sidebar Header - optional, can show when not collapsed */}
      {!collapsed && (
        <div className="mb-6 pb-4 border-b border-white/10">
          <div className="px-2 text-xs font-semibold text-white/50 uppercase tracking-wide mb-4">
            Admin Navigation
          </div>
          <div className="text-sm text-white/80">
            WinMixPro <span className="text-emerald-400 font-medium">Dashboard</span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item, index) => {
            const IconComponent = getIconComponent(item.icon?.toString() || '');
            const isActive = isNavItemActive(item, currentPath);
            const isCollapsed = collapsed;

            return (
              <li key={item.href} data-nav-item data-href={item.href}>
                <Link
                  to={item.href}
                  className={`
                    group relative
                    flex items-center
                    ${isCollapsed ? 'justify-center p-3' : 'justify-start px-3 py-3'}
                    rounded-lg
                    transition-base
                    text-sm
                    ${isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  `}
                  aria-label={item.label}
                >
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l transition-base" />
                  )}

                  {/* Icon */}
                  {IconComponent ? (
                    <IconComponent 
                      className={`
                        ${isCollapsed ? 'w-5 h-5 mx-auto' : 'w-5 h-5 mr-3'}
                        flex-shrink-0
                        transition-base
                        ${isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white'}
                      `}
                      aria-hidden="true"
                    />
                  ) : (
                    <div className={`${isCollapsed ? 'w-5 h-5 mx-auto' : 'w-5 h-5 mr-3'} bg-white/10 rounded transition-base`} />
                  )}

                  {/* Label */}
                  {!isCollapsed && (
                    <span className="flex-1 truncate">
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="sr-only">
                      {item.label}
                    </div>
                  )}
                </Link>

                {/* Accessibility: Hidden text for screen readers to indicate active state */}
                <span className="sr-only" aria-live="polite">
                  {isActive ? 'Currently active' : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        {!collapsed && (
          <div className="px-3 text-xs text-white/50">
            <p>
              WinMixPro v{(typeof window !== 'undefined' && (window as any).WINMIXPRO_VERSION) || '1.0'}
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()}
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}