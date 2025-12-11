import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
interface DashboardPrediction {
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

interface DashboardPattern {
  name: string;
  accuracy: number;
  total: number;
}

interface DashboardStats {
  totalPredictions: number;
  accuracy: number;
  topPattern: string;
  winningStreak: number;
}

interface DashboardData {
  predictions: DashboardPrediction[];
  patterns: DashboardPattern[];
  stats: DashboardStats;
}

// Query keys
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardQueryKeys.all, 'data'] as const,
};

// Fetch functions
const fetchDashboardData = async (): Promise<DashboardData> => {
  const [
    { data: predictionsData, error: predictionsError },
    { data: allPredictions, error: allPredictionsError },
    { data: patternAccuracy, error: patternError }
  ] = await Promise.all([
    // Fetch recent predictions with match details
    supabase
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
      .limit(10),
    
    // Fetch all predictions for stats calculation
    supabase
      .from('predictions')
      .select('was_correct'),
    
    // Fetch pattern performance data
    supabase
      .from('pattern_accuracy')
      .select(`
        total_predictions,
        correct_predictions,
        accuracy_rate,
        template:pattern_templates(name)
      `)
      .order('accuracy_rate', { ascending: false })
  ]);

  if (predictionsError) throw predictionsError;
  if (allPredictionsError) throw allPredictionsError;
  if (patternError) throw patternError;

  // Format predictions data
  const predictions: DashboardPrediction[] = (predictionsData || []).map((p) => ({
    id: p.id,
    predicted_outcome: p.predicted_outcome,
    confidence_score: p.confidence_score,
    actual_outcome: p.actual_outcome,
    was_correct: p.was_correct,
    match: {
      home_team: p.match?.home_team?.name || 'Unknown',
      away_team: p.match?.away_team?.name || 'Unknown',
      match_date: p.match?.match_date || new Date().toISOString(),
      league: p.match?.league?.name || 'Unknown',
    },
  }));

  // Calculate statistics
  const evaluatedPredictions = (allPredictions || []).filter((p) => p.was_correct !== null);
  const correctPredictions = evaluatedPredictions.filter((p) => p.was_correct).length;
  const totalEvaluated = evaluatedPredictions.length;
  const accuracy = totalEvaluated > 0 ? Math.round((correctPredictions / totalEvaluated) * 100) : 0;

  // Calculate winning streak
  let currentStreak = 0;
  let maxStreak = 0;
  const sortedPredictions = [...evaluatedPredictions].reverse();
  
  for (const pred of sortedPredictions) {
    if (pred.was_correct) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Format pattern data
  const patterns: DashboardPattern[] = (patternAccuracy || []).map((p) => ({
    name: p.template?.name || 'Unknown',
    accuracy: p.accuracy_rate || 0,
    total: p.total_predictions || 0,
  }));

  const topPattern = patterns[0]?.name || 'N/A';

  const stats: DashboardStats = {
    totalPredictions: allPredictions?.length || 0,
    accuracy,
    topPattern,
    winningStreak: maxStreak,
  };

  return {
    predictions,
    patterns,
    stats,
  };
};

// Hook
export function useDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.data(),
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });
}