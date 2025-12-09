import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/lib/apiErrors';
import type { Prediction } from '@/hooks/usePredictions';
import { EnsemblePredictor } from '@/lib/ensemble';

export interface PredictionInput {
  match_id: string;
  prediction_type: '1X2' | 'BTTS' | 'O/U';
  full_time_prediction?: { prediction: string; confidence: number };
  half_time_prediction?: { prediction: string; confidence: number };
  pattern_prediction?: { prediction: string; confidence: number };
  ensemble_breakdown?: {
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
}

export interface PredictionFilters {
  match_id?: string;
  status?: 'pending' | 'correct' | 'incorrect';
  prediction_type?: string;
  model_version?: string;
  limit?: number;
  offset?: number;
}

export interface PredictionStats {
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  avg_confidence: number;
  predictions_by_type: {
    '1X2': { total: number; correct: number };
    BTTS: { total: number; correct: number };
    'O/U': { total: number; correct: number };
  };
  model_performance: {
    [model_version: string]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
}

export interface PredictionAnalysis {
  trends: {
    high_confidence: Prediction[];
    recent_patterns: {
      pattern_type: string;
      frequency: number;
      accuracy: number;
    }[];
  };
  recommendations: {
    model_tuning: string[];
    confidence_thresholds: {
      min_confidence: number;
      min_samples: number;
    };
  };
}

export interface PredictionResultUpdate {
  status: 'correct' | 'incorrect';
  actual_result: string;
  resolved_at: string;
}

/**
 * Fetches a list of predictions with optional filtering
 */
export const getPredictions = async (filters: PredictionFilters = {}): Promise<Prediction[]> => {
  try {
    let query = supabase.from('predictions').select('*');

    if (filters.match_id) {
      query = query.eq('match_id', filters.match_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.prediction_type) {
      query = query.eq('prediction_type', filters.prediction_type);
    }
    if (filters.model_version) {
      query = query.eq('model_version', filters.model_version);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Prediction[];
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};

/**
 * Fetches a single prediction by ID
 */
export const getPrediction = async (id: string): Promise<Prediction> => {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Prediction;
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};

/**
 * Creates a new prediction with ensemble calculation
 */
export const createPrediction = async (input: PredictionInput): Promise<Prediction> => {
  try {
    // Use the EnsemblePredictor to calculate the final prediction
    const ensemblePredictor = new EnsemblePredictor();
    const ensembleResult = ensemblePredictor.predict({
      full_time_prediction: input.full_time_prediction,
      half_time_prediction: input.half_time_prediction,
      pattern_prediction: input.pattern_prediction,
    });

    const predictionData = {
      match_id: input.match_id,
      prediction_type: input.prediction_type,
      prediction: ensembleResult.prediction,
      confidence: ensembleResult.confidence,
      model_version: `ensemble-v1`,
      ensemble_breakdown: ensembleResult.ensemble_breakdown,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('predictions')
      .insert(predictionData)
      .select()
      .single();

    if (error) throw error;
    return data as Prediction;
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};

/**
 * Updates a prediction with the actual result
 */
export const updatePredictionResult = async (
  id: string,
  resultUpdate: PredictionResultUpdate
): Promise<Prediction> => {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .update({
        status: resultUpdate.status,
        resolved_at: resultUpdate.resolved_at,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Prediction;
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};

/**
 * Gets prediction statistics
 */
export const getPredictionStats = async (): Promise<PredictionStats> => {
  try {
    const { data, error } = await supabase.rpc('get_prediction_stats');

    if (error) throw error;
    return data as PredictionStats;
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};

/**
 * Gets prediction analysis
 */
export const getPredictionAnalysis = async (): Promise<PredictionAnalysis> => {
  try {
    const { data, error } = await supabase.rpc('get_prediction_analysis');

    if (error) throw error;
    return data as PredictionAnalysis;
  } catch (error) {
    handleApiError(error as Error);
    throw error;
  }
};
