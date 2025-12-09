import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { usePatterns } from '@hooks/useAnalytics';
import ChartTooltip from '@ui/ChartTooltip';
import { getErrorMessage } from '@/lib/apiErrors';

const ModelComparison: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: patternsData, isLoading, error } = usePatterns();

  const modelMetrics = useMemo(() => {
    if (!patternsData) return [];

    // Convert patterns data to model comparison format
    return patternsData.map((pattern) => ({
      model_name: pattern.pattern_name,
      accuracy: Math.round(pattern.accuracy * 100),
      frequency: pattern.frequency,
      confidence: Math.round(pattern.confidence * 100),
      home_advantage: Math.round(pattern.home_advantage * 100),
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [patternsData]);

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading model comparison...</p>
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
            <p className="text-sm font-semibold">Error loading model comparison</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#e5e7eb' : '#f3f4f6';
  const textColor = isDark ? '#ffffff' : '#111827';

  const topModel = modelMetrics[0];
  const avgAccuracy = modelMetrics.length > 0 
    ? (modelMetrics.reduce((sum, m) => sum + m.accuracy, 0) / modelMetrics.length).toFixed(1)
    : 0;

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2">
        <h3 className="h4 font-semibold">Pattern Analysis</h3>
        <p className="text-xs text-gray-500">Pattern accuracy and frequency comparison</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={modelMetrics} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="model_name" 
            tick={{ fontSize: 11, fill: textColor }}
            stroke={gridColor}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: textColor }}
            stroke={gridColor}
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<ChartTooltip multi />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar 
            dataKey="accuracy" 
            fill="#3b82f6" 
            name="Accuracy (%)"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="confidence" 
            fill="#8b5cf6" 
            name="Confidence (%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Best Performing Pattern</p>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900 dark:text-blue-100">{topModel?.model_name || 'N/A'}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Accuracy: {topModel?.accuracy || 0}%</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Metrics Summary</p>
            <div className="space-y-1">
              <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Avg Accuracy:</span> <span className="font-semibold">{avgAccuracy}%</span></p>
              <p className="text-sm"><span className="text-gray-600 dark:text-gray-400">Total Patterns:</span> <span className="font-semibold">{modelMetrics.length}</span></p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Pattern</th>
              <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">Accuracy</th>
              <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">Frequency</th>
              <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {modelMetrics.slice(0, 5).map((metric, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-2 px-2 font-medium">{metric.model_name}</td>
                <td className="text-right py-2 px-2">
                  <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs font-semibold">
                    {metric.accuracy}%
                  </span>
                </td>
                <td className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{metric.frequency}</td>
                <td className="text-right py-2 px-2">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{metric.confidence}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Spring>
  );
};

export default ModelComparison;
