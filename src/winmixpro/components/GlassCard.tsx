import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface GlassCardProps {
  children: ReactNode;
  interactive?: boolean;
  glow?: 'emerald' | 'violet' | 'orange' | 'none';
  border?: boolean;
  className?: string;
}

/**
 * GlassCard - Premium glass-morphism card component
 */
export default function GlassCard({ 
  children, 
  interactive = false,
  glow = 'none',
  border = true,
  className = '' 
}: GlassCardProps) {
  const glowClasses = {
    'emerald': 'glow-emerald',
    'violet': 'glow-violet',
    'orange': 'glow-orange',
    'none': ''
  };

  const interactiveClasses = interactive 
    ? 'glass-panel-hover transition-base hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50' 
    : 'glass-panel';

  return (
    <div
      className={cn(
        interactiveClasses,
        glow !== 'none' && glowClasses[glow],
        border && 'border border-white/10',
        'rounded-xl p-6 backdrop-blur-xl',
        'shadow',
        className
      )}
      role="region"
    >
      {children}
    </div>
  );
}