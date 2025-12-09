import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface MetricPillProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'emerald' | 'violet' | 'orange' | 'red' | 'blue' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * MetricPill - Stat badge component
 */
export default function MetricPill({ 
  label, 
  value, 
  icon,
  variant = 'emerald',
  size = 'md',
  className = '' 
}: MetricPillProps) {
  const variantClasses = {
    'emerald': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'violet': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'orange': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'red': 'bg-red-500/20 text-red-400 border-red-500/30',
    'blue': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'amber': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const sizeClasses = {
    'sm': 'px-2 py-1 text-xs',
    'md': 'px-3 py-2 text-sm',
    'lg': 'px-4 py-3 text-base',
    'xl': 'px-6 py-4 text-lg',
  };

  return (
    <div
      className={cn(
        'metric-pill inline-flex items-center gap-2 rounded-full border',
        variantClasses[variant],
        sizeClasses[size],
        'transition-base',
        className
      )}
      role="status"
      aria-label={`${label}: ${value}`}>
      
      {icon && <span aria-hidden="true">{icon}</span>}
      <span className="font-semibold">{value}</span>
      <span className="sr-only">{label}</span>
      
      {/* Visual checkmark icon for screen readers - only visible in some contexts */}
      <span className="sr-only">Mérték</span>
    </div>
  );
}