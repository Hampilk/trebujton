import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

const MatchDetailPredictionWidget = ({ prediction, loading, onAnalyze, analyzing }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
        Loading predictions...
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Prediction</h3>
        </div>
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h4 className="text-xl font-semibold mb-2">Pattern Detection</h4>
          <p className="text-muted-foreground mb-4">
            Start AI analysis to get a prediction for this match
          </p>
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium flex items-center gap-2 mx-auto"
          >
            <TrendingUp className="w-4 h-4" />
            {analyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Prediction</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Predicted Outcome:</span>
          <span className="font-semibold text-foreground">{prediction.predicted_outcome}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-semibold text-primary">{Math.round(prediction.confidence_score)}%</span>
        </div>
        {prediction.btts_prediction !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Both Teams to Score:</span>
            <span className="font-semibold text-foreground">{prediction.btts_prediction ? 'Yes' : 'No'}</span>
          </div>
        )}
        {prediction.was_correct !== undefined && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-muted-foreground">Result:</span>
            <span className={`font-semibold ${prediction.was_correct ? 'text-green-500' : 'text-red-500'}`}>
              {prediction.was_correct ? '✓ Correct' : '✗ Incorrect'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Widget metadata
MatchDetailPredictionWidget.meta = {
  id: 'match-detail-prediction',
  name: 'Match Prediction',
  category: 'matches',
  preview: 'AI prediction for specific match',
  defaultSize: { w: 2, h: 2 },
  props: {
    prediction: {
      type: 'object',
      default: null,
      description: 'Prediction object with outcome and confidence'
    },
    loading: {
      type: 'boolean',
      default: false,
      description: 'Loading state'
    },
    onAnalyze: {
      type: 'function',
      default: () => {},
      description: 'Analysis trigger function'
    },
    analyzing: {
      type: 'boolean',
      default: false,
      description: 'Analysis in progress state'
    }
  }
};

export default MatchDetailPredictionWidget;