import { supabase } from '@/integrations/supabase/client'
// Local Product type: generated types don't include `products` table in some setups.
export interface Product {
  id: string
  name: string
  description?: string | null
  price?: number | null
  category?: string | null
  is_featured?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as unknown as Product[]) || []
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as unknown as Product[]) || []
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as unknown as Product
  },

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as unknown as Product[]) || []
  }
}