import { useMemo } from 'react';
import { TrendingUp, Users, ShoppingCart, BarChart3 } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import CmsPageRuntime from '@components/CmsPageRuntime';
import WidgetGroup from '@components/WidgetGroup';

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  );
};

const AnalyticsDashboardPage = () => {
  const widgets = useMemo(() => ({
    stats: (
      <WidgetGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value="12,543"
            change={12}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Revenue"
            value="$48,291"
            change={8}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Orders"
            value="1,247"
            change={-3}
            icon={ShoppingCart}
            color="purple"
          />
          <StatsCard
            title="Conversion Rate"
            value="3.2%"
            change={15}
            icon={BarChart3}
            color="orange"
          />
        </div>
      </WidgetGroup>
    ),
  }), []);

  return (
    <>
      <PageHeader 
        title="Analytics Dashboard" 
        metaDescription="Comprehensive analytics and insights for your business"
      />
      <CmsPageRuntime 
        id="analytics_dashboard_page" 
        widgets={widgets}
        cmsSlug="analytics-dashboard"
        onCmsDataLoaded={(data) => {
          console.log('Analytics Dashboard CMS loaded:', data);
          // You could add analytics tracking here
          if (window.gtag) {
            window.gtag('event', 'cms_layout_loaded', {
              page_title: 'Analytics Dashboard',
              widget_count: Object.keys(data.instances || {}).length,
            });
          }
        }}
        onFallbackMode={(reason) => {
          console.log(`Analytics Dashboard fallback: ${reason}`);
          // Track when CMS is unavailable
          if (window.gtag) {
            window.gtag('event', 'cms_fallback', {
              page_title: 'Analytics Dashboard',
              reason,
            });
          }
        }}
      />
    </>
  );
};

export default AnalyticsDashboardPage;