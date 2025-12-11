import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';

// Hooks
import { useDashboard } from '@/hooks/useDashboard';

// Widgets
import DashboardStats from '@/widgets/DashboardStats';
import RecentPredictions from '@/widgets/RecentPredictions';
import PatternPerformance from '@/widgets/PatternPerformance';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();

  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      stats: <DashboardStats stats={data.stats} />,
      predictions: <RecentPredictions predictions={data.predictions} loading={isLoading} onRefresh={refetch} />,
      patterns: <PatternPerformance patterns={data.patterns} />,
    };
  }, [data, isLoading, refetch]);

  if (isLoading) {
    return (
      <>
        <PageHeader 
          title="Dashboard" 
          metaDescription="Monitor prediction accuracy and performance"
        />
        <div className="text-center py-12 text-muted-foreground">
          Loading dashboard data...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader 
          title="Dashboard" 
          metaDescription="Monitor prediction accuracy and performance"
        />
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm mb-6">
          Error loading dashboard data: {error.message}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Dashboard" 
        metaDescription="Monitor prediction accuracy and performance"
      />
      <AppGrid id="dashboard" widgets={widgets} />
    </>
  );
}