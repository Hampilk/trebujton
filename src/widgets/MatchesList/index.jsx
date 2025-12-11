import React from 'react';
import { Search, Filter } from 'lucide-react';

const MatchesListWidget = ({ matches, loading, searchTerm, onSearchChange, selectedStatus, onStatusChange }) => {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold mb-4">Matches</h3>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search teams or league..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          Loading matches...
        </div>
      ) : !matches || matches.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No matches found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">League</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Match</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Result</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{match.league?.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                    {match.home_score !== undefined ? (
                      <span>{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      match.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      match.status === 'live' ? 'bg-red-500/20 text-red-500' :
                      match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {match.status}
                    </span>
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
MatchesListWidget.meta = {
  id: 'matches-list',
  name: 'Matches List',
  category: 'matches',
  preview: 'Filterable matches list',
  defaultSize: { w: 4, h: 3 },
  props: {
    matches: {
      type: 'array',
      default: [],
      description: 'Array of matches'
    },
    loading: {
      type: 'boolean',
      default: false,
      description: 'Loading state'
    },
    searchTerm: {
      type: 'string',
      default: '',
      description: 'Current search term'
    },
    onSearchChange: {
      type: 'function',
      default: () => {},
      description: 'Search term change handler'
    },
    selectedStatus: {
      type: 'string',
      default: 'all',
      description: 'Currently selected status filter'
    },
    onStatusChange: {
      type: 'function',
      default: () => {},
      description: 'Status filter change handler'
    }
  }
};

export default MatchesListWidget;