import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { useAccuracy, useTrends } from '@hooks/useAnalytics';
import ChartTooltip from '@ui/ChartTooltip';
import { getErrorMessage } from '@/lib/apiErrors';

const AccuracyChart: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: accuracyData, isLoading: accuracyLoading, error: accuracyError } = useAccuracy();
  const { data: trendData, isLoading: trendLoading, error: trendError } = useTrends();

  const isLoading = accuracyLoading || trendLoading;
  const error = accuracyError || trendError;

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading accuracy data...</p>
          </div>
        </div>
      </Spring>
    );
  }

  if (error) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p className="text-sm font-semibold">Error loading accuracy chart</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const chartData = accuracyData?.map((item, index) => ({
    ...item,
    trend: trendData?.[index]?.trend_value || 0,
    moving_average: trendData?.[index]?.moving_average || 0,
  })) || [];

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#e5e7eb' : '#f3f4f6';
  const textColor = isDark ? '#ffffff' : '#111827';

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2">
        <h3 className="h4 font-semibold">Model Accuracy Trend</h3>
        <p className="text-xs text-gray-500">Weekly accuracy and moving average</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: textColor }}
            stroke={gridColor}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: textColor }}
            stroke={gridColor}
            domain={[0, 100]}
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Area 
            type="monotone" 
            dataKey="accuracy" 
            fill="rgba(34, 197, 94, 0.3)" 
            stroke="#22c55e" 
            strokeWidth={2}
            isAnimationActive={true}
            name="Accuracy"
          />
          <Line 
            type="monotone" 
            dataKey="moving_average" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="7-Day MA"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Latest Accuracy</p>
          <p className="text-lg font-bold">{chartData[chartData.length - 1]?.accuracy || 0}%</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Avg Predictions</p>
          <p className="text-lg font-bold">{Math.round((chartData.reduce((sum, item) => sum + item.total_predictions, 0) / chartData.length) || 0)}</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Total Correct</p>
          <p className="text-lg font-bold">{chartData.reduce((sum, item) => sum + item.correct_predictions, 0) || 0}</p>
        </div>
      </div>
    </Spring>
  );
};

export default AccuracyChart;
