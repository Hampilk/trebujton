import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo_url?: string;
  team_id: string;
  nationality?: string;
  age?: number;
  height?: string;
  weight?: string;
  market_value?: number;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  goals: number;
  assists: number;
  matches_played: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
  passes_completed: number;
  passes_attempted: number;
  shots: number;
  shots_on_target: number;
}

export const usePlayers = (team_id?: string) => {
  return useQuery({
    queryKey: ['players', team_id],
    queryFn: async () => {
      let query = supabase.from('players').select('*');

      if (team_id) {
        query = query.eq('team_id', team_id);
      }

      const { data, error } = await query.order('number', { ascending: true });

      if (error) throw error;
      return data as Player[];
    },
  });
};

export const usePlayer = (id: string) => {
  return useQuery({
    queryKey: ['players', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Player;
    },
    enabled: !!id,
  });
};

export const usePlayerStats = (player_id: string) => {
  return useQuery({
    queryKey: ['player-stats', player_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', player_id)
        .single();

      if (error) throw error;
      return data as PlayerStats;
    },
    enabled: !!player_id,
  });
};