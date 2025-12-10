import { supabase } from "@/integrations/supabase/client";

interface CreateProfileInput {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'user' | 'analyst'
}
// Local Profile type (fallback)
export interface Profile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  is_active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export const userService = {
  async getCurrentUserProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles' as any)
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Profile
  },

  async getUserProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('user_profiles' as any)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Profile
  },

  async updateUserProfile(id: string, profileData: Partial<CreateProfileInput>): Promise<Profile> {
    const _res = await (supabase.from('user_profiles' as any) as any)
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Profile
  },

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('user_profiles' as any)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data as unknown as Profile[]) || []
  },

  async updateUserRole(id: string, role: 'admin' | 'user' | 'analyst'): Promise<Profile> {
    const _res = await (supabase.from('user_profiles' as any) as any)
      .update({
        role,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Profile
  },

  async deleteUser(id: string): Promise<void> {
    // First delete the profile
    const { error: profileError } = await supabase
      .from('user_profiles' as any)
      .delete()
      .eq('id', id)
    
    if (profileError) throw profileError

    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) throw authError
  }
}