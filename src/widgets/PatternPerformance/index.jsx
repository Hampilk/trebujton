import React from 'react';

const PatternPerformanceWidget = ({ patterns }) => {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
      <h3 className="text-lg font-semibold mb-4">Pattern Performance</h3>
      {patterns.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No pattern data available</div>
      ) : (
        <div className="space-y-3">
          {patterns.slice(0, 5).map((pattern, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1">{pattern.name}</div>
                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pattern.accuracy}%` }}
                  />
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-semibold text-sm text-foreground">{Math.round(pattern.accuracy)}%</div>
                <div className="text-xs text-muted-foreground">{pattern.total} predictions</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Widget metadata
PatternPerformanceWidget.meta = {
  id: 'pattern-performance',
  name: 'Pattern Performance',
  category: 'dashboard',
  preview: 'Chart showing pattern accuracy',
  defaultSize: { w: 2, h: 2 },
  props: {
    patterns: {
      type: 'array',
      default: [],
      description: 'Array of pattern performance data'
    }
  }
};

export default PatternPerformanceWidget;