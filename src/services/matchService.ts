import { supabase } from '@/integrations/supabase/client'


// Local types for matches/teams/leagues to avoid depending on generated DB types
export interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_score?: number | null
  away_score?: number | null
  match_date?: string | null
  status?: string | null
  league_id?: string | null
}

export interface Team {
  id: string
  name: string
  logo_url?: string | null
  short_name?: string | null
}

export interface League {
  id: string
  name: string
}

interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
  league: League
}

interface CreateMatchInput {
  home_team_id: string
  away_team_id: string
  match_date: string
  league_id: string
  venue?: string
}

export const matchService = {
  async getUpcomingMatches(): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .gte('match_date', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('match_date', { ascending: true })

    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getLiveMatches(): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('status', 'live')
      .order('match_date', { ascending: true })

    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getFinishedMatches(limit = 50): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getMatchById(id: string): Promise<MatchWithTeams | null> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as unknown as MatchWithTeams
  },

  async createMatch(matchData: CreateMatchInput): Promise<Match> {
    const _res = await (supabase.from('matches' as any) as any)
      .insert(matchData as any)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Match
  },

  async updateMatchScore(
    matchId: string, 
    homeScore: number, 
    awayScore: number
  ): Promise<Match> {
    const _res = await (supabase.from('matches' as any) as any)
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', matchId)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Match
  },

  async updateMatchStatus(
    matchId: string, 
    status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  ): Promise<Match> {
    const _res = await (supabase.from('matches' as any) as any)
      .update({
        status,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', matchId)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Match
  },

  async getMatchesByLeague(leagueId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('league_id', leagueId)
      .order('match_date', { ascending: false })

    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getMatchesByTeam(teamId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('match_date', { ascending: false })

    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getKnockoutMatches(stage?: string): Promise<MatchWithTeams[]> {
    const query: any = supabase
      .from('matches' as any)
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('is_knockout', true)
      .order('match_date', { ascending: true })
    
    if (stage) {
      query.eq('knockout_stage', stage)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data as unknown as MatchWithTeams[]) || []
  },

  async getMatchStatistics(matchId: string): Promise<any[]> {
    // For now, return mock data for ball possession
    // In a real implementation, this would query match_events or match_statistics tables
    const mockData = [
      {
        id: 'juventus',
        label: 'Juventus (ITA)',
        data: [
          {a: 12, b: 25},
          {a: 18, b: 13},
          {a: 8, b: 31},
          {a: 40, b: 18},
          {a: 12, b: 36},
          {a: 35, b: 10},
          {a: 10, b: 38},
          {a: 34, b: 12},
        ]
      },
      {
        id: 'barcelona',
        label: 'Barcelona (ESP)',
        data: [
          {a: 17, b: 50},
          {a: 29, b: 17},
          {a: 36, b: 22},
          {a: 24, b: 12},
          {a: 44, b: 52},
          {a: 12, b: 19},
          {a: 37, b: 21},
          {a: 12, b: 44},
        ]
      },
      {
        id: 'real_madrid',
        label: 'Real Madrid (ESP)',
        data: [
          {a: 15, b: 28},
          {a: 33, b: 25},
          {a: 44, b: 12},
          {a: 20, b: 46},
          {a: 8, b: 50},
          {a: 52, b: 25},
          {a: 28, b: 12},
          {a: 50, b: 14},
        ]
      },
      {
        id: 'bayern',
        label: 'Bayern (GER)',
        data: [
          {a: 17, b: 50},
          {a: 29, b: 17},
          {a: 36, b: 22},
          {a: 24, b: 12},
          {a: 44, b: 52},
          {a: 12, b: 19},
          {a: 37, b: 21},
          {a: 12, b: 44},
        ]
      }
    ];
    
    return mockData;
  }
}