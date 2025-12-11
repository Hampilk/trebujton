import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Types
interface Prediction {
  id: string;
  predicted_outcome: string;
  confidence_score: number;
  actual_outcome?: string;
  was_correct: boolean | null;
  match: {
    home_team: string;
    away_team: string;
    match_date: string;
    league: string;
  };
}

// Query keys
export const predictionsQueryKeys = {
  all: ['predictions'] as const,
  list: () => [...predictionsQueryKeys.all, 'list'] as const,
  byId: (id: string) => [...predictionsQueryKeys.all, 'byId', id] as const,
};

// Fetch functions
const fetchPredictions = async (): Promise<Prediction[]> => {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      id,
      predicted_outcome,
      confidence_score,
      actual_outcome,
      was_correct,
      match:matches(
        match_date,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        league:leagues(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.id,
    predicted_outcome: item.predicted_outcome,
    confidence_score: item.confidence_score,
    actual_outcome: item.actual_outcome,
    was_correct: item.was_correct,
    match: {
      home_team: item.match?.home_team?.name || 'Unknown Home',
      away_team: item.match?.away_team?.name || 'Unknown Away',
      match_date: item.match?.match_date || new Date().toISOString(),
      league: item.match?.league?.name || 'Unknown League',
    },
  }));
};

const createPrediction = async (matchId: string): Promise<Prediction> => {
  const { data, error } = await supabase.functions.invoke('create-prediction', {
    body: { matchId }
  });

  if (error) throw error;
  
  // Return the newly created prediction
  return fetchPredictions().then(predictions => 
    predictions.find(p => p.id === data.predictionId) || 
    Promise.reject(new Error('Prediction not found after creation'))
  );
};

// Hooks
export function usePredictions() {
  return useQuery({
    queryKey: predictionsQueryKeys.list(),
    queryFn: fetchPredictions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: (data) => {
      // Invalidate and refetch predictions
      queryClient.invalidateQueries({ queryKey: predictionsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Navigate to the new prediction
      navigate(`/predictions`);
    },
    onError: (error: Error) => {
      console.error('Error creating prediction:', error);
    },
  });
}

// Optimistic update hook for list refreshes
export function useRefreshPredictions() {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: predictionsQueryKeys.list() });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return refresh;
}