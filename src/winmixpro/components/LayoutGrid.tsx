import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface LayoutGridProps {
  children: ReactNode;
  variant?: '3-6-3' | 'full' | 'sidebar';
  gap?: '4' | '6';
  className?: string;
}

/**
 * LayoutGrid - Responsive grid wrapper supporting multiple layout variants
 */
export default function LayoutGrid({ 
  children, 
  variant = '3-6-3',
  gap = '6',
  className = '' 
}: LayoutGridProps) {
  const variants = {
    '3-6-3': 'layout-grid grid-3-6-3',
    'full': 'layout-grid',
    'sidebar': 'layout-grid layout-sidebar'
  };
  
  const gaps = {
    '4': 'gap-4',
    '6': 'gap-6'
  };
  
  return (
    <div 
      className={cn(
        `${variants[variant]} ${gaps[gap]}`,
        className
      )}
    >
      {children}
    </div>
  );
}