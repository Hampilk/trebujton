import React from 'react';
import Spring from '@components/Spring';
import { useThemeProvider } from '@contexts/themeContext';
import { useTransition } from '@hooks/useAnalytics';
import { getErrorMessage } from '@/lib/apiErrors';

const TransitionMatrix: React.FC = () => {
  const { theme } = useThemeProvider();
  const { data: transitionData, isLoading, error } = useTransition();

  if (isLoading) {
    return (
      <Spring className="card h-1 d-flex flex-column g-10 card-padded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading transition matrix...</p>
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
            <p className="text-sm font-semibold">Error loading transition data</p>
            <p className="text-xs text-red-400">{getErrorMessage(error as any)}</p>
          </div>
        </div>
      </Spring>
    );
  }

  const isDark = theme === 'dark';

  const states = ['H', 'D', 'V'];
  const stateLabels = { H: 'Home Win', D: 'Draw', V: 'Away Win' };
  const stateColors = {
    H: { bg: 'bg-green-50 dark:bg-green-900', border: 'border-green-200 dark:border-green-700', text: 'text-green-900 dark:text-green-100' },
    D: { bg: 'bg-yellow-50 dark:bg-yellow-900', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-900 dark:text-yellow-100' },
    V: { bg: 'bg-red-50 dark:bg-red-900', border: 'border-red-200 dark:border-red-700', text: 'text-red-900 dark:text-red-100' },
  };

  // Helper to get probability value
  const getProbability = (fromState: string, toState: string): number => {
    if (!transitionData) return 0;
    const key = `${fromState.toLowerCase()}_to_${toState.toLowerCase()}`;
    return transitionData[key] || 0;
  };

  // Helper to get confidence value
  const getConfidence = (fromState: string, toState: string): number => {
    if (!transitionData?.confidence_scores) return 0;
    const key = `${fromState.toLowerCase()}_to_${toState.toLowerCase()}`;
    return transitionData.confidence_scores[key] || 0;
  };

  // Get intensity color based on probability (0-1 scale)
  const getIntensityColor = (probability: number) => {
    if (probability < 0.2) return 'bg-gray-200 dark:bg-gray-700';
    if (probability < 0.3) return 'bg-blue-200 dark:bg-blue-700';
    if (probability < 0.4) return 'bg-blue-400 dark:bg-blue-600';
    if (probability < 0.5) return 'bg-blue-500 dark:bg-blue-500';
    return 'bg-blue-600 dark:bg-blue-400';
  };

  return (
    <Spring className="card h-1 d-flex flex-column g-10 card-padded">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="h4 font-semibold">Markov Transition Matrix</h3>
        <p className="text-xs text-gray-500">Probability of match result transitions</p>
      </div>

      <div className="space-y-6">
        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header Row */}
            <div className="flex gap-2 mb-2">
              <div className="w-24"></div>
              {states.map(state => (
                <div key={state} className="w-24 text-center">
                  <div className={`px-3 py-2 rounded-lg font-semibold ${stateColors[state].bg} ${stateColors[state].border} border`}>
                    <span className={stateColors[state].text}>To: {state}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {states.map(fromState => (
              <div key={fromState} className="flex gap-2 mb-2">
                {/* Row Header */}
                <div className={`w-24 px-3 py-2 rounded-lg font-semibold ${stateColors[fromState].bg} ${stateColors[fromState].border} border flex items-center justify-center`}>
                  <span className={stateColors[fromState].text}>From: {fromState}</span>
                </div>

                {/* Matrix Cells */}
                {states.map(toState => {
                  const probability = getProbability(fromState, toState);
                  const confidence = getConfidence(fromState, toState);
                  const intensityColor = getIntensityColor(probability);

                  return (
                    <div
                      key={`${fromState}-${toState}`}
                      className={`w-24 relative group cursor-pointer`}
                    >
                      <div
                        className={`p-3 rounded-lg text-center transition-all duration-200 h-full ${intensityColor}`}
                      >
                        <p className="text-sm font-bold text-white">
                          {(probability * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-white opacity-80">
                          Conf: {(confidence * 100).toFixed(0)}%
                        </p>
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-semibold">{stateLabels[fromState]} → {stateLabels[toState]}</p>
                        <p>Probability: {(probability * 100).toFixed(1)}%</p>
                        <p>Confidence: {(confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Transitions</p>
            <p className="text-lg font-bold">{transitionData?.total_transitions || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Most Likely</p>
            <p className="text-lg font-bold">
              {getProbability('H', 'H') > 0.4 ? 'H→H' : getProbability('D', 'D') > 0.3 ? 'D→D' : 'V→V'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Confidence</p>
            <p className="text-lg font-bold">
              {transitionData?.confidence_scores
                ? ((Object.values(transitionData.confidence_scores).reduce((a, b) => a + b, 0) / Object.values(transitionData.confidence_scores).length) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Key Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">→</span>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Home Dominance</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Home wins have {(getProbability('H', 'H') * 100).toFixed(0)}% chance of repeating
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 font-bold">→</span>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Draw Patterns</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Draws have {(getProbability('D', 'D') * 100).toFixed(0)}% chance of repeating
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 font-bold">→</span>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Away Consistency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Away wins have {(getProbability('V', 'V') * 100).toFixed(0)}% chance of repeating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</p>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-semibold mb-1">States:</p>
              <p>H = Home Win</p>
              <p>D = Draw</p>
              <p>V = Away Win</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Matrix Reading:</p>
              <p>From State → To State</p>
              <p>Shows transition probability</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Color Intensity:</p>
              <p>Darker = Higher probability</p>
              <p>Lighter = Lower probability</p>
            </div>
          </div>
        </div>
      </div>
    </Spring>
  );
};

export default TransitionMatrix;
