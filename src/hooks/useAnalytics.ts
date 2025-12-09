import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  AccuracyData,
  TrendData,
  ConfidenceDistribution,
  PatternAnalysis,
  StreakSummary,
  TransitionMatrix,
  AnalyticsResponse,
} from '@/types/analytics';

// Mock data for development
const mockAccuracyData: AccuracyData[] = [
  { date: '2024-01-01', accuracy: 65, total_predictions: 100, correct_predictions: 65, model_version: 'v1.0' },
  { date: '2024-01-08', accuracy: 68, total_predictions: 110, correct_predictions: 75, model_version: 'v1.0' },
  { date: '2024-01-15', accuracy: 71, total_predictions: 105, correct_predictions: 75, model_version: 'v1.0' },
  { date: '2024-01-22', accuracy: 74, total_predictions: 120, correct_predictions: 89, model_version: 'v1.1' },
  { date: '2024-01-29', accuracy: 76, total_predictions: 115, correct_predictions: 87, model_version: 'v1.1' },
  { date: '2024-02-05', accuracy: 78, total_predictions: 130, correct_predictions: 101, model_version: 'v1.1' },
  { date: '2024-02-12', accuracy: 80, total_predictions: 125, correct_predictions: 100, model_version: 'v1.2' },
  { date: '2024-02-19', accuracy: 82, total_predictions: 140, correct_predictions: 115, model_version: 'v1.2' },
];

const mockTrendData: TrendData[] = [
  { date: '2024-01-01', trend_value: 65, moving_average: 65, confidence_level: 0.72 },
  { date: '2024-01-08', trend_value: 68, moving_average: 66.5, confidence_level: 0.74 },
  { date: '2024-01-15', trend_value: 71, moving_average: 68, confidence_level: 0.76 },
  { date: '2024-01-22', trend_value: 74, moving_average: 70, confidence_level: 0.78 },
  { date: '2024-01-29', trend_value: 76, moving_average: 72, confidence_level: 0.80 },
  { date: '2024-02-05', trend_value: 78, moving_average: 74.5, confidence_level: 0.82 },
  { date: '2024-02-12', trend_value: 80, moving_average: 76.5, confidence_level: 0.84 },
  { date: '2024-02-19', trend_value: 82, moving_average: 78.5, confidence_level: 0.85 },
];

const mockConfidenceDistribution: ConfidenceDistribution[] = [
  { confidence_range: '0-10%', count: 5, percentage: 2, avg_accuracy: 0.35 },
  { confidence_range: '10-20%', count: 8, percentage: 3, avg_accuracy: 0.42 },
  { confidence_range: '20-30%', count: 15, percentage: 6, avg_accuracy: 0.51 },
  { confidence_range: '30-40%', count: 25, percentage: 10, avg_accuracy: 0.58 },
  { confidence_range: '40-50%', count: 45, percentage: 18, avg_accuracy: 0.65 },
  { confidence_range: '50-60%', count: 65, percentage: 26, avg_accuracy: 0.72 },
  { confidence_range: '60-70%', count: 55, percentage: 22, avg_accuracy: 0.78 },
  { confidence_range: '70-80%', count: 25, percentage: 10, avg_accuracy: 0.84 },
  { confidence_range: '80-90%', count: 8, percentage: 3, avg_accuracy: 0.89 },
];

const mockPatternData: PatternAnalysis[] = [
  { pattern_id: 'p1', pattern_name: 'Home Strong', frequency: 142, accuracy: 0.82, confidence: 0.85, home_advantage: 0.15, away_disadvantage: -0.12 },
  { pattern_id: 'p2', pattern_name: 'Balanced Play', frequency: 98, accuracy: 0.71, confidence: 0.72, home_advantage: 0.05, away_disadvantage: 0.02 },
  { pattern_id: 'p3', pattern_name: 'Away Upset', frequency: 65, accuracy: 0.68, confidence: 0.65, home_advantage: -0.10, away_disadvantage: 0.12 },
  { pattern_id: 'p4', pattern_name: 'Draw Tendency', frequency: 128, accuracy: 0.75, confidence: 0.78, home_advantage: 0.02, away_disadvantage: 0.01 },
  { pattern_id: 'p5', pattern_name: 'High Scoring', frequency: 87, accuracy: 0.73, confidence: 0.70, home_advantage: 0.08, away_disadvantage: -0.05 },
];

const mockStreakData: StreakSummary = {
  home_wins: 156,
  home_streak_count: 8,
  draws: 98,
  draw_streak_count: 5,
  away_wins: 112,
  away_streak_count: 6,
  clean_sheets: 87,
  btts_count: 134,
  over_25_count: 156,
};

const mockTransitionMatrix: TransitionMatrix = {
  home_to_home: 0.45,
  home_to_draw: 0.35,
  home_to_away: 0.20,
  draw_to_home: 0.30,
  draw_to_draw: 0.40,
  draw_to_away: 0.30,
  away_to_home: 0.25,
  away_to_draw: 0.30,
  away_to_away: 0.45,
  total_transitions: 366,
  confidence_scores: {
    home_to_home: 0.82,
    home_to_draw: 0.75,
    home_to_away: 0.68,
    draw_to_home: 0.70,
    draw_to_draw: 0.78,
    draw_to_away: 0.72,
    away_to_home: 0.69,
    away_to_draw: 0.71,
    away_to_away: 0.80,
  },
};

export const useAccuracy = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'accuracy'],
    queryFn: async () => {
      try {
        // For now, return mock data
        // In production, this would call: supabase.functions.invoke('get_accuracy_metrics')
        return mockAccuracyData as AccuracyData[];
      } catch (error) {
        console.error('Error fetching accuracy data:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000, // Default 5 minutes
  });
};

export const useTrends = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => {
      try {
        return mockTrendData as TrendData[];
      } catch (error) {
        console.error('Error fetching trend data:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000,
  });
};

export const useConfidence = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'confidence'],
    queryFn: async () => {
      try {
        return mockConfidenceDistribution as ConfidenceDistribution[];
      } catch (error) {
        console.error('Error fetching confidence data:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000,
  });
};

export const usePatterns = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'patterns'],
    queryFn: async () => {
      try {
        return mockPatternData as PatternAnalysis[];
      } catch (error) {
        console.error('Error fetching pattern data:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000,
  });
};

export const useStreak = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'streak'],
    queryFn: async () => {
      try {
        return mockStreakData as StreakSummary;
      } catch (error) {
        console.error('Error fetching streak data:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000,
  });
};

export const useTransition = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['analytics', 'transition'],
    queryFn: async () => {
      try {
        return mockTransitionMatrix as TransitionMatrix;
      } catch (error) {
        console.error('Error fetching transition matrix:', error);
        throw error;
      }
    },
    refetchInterval: refetchInterval || 5 * 60 * 1000,
  });
};
