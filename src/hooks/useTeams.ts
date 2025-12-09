import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  league_id: string;
  country: string;
}

export interface TeamStats {
  team_id: string;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  form: string;
  matches_played: number;
  points: number;
  goal_difference: number;
}

export interface TeamComparisonStats {
  team_id: string;
  metric_name: string;
  metric_value: number;
  comparison_range: 'week' | 'month' | 'year';
}

export const useTeams = (league_id?: string) => {
  return useQuery({
    queryKey: ['teams', league_id],
    queryFn: async () => {
      let query = supabase.from('teams').select('*');

      if (league_id) {
        query = query.eq('league_id', league_id);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data as Team[];
    },
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!id,
  });
};

export const useTeamStats = (team_id: string) => {
  return useQuery({
    queryKey: ['team-stats', team_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_id', team_id)
        .single();

      if (error) throw error;
      return data as TeamStats;
    },
    enabled: !!team_id,
  });
};

export const useTeamComparisonStats = (team_id: string, range: 'week' | 'month' | 'year') => {
  return useQuery({
    queryKey: ['team-comparison-stats', team_id, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_comparison_stats')
        .select('*')
        .eq('team_id', team_id)
        .eq('comparison_range', range);

      if (error) throw error;
      return data as TeamComparisonStats[];
    },
    enabled: !!team_id,
  });
};
