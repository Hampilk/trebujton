import { ReactNode } from 'react';
import { HeaderProps } from '../components/types';

/**
 * Header - Sticky header component for admin layout
 * Supports left logo slot and right user menu slot
 */
export default function Header({ 
  logo, 
  userMenu, 
  sticky = true,
  className = '' 
}: HeaderProps) {
  return (
    <header
      className={`
        relative z-40
        ${sticky ? 'sticky top-0 z-50' : ''}
        glass-panel
        backdrop-blur-xl
        border-b border-white/10
        px-4 md:px-6 lg:px-8
        py-3 md:py-4
        transition-base
        ${className}
      `}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          {logo}
          
          {/* Optional: Breadcrumb navigation could go here */}
        </div>
        
        {/* Right - User actions */}
        <div className="flex items-center gap-3">
          {userMenu}
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-r from-emerald-500/0 via-violet-500/10 to-emerald-500/0 opacity-25" />
    </header>
  );
}