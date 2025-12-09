import { ReactNode } from 'react';
import { GlassCard } from '@/components/Admin/GlassCard';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-slate-400 mt-2">{description}</p>
          )}
        </div>
        <GlassCard>{children}</GlassCard>
      </div>
    </div>
  );
};