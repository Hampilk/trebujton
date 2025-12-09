import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => (
  <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-lg border border-white border-opacity-20 shadow-lg ${className}`}>
    {children}
  </div>
);