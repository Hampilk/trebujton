import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ModelPerformance, ModelRegistry } from '@/types/admin';
import { handleApiError } from '@/lib/apiErrors';

export interface ModelFilters {
  status?: 'active' | 'inactive' | 'shadow';
  model_type?: 'classification' | 'regression';
  champion?: boolean;
}

export const useModelRegistry = (filters?: ModelFilters) => {
  return useQuery({
    queryKey: ['admin', 'models', 'registry', filters],
    queryFn: async () => {
      let query = supabase
        .from('model_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.model_type) {
        query = query.eq('model_type', filters.model_type);
      }
      if (filters?.champion !== undefined) {
        query = query.eq('is_champion', filters.champion);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);
      return data as ModelRegistry[];
    },
  });
};

export const useModelPerformance = (modelId?: string) => {
  return useQuery({
    queryKey: ['admin', 'models', 'performance', modelId],
    queryFn: async () => {
      let query = supabase
        .from('model_performance')
        .select(`
          *,
          model:model_registry!model_id(*)
        `)
        .order('calculated_at', { ascending: false });

      if (modelId) {
        query = query.eq('model_id', modelId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw handleApiError(error);
      return data as (ModelPerformance & { model?: any })[];
    },
  });
};

export const useModelComparison = () => {
  return useQuery({
    queryKey: ['admin', 'models', 'comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_performance')
        .select(`
          *,
          model:model_registry!model_id(*)
        `)
        .eq('is_current', true);

      if (error) throw handleApiError(error);
      return data as (ModelPerformance & { model?: any })[];
    },
  });
};

export const useCurrentChampionModel = () => {
  return useQuery({
    queryKey: ['admin', 'models', 'champion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_registry')
        .select('*')
        .eq('is_champion', true)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw handleApiError(error);
      return data as ModelRegistry | null;
    },
  });
};

export const usePromoteModelToChampion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string) => {
      // Get current champion
      const { data: currentChampion, error: championError } = await supabase
        .from('model_registry')
        .select('id')
        .eq('is_champion', true)
        .single();

      if (championError && championError.code !== 'PGRST116') {
        throw handleApiError(championError);
      }

      // Demote current champion if exists
      if (currentChampion) {
        const { error: demoteError } = await supabase
          .from('model_registry')
          .update({ is_champion: false })
          .eq('id', currentChampion.id);

        if (demoteError) throw handleApiError(demoteError);
      }

      // Promote new champion
      const { data: newChampion, error: promoteError } = await supabase
        .from('model_registry')
        .update({ 
          is_champion: true,
          promoted_at: new Date().toISOString()
        })
        .eq('id', modelId)
        .select()
        .single();

      if (promoteError) throw handleApiError(promoteError);

      // Call edge function for model promotion
      const { error: edgeError } = await supabase.functions.invoke('admin-model-promote', {
        body: { model_id: modelId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return newChampion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['model_performance'] });
    },
  });
};

export const useDemoteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string) => {
      const { data, error } = await supabase
        .from('model_registry')
        .update({ 
          is_champion: false,
          status: 'inactive'
        })
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Call edge function for model demotion
      const { error: edgeError } = await supabase.functions.invoke('admin-model-demote', {
        body: { model_id: modelId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['model_performance'] });
    },
  });
};

export const useActivateModelShadowMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string) => {
      const { data, error } = await supabase
        .from('model_registry')
        .update({ 
          status: 'shadow',
          deployed_at: new Date().toISOString()
        })
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Call edge function to enable shadow mode
      const { error: edgeError } = await supabase.functions.invoke('admin-model-shadow', {
        body: { model_id: modelId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
    },
  });
};

export const useABTestMetrics = () => {
  return useQuery({
    queryKey: ['admin', 'models', 'ab_test_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ab_test_metrics');

      if (error) throw handleApiError(error);
      return data as {
        champion_accuracy: number;
        challenger_accuracy: number;
        winner: string;
        significance: number;
        sample_size: number;
      };
    },
  });
};

export const useModelDecayStatus = () => {
  return useQuery({
    queryKey: ['admin', 'models', 'decay_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_registry')
        .select(`
          *,
          latest_performance:model_performance!model_id(*, limit=1)
        `)
        .eq('is_champion', true)
        .or('auto_retrain=true,status.eq.active');

      if (error) throw handleApiError(error);
      return data as (ModelRegistry & { latest_performance?: any })[];
    },
  });
};

export const useAutoRetrainConfig = (modelId: string) => {
  return useQuery({
    queryKey: ['admin', 'models', 'retrain_config', modelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_registry')
        .select('auto_retrain, retrain_threshold, retrain_schedule')
        .eq('id', modelId)
        .single();

      if (error) throw handleApiError(error);
      return data as {
        auto_retrain: boolean;
        retrain_threshold: number;
        retrain_schedule: string;
      };
    },
  });
};

export const useUpdateAutoRetrainConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      modelId, 
      autoRetrain, 
      threshold, 
      schedule 
    }: { 
      modelId: string; 
      autoRetrain: boolean; 
      threshold: number; 
      schedule: string;
    }) => {
      const { data, error } = await supabase
        .from('model_registry')
        .update({ 
          auto_retrain: autoRetrain,
          retrain_threshold: threshold,
          retrain_schedule: schedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      return data;
    },
    onSuccess: (_, { modelId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models', 'retrain_config', modelId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'models', 'decay_status'] });
    },
  });
};