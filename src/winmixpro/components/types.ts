import { ReactNode, SVGAttributes } from 'react';

// Common Types
export interface BaseProps {
  className?: string;
  children?: ReactNode;
}

export interface IconProps extends SVGAttributes<SVGElement> {
  size?: number | string;
  color?: string;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  children?: NavItem[];
}

// Layout Types
export interface LayoutGridProps extends BaseProps {
  variant?: '3-6-3' | 'full' | 'sidebar';
  gap?: '4' | '6';
}

export interface GridCellProps extends BaseProps {
  span?: 'full' | 'half' | 'left' | 'center' | 'right';
}

// Styling Types
export type MetricVariant = 'emerald' | 'violet' | 'orange' | 'red' | 'blue' | 'amber';
export type MetricSize = 'sm' | 'md' | 'lg' | 'xl';

export type GlowVariant = 'emerald' | 'violet' | 'orange' | 'none';
export type ChangeDirection = 'up' | 'down';

// Component-Specific Props
export interface AdminLayoutProps extends BaseProps {
  userEmail: string;
  userName?: string;
  userAvatar?: string;
  navigation?: NavItem[];
  collapsed?: boolean;
}

export interface HeaderProps extends BaseProps {
  logo?: ReactNode;
  userMenu?: ReactNode;
  sticky?: boolean;
}

export interface SidebarProps extends BaseProps {
  collapsed?: boolean;
  items: NavItem[];
  activePath?: string;
}

export interface MobileMenuProps extends BaseProps {
  open: boolean;
  toggleMenu: () => void;
  items: NavItem[];
  activePath?: string;
}

export interface GlassCardProps extends BaseProps {
  interactive?: boolean;
  glow?: GlowVariant;
  border?: boolean;
}

export interface MetricPillProps extends BaseProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: MetricVariant;
  size?: MetricSize;
}

export interface SectionTitleProps extends BaseProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface StatCardProps extends BaseProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: {
    value: number;
    direction: ChangeDirection;
  };
}

// TODO: Consider adding Theme toggle support
// export interface ThemeContextValue {
//   theme: 'light' | 'dark';
//   toggleTheme: () => void;
// }
