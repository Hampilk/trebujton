import React from 'react';

const DashboardStatsWidget = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Total Predictions</div>
        <div className="text-3xl font-bold text-foreground">{stats.totalPredictions}</div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Overall Accuracy</div>
        <div className="text-3xl font-bold text-green-500">{stats.accuracy}%</div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Top Pattern</div>
        <div className="text-lg font-semibold text-foreground truncate">{stats.topPattern}</div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Winning Streak</div>
        <div className="text-3xl font-bold text-blue-500">{stats.winningStreak}</div>
      </div>
    </div>
  );
};

// Widget metadata
DashboardStatsWidget.meta = {
  id: 'dashboard-stats',
  name: 'Dashboard Statistics',
  category: 'dashboard',
  preview: 'Statistics overview widget',
  defaultSize: { w: 4, h: 1 },
  props: {
    stats: {
      type: 'object',
      default: { totalPredictions: 0, accuracy: 0, topPattern: 'N/A', winningStreak: 0 },
      description: 'Dashboard statistics object'
    }
  }
};

export default DashboardStatsWidget;