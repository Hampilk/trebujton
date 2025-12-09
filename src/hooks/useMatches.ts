import { useQuery } from '@tanstack/react-query';
import { FootballDataService } from '@/lib/services/football';

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  league_id: string;
  date: string;
  status: 'scheduled' | 'live' | 'finished';
  home_score: number;
  away_score: number;
  half_time_home_score?: number;
  half_time_away_score?: number;
}

export interface MatchFilterOptions {
  status?: 'scheduled' | 'live' | 'finished';
  league_id?: string;
  date?: string;
}

export const useMatches = (filters?: MatchFilterOptions) => {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () => FootballDataService.getMatches(filters),
  });
};

export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => FootballDataService.getLiveMatches(),
    refetchInterval: 30 * 1000,
  });
};

export const useMatch = (id: string) => {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => FootballDataService.getMatch(id),
    enabled: !!id,
  });
};
