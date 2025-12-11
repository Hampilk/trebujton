import React from 'react';
import { RefreshCcw } from 'lucide-react';

const RecentPredictionsWidget = ({ predictions, loading, onRefresh }) => {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Predictions</h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading predictions...
        </div>
      ) : predictions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No predictions yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Match</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">League</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Confidence</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => (
                <tr key={pred.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {pred.match.home_team} vs {pred.match.away_team}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{pred.match.league}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-primary">
                    {Math.round(pred.confidence_score)}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {pred.was_correct === true && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-500">✓ Correct</span>
                    )}
                    {pred.was_correct === false && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-500">✗ Wrong</span>
                    )}
                    {pred.was_correct === null && (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Widget metadata
RecentPredictionsWidget.meta = {
  id: 'recent-predictions',
  name: 'Recent Predictions',
  category: 'dashboard',
  preview: 'List of recent predictions',
  defaultSize: { w: 2, h: 2 },
  props: {
    predictions: {
      type: 'array',
      default: [],
      description: 'Array of recent predictions'
    },
    loading: {
      type: 'boolean',
      default: false,
      description: 'Loading state'
    },
    onRefresh: {
      type: 'function',
      default: () => {},
      description: 'Refresh callback function'
    }
  }
};

export default RecentPredictionsWidget;