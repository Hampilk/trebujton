import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/**
 * SectionTitle - Gradient section headers
 */
export default function SectionTitle({ 
  title, 
  subtitle, 
  icon,
  align = 'left',
  className = '' 
}: SectionTitleProps) {
  const alignClasses = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  };

return (
    <div
      className={cn(
        'section-title relative mb-8 pb-4',
        alignClasses[align],
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-violet-500 rounded-lg flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        
        <div>
          <h1 className="text-lg md:text-2xl font-semibold text-gradient-emerald">
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-2 text-sm md:text-base text-white/60">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    
      {/* Bottom Gradient Line */}
      <div className="section-title-underline absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
    </div>
  );
}