import React from 'react';
import { Brain } from 'lucide-react';

const MatchInfoWidget = ({ match, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
        Loading match details...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
        Match not found
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {match.league?.name}
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {match.home_team?.name} vs {match.away_team?.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(match.match_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-primary/10 text-primary">
            {match.status}
          </span>
          {match.home_score !== undefined && (
            <div className="text-3xl font-bold text-foreground">
              {match.home_score} - {match.away_score}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Widget metadata
MatchInfoWidget.meta = {
  id: 'match-info',
  name: 'Match Information',
  category: 'matches',
  preview: 'Match details and status',
  defaultSize: { w: 4, h: 1 },
  props: {
    match: {
      type: 'object',
      default: null,
      description: 'Match object with team and league info'
    },
    loading: {
      type: 'boolean',
      default: false,
      description: 'Loading state'
    }
  }
};

export default MatchInfoWidget;