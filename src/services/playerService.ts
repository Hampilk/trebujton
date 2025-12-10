import { supabase } from '@/integrations/supabase/client'
// Local Player type - generated types may not include `players` table
export interface Player {
  id: string
  name: string
  jersey_number?: number | null
  is_captain?: boolean | null
  team_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Team {
  created_at?: string | null
  founded_year?: number | null
  id: string
  league_id?: string
  logo_url?: string | null
  name: string
  updated_at?: string | null
}

interface PlayerWithTeam extends Player {
  team: Team
}

export const playerService = {
  async getPlayersByTeam(teamId: string): Promise<PlayerWithTeam[]> {
    const { data, error } = await supabase
      .from('players' as any)
      .select(`
        *,
        team:teams(*)
      `)
      .eq('team_id', teamId)
      .order('is_captain', { ascending: false })
      .order('jersey_number', { ascending: true })

    if (error) throw error
    return (data as unknown as PlayerWithTeam[]) || []
  },

  async getAllPlayers(): Promise<PlayerWithTeam[]> {
    const { data, error } = await supabase
      .from('players' as any)
      .select(`
        *,
        team:teams(*)
      `)
      .order('team_id')
      .order('is_captain', { ascending: false })
      .order('jersey_number', { ascending: true })

    if (error) throw error
    return (data as unknown as PlayerWithTeam[]) || []
  },

  async getPlayerById(id: string): Promise<PlayerWithTeam | null> {
    const { data, error } = await supabase
      .from('players' as any)
      .select(`
        *,
        team:teams(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as unknown as PlayerWithTeam
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const _res = await (supabase.from('players' as any) as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Player
  }
}