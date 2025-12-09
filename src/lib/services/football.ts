import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/lib/apiErrors';
import type { Match } from '@/hooks/useMatches';
import type { LeagueStanding, League } from '@/hooks/useLeagues';

export interface MatchesFilterOptions {
  status?: 'scheduled' | 'live' | 'finished';
  league_id?: string;
  date?: string;
}

export interface LeagueStandingsResponse {
  standings: LeagueStanding[];
}

export class FootballDataService {
  static async getMatches(filters?: MatchesFilterOptions): Promise<Match[]> {
    try {
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

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as Match[];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  static async getMatch(id: string): Promise<Match> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as Match;
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  }

  static async getLiveMatches(): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'live')
        .order('date', { ascending: true });

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as Match[];
    } catch (error) {
      console.error('Error fetching live matches:', error);
      throw error;
    }
  }

  static async getLeagues(): Promise<League[]> {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as League[];
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  }

  static async getLeague(id: string): Promise<League> {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as League;
    } catch (error) {
      console.error('Error fetching league:', error);
      throw error;
    }
  }

  static async getLeagueStandings(
    league_id: string
  ): Promise<LeagueStanding[]> {
    try {
      const { data, error } = await supabase
        .from('league_standings')
        .select('*')
        .eq('league_id', league_id)
        .order('position', { ascending: true });

      if (error) {
        handleApiError(error);
        throw error;
      }

      return data as LeagueStanding[];
    } catch (error) {
      console.error('Error fetching league standings:', error);
      throw error;
    }
  }
}
