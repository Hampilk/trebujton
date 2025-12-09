import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

export const useMatches = (filters?: {
  status?: string;
  league_id?: string;
  date?: string;
}) => {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: async () => {
      let query = supabase.from('matches').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.league_id) {
        query = query.eq('league_id', filters.league_id);
      }
      if (filters?.date) {
        query = query.gte('date', filters.date);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
  });
};

export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'live')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live matches
  });
};

export const useMatch = (id: string) => {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Match;
    },
    enabled: !!id,
  });
};
