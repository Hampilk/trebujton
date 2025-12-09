import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { useConfidence } from '@hooks/useAnalytics';
import ChartTooltip from '@ui/ChartTooltip';
import { getErrorMessage } from '@/lib/apiErrors';

const ConfidenceDistribution: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: confidenceData, isLoading, error } = useConfidence();

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading confidence distribution...</p>
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
            <p className="text-sm font-semibold">Error loading confidence data</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#e5e7eb' : '#f3f4f6';
  const textColor = isDark ? '#ffffff' : '#111827';

  const chartData = confidenceData?.map(item => ({
    ...item,
    accuracy_pct: Math.round(item.avg_accuracy * 100),
  })) || [];

  const avgAccuracy = chartData.length > 0 
    ? (chartData.reduce((sum, item) => sum + item.avg_accuracy, 0) / chartData.length * 100).toFixed(2)
    : 0;

  const totalPredictions = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2">
        <h3 className="h4 font-semibold">Confidence Distribution</h3>
        <p className="text-xs text-gray-500">Prediction confidence levels vs accuracy</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="confidence_range" 
            tick={{ fontSize: 11, fill: textColor }}
            stroke={gridColor}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12, fill: textColor }}
            stroke={gridColor}
            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: textColor }}
            stroke={gridColor}
            label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight' }}
            domain={[0, 100]}
          />
          <Tooltip content={<ChartTooltip multi />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar 
            yAxisId="left"
            dataKey="count" 
            fill="#3b82f6" 
            name="Prediction Count"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="accuracy_pct" 
            fill="#22c55e" 
            name="Accuracy (%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Avg Accuracy</p>
          <p className="text-lg font-bold">{avgAccuracy}%</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Total Predictions</p>
          <p className="text-lg font-bold">{totalPredictions}</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Distribution Range</p>
          <p className="text-lg font-bold">{chartData.length} buckets</p>
        </div>
      </div>
    </Spring>
  );
};

export default ConfidenceDistribution;
