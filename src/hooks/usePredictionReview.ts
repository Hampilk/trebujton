import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BlockedPredictionForReview, Prediction, PredictionReviewLog } from '@/types/admin';
import { handleApiError } from '@/lib/apiErrors';
import { useAuth } from '@/contexts/AuthContext';

export interface PredictionReviewFilters {
  confidenceThreshold?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: 'pending' | 'reviewed';
}

export const useBlockedPredictionsForReview = (filters?: PredictionReviewFilters) => {
  return useQuery({
    queryKey: ['admin', 'predictions', 'blocked', filters],
    queryFn: async () => {
      let query = supabase
        .from('blocked_predictions_for_review')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.confidenceThreshold !== undefined) {
        query = query.lte('confidence', filters.confidenceThreshold);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.status) {
        query = query.eq('review_status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);
      return data as BlockedPredictionForReview[];
    },
  });
};

export const usePredictionReviewLog = (predictionId: string) => {
  return useQuery({
    queryKey: ['admin', 'prediction_review_log', predictionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prediction_review_log')
        .select('*')
        .eq('prediction_id', predictionId)
        .order('created_at', { ascending: false });

      if (error) throw handleApiError(error);
      return data as PredictionReviewLog[];
    },
    enabled: !!predictionId,
  });
};

export const useAcceptPrediction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ predictionId }: { predictionId: string }) => {
      // Update prediction status to approved
      const { data: prediction, error: updateError } = await supabase
        .from('predictions')
        .update({ 
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', predictionId)
        .select()
        .single();

      if (updateError) throw handleApiError(updateError);

      // Log the review action
      const { error: logError } = await supabase
        .from('prediction_review_log')
        .insert({
          prediction_id: predictionId,
          action: 'approved',
          reviewed_by: user?.id,
          confidence_breakdown: (prediction as any)?.confidence_breakdown,
          reason: 'Manual admin approval',
        });

      if (logError) {
        console.error('Failed to log prediction review:', logError);
      }

      return prediction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'predictions'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
};

export const useRejectPrediction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      predictionId, 
      reason 
    }: { 
      predictionId: string; 
      reason: string;
    }) => {
      // Update prediction status to rejected
      const { data: prediction, error: updateError } = await supabase
        .from('predictions')
        .update({ 
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', predictionId)
        .select()
        .single();

      if (updateError) throw handleApiError(updateError);

      // Log the review action
      const { error: logError } = await supabase
        .from('prediction_review_log')
        .insert({
          prediction_id: predictionId,
          action: 'rejected',
          reviewed_by: user?.id,
          confidence_breakdown: (prediction as any)?.confidence_breakdown,
          reason,
        });

      if (logError) {
        console.error('Failed to log prediction review:', logError);
      }

      return prediction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'predictions'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
};

export const useBulkReviewPredictions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      predictionIds, 
      action, 
      reason 
    }: { 
      predictionIds: string[]; 
      action: 'approved' | 'rejected';
      reason?: string;
    }) => {
      const updates = predictionIds.map(async (predictionId) => {
        const { data: prediction, error: updateError } = await supabase
          .from('predictions')
          .update({ 
            status: action,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
            ...(action === 'rejected' && { rejection_reason: reason })
          })
          .eq('id', predictionId)
          .select()
          .single();

        if (updateError) throw handleApiError(updateError);

        const { error: logError } = await supabase
          .from('prediction_review_log')
          .insert({
            prediction_id: predictionId,
            action,
            reviewed_by: user?.id,
            confidence_breakdown: (prediction as any)?.confidence_breakdown,
            reason: reason || `${action} via bulk review`,
          });

        if (logError) {
          console.error('Failed to log prediction review:', logError);
        }

        return prediction;
      });

      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'predictions'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
};

export const useConfidenceThreshold = () => {
  return useQuery({
    queryKey: ['admin', 'confidence_threshold'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment_variables')
        .select('value')
        .eq('key', 'prediction_confidence_threshold')
        .single();

      if (error && error.code !== 'PGRST116') throw handleApiError(error);
      return data?.value ? parseFloat(data.value) : 0.7; // Default 70% threshold
    },
  });
};

export const useUpdateConfidenceThreshold = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ threshold }: { threshold: number }) => {
      const { data, error } = await supabase
        .from('environment_variables')
        .upsert({ 
          key: 'prediction_confidence_threshold',
          value: threshold.toString(),
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Update audit log
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: user?.id,
          action: 'update_confidence_threshold',
          target_field: 'prediction_confidence_threshold',
          new_value: threshold.toString(),
          ip_address: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'unknown'),
        });

      if (auditError) {
        console.error('Failed to log admin action:', auditError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'confidence_threshold'] });
      queryClient.invalidateQueries({ queryKey: ['environment_variables'] });
    },
  });
};