import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

/**
 * StatCard - Stat display card with trend indicator
 */
export default function StatCard({ 
  title, 
  value, 
  icon,
  change,
  className = '' 
}: StatCardProps) {
  const changeClasses = change?.direction === 'up' 
    ? 'text-emerald-400 bg-emerald-500/20' 
    : 'text-red-400 bg-red-500/20';

  const chevronIcon = change?.direction === 'up' ? '↑' : '↓';

  return (
    <div
      className={cn(
        'stat-card glass-panel rounded-xl p-6 transition-base hover:bg-white/5',
        'border border-white/10',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {icon && (
          <div className="metric-icon flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400" aria-hidden="true">{icon}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Title and Value */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>
              <div className="mt-2 text-3xl md:text-4xl font-bold text-gradient-emerald">
                {value}
              </div>
            </div>

            {/* Change Indicator */} 
            {change && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${changeClasses} text-sm`}>
                <span aria-hidden="true">{chevronIcon}</span>
                <span>{change.value}%</span>
                <span className="sr-only">
                  Tendencia {change.direction === 'up' ? 'felfelé' : 'lefelé'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="mt-4 pt-4 border-t border-white/10" />
    </div>
  );
}