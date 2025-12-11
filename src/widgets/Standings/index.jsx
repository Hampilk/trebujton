import React from 'react';
import WidgetGroup from '@components/WidgetGroup';

const Standings = ({ 
  teams = [],
  title = "League Standings",
  showForm = true,
  showRelegation = true
}) => {
  // Mock data if no teams provided
  const mockTeams = [
    { position: 1, name: "Arsenal", played: 38, won: 26, drawn: 6, lost: 6, goalsFor: 88, goalsAgainst: 43, goalDifference: 45, points: 84, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 2, name: "Manchester City", played: 38, won: 28, drawn: 5, lost: 5, goalsFor: 96, goalsAgainst: 34, goalDifference: 62, points: 89, form: ['W', 'W', 'W', 'W', 'D'] },
    { position: 3, name: "Manchester United", played: 38, won: 23, drawn: 6, lost: 9, goalsFor: 58, goalsAgainst: 43, goalDifference: 15, points: 75, form: ['L', 'W', 'W', 'D', 'W'] },
    { position: 4, name: "Newcastle United", played: 38, won: 19, drawn: 14, lost: 5, goalsFor: 68, goalsAgainst: 33, goalDifference: 35, points: 71, form: ['D', 'W', 'D', 'W', 'L'] },
    { position: 5, name: "Liverpool", played: 38, won: 21, drawn: 8, lost: 9, goalsFor: 75, goalsAgainst: 47, goalDifference: 28, points: 71, form: ['W', 'L', 'W', 'W', 'D'] },
  ];

  const displayTeams = teams.length > 0 ? teams : mockTeams;

  const getPositionStyle = (position) => {
    if (showRelegation) {
      if (position <= 4) return 'bg-green-500/20 text-green-500';
      if (position <= 6) return 'bg-blue-500/20 text-blue-500';
      if (position >= 18) return 'bg-red-500/20 text-red-500';
    }
    return 'bg-muted/20 text-muted-foreground';
  };

  const getFormBadgeColor = (result) => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">P</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">W</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">D</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">L</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GF</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GA</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Pts</th>
                {showForm && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Form</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayTeams.map((team) => (
                <tr key={team.position} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPositionStyle(team.position)}`}>
                      {team.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{team.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.played}</td>
                  <td className="px-4 py-3 text-center text-sm text-green-500 font-medium">{team.won}</td>
                  <td className="px-4 py-3 text-center text-sm text-yellow-500 font-medium">{team.drawn}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-500 font-medium">{team.lost}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.goalsAgainst}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-primary">{team.points}</td>
                  {showForm && (
                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex gap-0.5 justify-center">
                        {team.form.map((result, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-semibold ${getFormBadgeColor(result)}`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetGroup>
  );
};

export default Standings;

// Widget metadata
Standings.meta = {
  id: 'standings',
  name: 'League Standings',
  category: 'teams',
  defaultSize: { w: 4, h: 3 },
  preview: 'Table showing league standings with team statistics',
  props: {
    teams: {
      type: 'array',
      default: [],
      description: 'Array of team objects with position, name, stats'
    },
    title: {
      type: 'string',
      default: 'League Standings',
      description: 'Title for the standings table'
    },
    showForm: {
      type: 'boolean',
      default: true,
      description: 'Whether to show recent form badges'
    },
    showRelegation: {
      type: 'boolean',
      default: true,
      description: 'Whether to highlight positions for relegation/champions league'
    }
  }
};