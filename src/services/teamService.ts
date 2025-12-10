import { supabase } from '@/integrations/supabase/client'
// Local Team and League types (fallbacks)
export interface Team {
  created_at?: string | null
  founded_year?: number | null
  id: string
  league_id?: string
  logo_url?: string | null
  name: string
  updated_at?: string | null
  country?: string
}

export interface League {
  id: string
  name: string
}

interface CreateTeamInput {
  name: string
  short_name: string
  league_id: string
  logo_url?: string
  founded?: number
  stadium?: string
}

interface TeamWithStats extends Team {
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
  points: number
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams' as any)
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as Team[]) || []
  },

  async getTeamsByLeague(leagueId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams' as any)
      .select('*')
      .eq('league_id', leagueId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as Team[]) || []
  },

  async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Team
  },

  async getTeamWithStats(id: string): Promise<TeamWithStats | null> {
    // Get team basic info
    const { data: team, error: teamError } = await supabase
      .from('teams' as any)
      .select('*')
      .eq('id', id)
      .single()
    
    if (teamError) {
      if (teamError.code === 'PGRST116') return null
      throw teamError
    }

    // Get match statistics
    const { data: matches, error: matchesError } = await supabase
      .from('matches' as any)
      .select('home_score, away_score, home_team_id, away_team_id')
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
      .eq('status', 'finished')
    
    if (matchesError) throw matchesError

    // Calculate stats
    let matches_played = 0
    let wins = 0
    let draws = 0
    let losses = 0
    let goals_scored = 0
    let goals_conceded = 0

    const matchesList = matches as unknown as Array<any>
    matchesList?.forEach(match => {
      matches_played++
      
      const isHome = match.home_team_id === id
      const teamScore = isHome ? match.home_score || 0 : match.away_score || 0
      const opponentScore = isHome ? match.away_score || 0 : match.home_score || 0
      
      goals_scored += teamScore
      goals_conceded += opponentScore
      
      if (teamScore > opponentScore) {
        wins++
      } else if (teamScore === opponentScore) {
        draws++
      } else {
        losses++
      }
    })

    const points = wins * 3 + draws

    const teamObj = team as unknown as Team

    return {
      ...teamObj,
      matches_played,
      wins,
      draws,
      losses,
      goals_scored,
      goals_conceded,
      points
    }
  },

  async createTeam(teamData: CreateTeamInput): Promise<Team> {
    const _res = await (supabase.from('teams' as any) as any)
      .insert(teamData as any)
      .select()
      .single()
    
    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data
  },

  async updateTeam(id: string, teamData: Partial<CreateTeamInput>): Promise<Team> {
    const _res = await (supabase.from('teams' as any) as any)
      .update({
        ...teamData,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()
    
    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data
  },

  async deleteTeam(id: string): Promise<void> {
    const _res = await (supabase.from('teams' as any) as any)
      .delete()
      .eq('id', id)

    const error = _res.error
    if (error) throw error
  },

  async getLeagueTable(leagueId: string): Promise<TeamWithStats[]> {
    const teams = await this.getTeamsByLeague(leagueId)
    
    const teamsWithStats = await Promise.all(
      teams.map(team => this.getTeamWithStats(team.id))
    )
    
    // Filter out null values and sort by points, then by goal difference
    return teamsWithStats
      .filter((team): team is TeamWithStats => team !== null)
      .sort((a, b) => {
        if (a.points !== b.points) {
          return b.points - a.points
        }
        const goalDiffA = a.goals_scored - a.goals_conceded
        const goalDiffB = b.goals_scored - b.goals_conceded
        return goalDiffB - goalDiffA
      })
  },

  async getTeamsByCountry(country: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams' as any)
      .select('*')
      .eq('country', country)
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as Team[]) || []
  },

  async getAllCountries(): Promise<string[]> {
    const { data, error } = await supabase
      .from('teams' as any)
      .select('country')
      .not('country', 'is', null)
      .order('country', { ascending: true })

    if (error) throw error

    // Extract unique countries
    const countries = [...new Set(((data as unknown as { country?: string }[]) || []).map(team => team.country))]
    return countries
  }
}