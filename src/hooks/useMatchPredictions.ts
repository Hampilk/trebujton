import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Types
interface MatchPrediction {
  id: string;
  predicted_outcome: string;
  confidence_score: number;
  btts_prediction?: boolean;
  actual_outcome?: string;
  was_correct?: boolean;
  created_at: string;
}

// Query keys
export const matchPredictionQueryKeys = {
  all: ['match-predictions'] as const,
  byMatchId: (matchId: string) => [...matchPredictionQueryKeys.all, 'byMatchId', matchId] as const,
};

// Fetch functions
const fetchMatchPrediction = async (matchId: string): Promise<MatchPrediction | null> => {
  const { data, error } = await supabase
    .from('predictions')
    .select('id, predicted_outcome, confidence_score, btts_prediction, actual_outcome, was_correct, created_at')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }

  return data;
};

const createMatchAnalysis = async (matchId: string): Promise<MatchPrediction> => {
  const { data, error } = await supabase.functions.invoke('analyze-match', {
    body: { matchId }
  });

  if (error) throw error;

  // Return the newly created prediction
  return fetchMatchPrediction(matchId);
};

// Hooks
export function useMatchPrediction(matchId: string) {
  return useQuery({
    queryKey: matchPredictionQueryKeys.byMatchId(matchId),
    queryFn: () => fetchMatchPrediction(matchId),
    enabled: !!matchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });
}

export function useCreateMatchAnalysis() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createMatchAnalysis,
    onSuccess: (data, matchId) => {
      // Invalidate and refetch the specific match prediction
      queryClient.invalidateQueries({ 
        queryKey: matchPredictionQueryKeys.byMatchId(matchId) 
      });
      
      // Invalidate dashboard as well
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => {
      console.error('Error creating match analysis:', error);
    },
  });
}