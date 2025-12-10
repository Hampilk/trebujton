import { supabase } from '@/integrations/supabase/client'
// The generated `Database` types may not include an `events` table.
// Define a local `Event` interface used by this service.
export interface Event {
  id: string
  title: string
  description?: string | null
  start_time: string
  end_time?: string | null
  location?: string | null
  all_day?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .order('start_time', { ascending: true })

    if (error) throw error
    return (data as unknown as Event[]) || []
  },

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true })

    if (error) throw error
    return (data as unknown as Event[]) || []
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as unknown as Event
  },

  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    const _res = await (supabase.from('events' as any) as any)
      .insert(eventData as any)
      .select()
      .single()

    const data = _res.data as any
    const error = _res.error
    if (error) throw error
    return data as unknown as Event
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const _res = await (supabase.from('events' as any) as any)
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
    return data as unknown as Event
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events' as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}