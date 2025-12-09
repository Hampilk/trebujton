import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as League[];
    },
  });
};

export const useLeague = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as League;
    },
    enabled: !!id,
  });
};

export const useLeagueStandings = (league_id: string) => {
  return useQuery({
    queryKey: ['league-standings', league_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_standings')
        .select('*')
        .eq('league_id', league_id)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as LeagueStanding[];
    },
    enabled: !!league_id,
  });
};
