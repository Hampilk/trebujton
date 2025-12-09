import { NavItem } from '../components/types';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  HeartPulse, 
  Activity, 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Zap, 
  CalendarDays, 
  Target, 
  MessageSquare, 
  Settings, 
  Gauge 
} from 'lucide-react';

/**
 * Hungarian navigation data for the admin panel
 * Based on the integration guide specification
 */
export const adminNavigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Felhasználók',
    href: '/admin/users',
    icon: 'Users',
  },
  {
    label: 'Feladatok',
    href: '/admin/jobs',
    icon: 'Briefcase',
  },
  {
    label: 'Egészség',
    href: '/admin/health',
    icon: 'HeartPulse',
  },
  {
    label: 'Megfigyelés',
    href: '/admin/monitoring',
    icon: 'Activity',
  },
  {
    label: 'Elemzés',
    href: '/admin/analytics',
    icon: 'BarChart3',
  },
  {
    label: 'Modellek',
    href: '/admin/model-status',
    icon: 'Brain',
  },
  {
    label: 'Statisztika',
    href: '/admin/stats',
    icon: 'TrendingUp',
  },
  {
    label: 'Integrációk',
    href: '/admin/integrations',
    icon: 'Zap',
  },
  {
    label: 'Szakasz 9',
    href: '/admin/phase9',
    icon: 'CalendarDays',
  },
  {
    label: 'Mérkőzések',
    href: '/admin/matches',
    icon: 'Target',
  },
  {
    label: 'Előrejelzések',
    href: '/admin/predictions',
    icon: 'Target',
  },
  {
    label: 'Visszajelzés',
    href: '/admin/feedback',
    icon: 'MessageSquare',
  },
  {
    label: 'Környezet',
    href: '/admin/environment',
    icon: 'Gauge',
  },
  {
    label: 'Beállítások',
    href: '/settings',
    icon: 'Settings',
  },
];

/**
 * Maps icon name strings to actual icon components
 */
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  HeartPulse,
  Activity,
  BarChart3,
  Brain,
  TrendingUp,
  Zap,
  CalendarDays,
  Target,
  MessageSquare,
  Settings,
  Gauge,
};

/**
 * Gets the appropriate icon component for a navigation item
 */
export function getIconComponent(iconName?: string) {
  if (!iconName || !iconMap[iconName]) return null;
  return iconMap[iconName];
}

/**
 * Finds the active navigation item based on current path
 */
export function findActiveNavItem(pathname: string, items: NavItem[]): NavItem | null {
  const path = pathname.replace(/\/+$/, ''); // Remove trailing slash
  
  for (const item of items) {
    const itemPath = item.href.replace(/\/+$/, '');
    
    if (path === itemPath) {
      return item;
    }
    
    if (item.children) {
      const childMatch = findActiveNavItem(path, item.children);
      if (childMatch) return item;
    }
  }
  
  return null;
}

/**
 * Checks if a nav item is active or has active children
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const currentPath = pathname.replace(/\/+$/, '');
  const itemPath = item.href.replace(/\/+$/, '');
  
  if (currentPath === itemPath) return true;
  
  if (item.children) {
    return item.children.some(child => isNavItemActive(child, pathname));
  }
  
  return currentPath.startsWith(itemPath) && itemPath !== '';
}