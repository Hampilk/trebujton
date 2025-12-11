import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
interface Match {
  id: string;
  match_date: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
  league: { id: string; name: string; country: string };
}

interface MatchDetail extends Match {
  halftime_home_score?: number;
  halftime_away_score?: number;
}

// Query keys
export const matchesQueryKeys = {
  all: ['matches'] as const,
  list: () => [...matchesQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...matchesQueryKeys.all, 'detail', id] as const,
};

// Fetch functions
const fetchMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      league:leagues(id, name, country),
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `)
    .order('match_date', { ascending: true });

  if (error) throw error;

  return data || [];
};

const fetchMatchDetail = async (id: string): Promise<MatchDetail | null> => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      halftime_home_score,
      halftime_away_score,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name),
      league:leagues(id, name, country)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }

  return data;
};

// Hooks
export function useMatches(options?: {
  searchTerm?: string;
  selectedStatus?: string;
}) {
  const { searchTerm = '', selectedStatus = 'all' } = options || {};

  return useQuery({
    queryKey: [...matchesQueryKeys.list(), { searchTerm, selectedStatus }],
    queryFn: async () => {
      const matches = await fetchMatches();
      
      // Apply filters
      return matches.filter(match => {
        const matchesSearch = 
          !searchTerm ||
          match.home_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.away_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.league?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = selectedStatus === 'all' || match.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
      });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });
}

export function useMatchDetail(id: string) {
  return useQuery({
    queryKey: matchesQueryKeys.detail(id),
    queryFn: () => fetchMatchDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}