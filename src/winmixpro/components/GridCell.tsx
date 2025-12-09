import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface GridCellProps {
  children: ReactNode;
  span?: 'full' | 'half' | 'left' | 'center' | 'right';
  className?: string;
}

/**
 * GridCell - Responsive grid cell component
 * Works with LayoutGrid to create responsive layouts
 */
export default function GridCell({ 
  children, 
  span = 'full',
  className = '' 
}: GridCellProps) {
  return (
    <div 
      className={cn(
        'grid-cell',
        {
          'col-span-full md:col-span-full': span === 'full',
          'col-span-full md:col-span-6': span === 'half',
          'col-span-full md:col-span-3': span === 'left' || span === 'right',
          'col-span-full md:col-span-6': span === 'center',
        },
        className
      )}
      data-grid-cell-span={span}
    >
      {children}
    </div>
  );
}