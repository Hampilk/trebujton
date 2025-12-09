import React from 'react';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { usePatterns } from '@hooks/useAnalytics';
import { getErrorMessage } from '@/lib/apiErrors';

const PatternHeatmap: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: patternsData, isLoading, error } = usePatterns();

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading pattern heatmap...</p>
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
            <p className="text-sm font-semibold">Error loading pattern data</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const isDark = theme === 'dark';

  // Get intensity color based on value (0-1 scale)
  const getIntensityColor = (value: number) => {
    if (value < 0.3) return isDark ? 'bg-gray-700' : 'bg-gray-200';
    if (value < 0.5) return isDark ? 'bg-blue-700' : 'bg-blue-200';
    if (value < 0.7) return isDark ? 'bg-blue-600' : 'bg-blue-400';
    if (value < 0.85) return isDark ? 'bg-blue-500' : 'bg-blue-500';
    return isDark ? 'bg-blue-400' : 'bg-blue-600';
  };

  const maxFrequency = Math.max(...(patternsData?.map(p => p.frequency) || [0]));
  const minFrequency = Math.min(...(patternsData?.map(p => p.frequency) || [0]));

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="h4 font-semibold">Pattern Performance Heatmap</h3>
        <p className="text-xs text-gray-500">Frequency and accuracy of detected patterns</p>
      </div>

      <div className="space-y-4">
        {/* Heatmap Grid */}
        <div className="grid gap-1">
          {patternsData?.map((pattern, idx) => {
            const frequencyNormalized = (pattern.frequency - minFrequency) / (maxFrequency - minFrequency);
            const intensityColor = getIntensityColor(frequencyNormalized);

            return (
              <div 
                key={pattern.pattern_id}
                className="flex items-stretch gap-3"
              >
                {/* Pattern Name */}
                <div className="w-32 flex items-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {pattern.pattern_name}
                  </p>
                </div>

                {/* Heatmap Cell */}
                <div className="flex-1 flex items-stretch gap-2">
                  <div
                    className={`flex-1 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center relative group ${intensityColor}`}
                    title={`Frequency: ${pattern.frequency}, Accuracy: ${(pattern.accuracy * 100).toFixed(1)}%`}
                  >
                    <span className="text-xs font-semibold text-white dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      {pattern.frequency}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {pattern.frequency} occurrences
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="w-32 text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {(pattern.accuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                  </div>

                  {/* Confidence Badge */}
                  <div className="w-20 text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      pattern.confidence >= 0.75 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : pattern.confidence >= 0.5
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {(pattern.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Legend</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Frequency Scale</p>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-6 h-6 rounded ${isDark ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Confidence Levels</p>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>🟢 High: 75%+</p>
                <p>🟡 Medium: 50-75%</p>
                <p>⚫ Low: &lt;50%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Patterns</p>
            <p className="text-lg font-bold">{patternsData?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Accuracy</p>
            <p className="text-lg font-bold">
              {patternsData && patternsData.length > 0
                ? ((patternsData.reduce((sum, p) => sum + p.accuracy, 0) / patternsData.length) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Occurrences</p>
            <p className="text-lg font-bold">
              {patternsData?.reduce((sum, p) => sum + p.frequency, 0) || 0}
            </p>
          </div>
        </div>
      </div>
    </Spring>
  );
};

export default PatternHeatmap;
