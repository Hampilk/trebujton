import React from 'react';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { useStreak } from '@hooks/useAnalytics';
import { getErrorMessage } from '@/lib/apiErrors';

const StreakAnalysis: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: streakData, isLoading, error } = useStreak();

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading streak analysis...</p>
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
            <p className="text-sm font-semibold">Error loading streak data</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="h4 font-semibold">Streak Analysis</h3>
        <p className="text-xs text-gray-500">H/D/V streaks, clean sheets, and BTTS statistics</p>
      </div>

      <div className="space-y-6">
        {/* Win/Draw/Loss Streaks Section */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Result Streaks</h4>
          <div className="grid grid-cols-3 gap-3">
            {/* Home Wins */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">Home Win</span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-green-600 dark:text-green-400">Total Wins</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{streakData?.home_wins || 0}</p>
              </div>
              <div className="bg-white dark:bg-green-700 rounded px-2 py-1">
                <p className="text-xs text-center font-semibold text-green-700 dark:text-green-100">
                  Current: {streakData?.home_streak_count || 0} match{(streakData?.home_streak_count || 0) !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>

            {/* Draws */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Draw</span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Total Draws</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{streakData?.draws || 0}</p>
              </div>
              <div className="bg-white dark:bg-yellow-700 rounded px-2 py-1">
                <p className="text-xs text-center font-semibold text-yellow-700 dark:text-yellow-100">
                  Current: {streakData?.draw_streak_count || 0} match{(streakData?.draw_streak_count || 0) !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>

            {/* Away Wins */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">Away Win</span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-red-600 dark:text-red-400">Total Wins</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{streakData?.away_wins || 0}</p>
              </div>
              <div className="bg-white dark:bg-red-700 rounded px-2 py-1">
                <p className="text-xs text-center font-semibold text-red-700 dark:text-red-100">
                  Current: {streakData?.away_streak_count || 0} match{(streakData?.away_streak_count || 0) !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Section */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Additional Statistics</h4>
          <div className="grid grid-cols-3 gap-3">
            {/* Clean Sheets */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">Clean Sheets</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{streakData?.clean_sheets || 0}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Games with no goals conceded</p>
            </div>

            {/* BTTS */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">BTTS</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{streakData?.btts_count || 0}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Both teams scored</p>
            </div>

            {/* Over 2.5 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg p-4">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Over 2.5</p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{streakData?.over_25_count || 0}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">3+ total goals</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Results</p>
              <p className="text-lg font-bold">
                {(streakData?.home_wins || 0) + (streakData?.draws || 0) + (streakData?.away_wins || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Home Win %</p>
              <p className="text-lg font-bold">
                {Math.round(((streakData?.home_wins || 0) / ((streakData?.home_wins || 0) + (streakData?.draws || 0) + (streakData?.away_wins || 0))) * 100) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Spring>
  );
};

export default StreakAnalysis;
