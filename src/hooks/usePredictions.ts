import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Prediction {
  id: string;
  match_id: string;
  prediction_type: '1X2' | 'BTTS' | 'O/U';
  prediction: string;
  confidence: number;
  model_version: string;
  ensemble_breakdown: {
    full_time: { prediction: string; confidence: number };
    half_time: { prediction: string; confidence: number };
    pattern: { prediction: string; confidence: number };
    weights_used: { ft: number; ht: number; pt: number };
  };
  status: 'pending' | 'correct' | 'incorrect';
  created_at: string;
  resolved_at?: string;
}

export const usePredictions = (filters?: {
  match_id?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['predictions', filters],
    queryFn: async () => {
      let query = supabase.from('predictions').select('*');

      if (filters?.match_id) {
        query = query.eq('match_id', filters.match_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Prediction[];
    },
  });
};

export const usePrediction = (id: string) => {
  return useQuery({
    queryKey: ['predictions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Prediction;
    },
    enabled: !!id,
  });
};

export const useCreatePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prediction: Omit<Prediction, 'id' | 'created_at' | 'resolved_at'>) => {
      const { data, error } = await supabase
        .from('predictions')
        .insert(prediction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
};

export const usePredictionStats = () => {
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_prediction_stats');

      if (error) throw error;
      return data;
    },
  });
};
