import { supabase } from '@/integrations/supabase/client'
// Local League type (fallback)
export interface League {
  id: string
  name: string
  short_name?: string
  country?: string
  logo_url?: string | null
  season?: string
  is_active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

interface CreateLeagueInput {
  name: string
  short_name: string
  country: string
  logo_url?: string
  season: string
  is_active?: boolean
}

export const leagueService = {
  async getAllLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues' as any)
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as League[]) || []
  },

  async getActiveLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues' as any)
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as League[]) || []
  },

  async getLeagueById(id: string): Promise<League | null> {
    const { data, error } = await supabase
      .from('leagues' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as League
  },

  async getLeaguesByCountry(country: string): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues' as any)
      .select('*')
      .eq('country', country)
      .order('name', { ascending: true })

    if (error) throw error
    return (data as unknown as League[]) || []
  },

  async createLeague(leagueData: CreateLeagueInput): Promise<League> {
    const _res = await (supabase.from('leagues' as any) as any)
      .insert(leagueData as any)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as League
  },

  async updateLeague(id: string, leagueData: Partial<CreateLeagueInput>): Promise<League> {
    const _res = await (supabase.from('leagues' as any) as any)
      .update({
        ...leagueData,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as League
  },

  async deleteLeague(id: string): Promise<void> {
    const { error } = await supabase
      .from('leagues' as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleLeagueStatus(id: string, isActive: boolean): Promise<League> {
    const _res = await (supabase.from('leagues' as any) as any)
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as League
  }
}