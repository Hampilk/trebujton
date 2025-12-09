import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  getPredictions,
  getPrediction,
  createPrediction,
  updatePredictionResult,
  getPredictionStats,
  getPredictionAnalysis,
  type PredictionFilters,
  type PredictionInput,
  type PredictionResultUpdate,
  type PredictionStats,
  type PredictionAnalysis,
} from '@/lib/services/predictions';
import { handleApiError } from '@/lib/apiErrors';

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
    conflict?: {
      detected: boolean;
      severity: 'low' | 'medium' | 'high';
      message: string;
    };
  };
  status: 'pending' | 'correct' | 'incorrect';
  created_at: string;
  resolved_at?: string;
}

export const usePredictions = (filters?: PredictionFilters) => {
  return useQuery({
    queryKey: ['predictions', filters],
    queryFn: async () => {
      try {
        const data = await getPredictions(filters);
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
  });
};

export const usePrediction = (id: string) => {
  return useQuery({
    queryKey: ['predictions', id],
    queryFn: async () => {
      try {
        const data = await getPrediction(id);
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useCreatePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PredictionInput) => {
      try {
        const data = await createPrediction(input);
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
    },
  });
};

export const usePredictionStats = () => {
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: async () => {
      try {
        const data = await getPredictionStats();
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
  });
};

export const usePredictionAnalysis = () => {
  return useQuery({
    queryKey: ['prediction-analysis'],
    queryFn: async () => {
      try {
        const data = await getPredictionAnalysis();
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
  });
};

export const useUpdatePredictionResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resultUpdate }: { id: string; resultUpdate: PredictionResultUpdate }) => {
      try {
        const data = await updatePredictionResult(id, resultUpdate);
        return data;
      } catch (error) {
        handleApiError(error as Error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.id] });
    },
  });
};
