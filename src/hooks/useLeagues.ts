import { useQuery } from '@tanstack/react-query';
import { FootballDataService } from '@/lib/services/football';

export interface League {
  id: string;
  name: string;
  country: string;
  logo_url?: string;
  season: string;
}

export interface LeagueStanding {
  position: number;
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export const useLeagues = () => {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: () => FootballDataService.getLeagues(),
  });
};

export const useLeague = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id],
    queryFn: () => FootballDataService.getLeague(id),
    enabled: !!id,
  });
};

export const useLeagueStandings = (league_id: string) => {
  return useQuery({
    queryKey: ['league-standings', league_id],
    queryFn: () => FootballDataService.getLeagueStandings(league_id),
    enabled: !!league_id,
  });
};
