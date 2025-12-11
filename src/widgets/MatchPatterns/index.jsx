import React from 'react';

const MatchPatternsWidget = ({ patterns }) => {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
      <h3 className="text-lg font-semibold mb-4">Detected Patterns</h3>
      {patterns && patterns.length > 0 ? (
        <div className="space-y-3">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="border border-border/60 rounded-lg p-3 bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{pattern.template_name}</div>
                {pattern.confidence_boost && (
                  <span className="text-xs text-primary font-medium">
                    +{Math.round(pattern.confidence_boost * 100)}% confidence
                  </span>
                )}
              </div>
              {pattern.data && Object.keys(pattern.data).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Pattern data: {Object.entries(pattern.data).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No patterns detected for this match
        </div>
      )}
    </div>
  );
};

// Widget metadata
MatchPatternsWidget.meta = {
  id: 'match-patterns',
  name: 'Match Patterns',
  category: 'matches',
  preview: 'Detected patterns for specific match',
  defaultSize: { w: 2, h: 2 },
  props: {
    patterns: {
      type: 'array',
      default: [],
      description: 'Array of detected patterns for the match'
    }
  }
};

export default MatchPatternsWidget;