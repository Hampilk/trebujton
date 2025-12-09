/**
 * Analytics Type Definitions
 * Types for prediction analytics and model performance metrics
 */

export interface AccuracyData {
  date: string;
  accuracy: number;
  total_predictions: number;
  correct_predictions: number;
  model_version: string;
}

export interface TrendData {
  date: string;
  trend_value: number;
  moving_average: number;
  confidence_level: number;
}

export interface ConfidenceDistribution {
  confidence_range: string; // e.g., "0-10", "10-20", etc.
  count: number;
  percentage: number;
  avg_accuracy: number;
}

export interface PatternAnalysis {
  pattern_id: string;
  pattern_name: string;
  frequency: number;
  accuracy: number;
  confidence: number;
  home_advantage: number;
  away_disadvantage: number;
}

export interface StreakSummary {
  home_wins: number;
  home_streak_count: number;
  draws: number;
  draw_streak_count: number;
  away_wins: number;
  away_streak_count: number;
  clean_sheets: number;
  btts_count: number;
  over_25_count: number;
}

export interface TransitionData {
  from_state: 'H' | 'D' | 'V';
  to_state: 'H' | 'D' | 'V';
  probability: number;
  count: number;
  confidence: number;
}

export interface TransitionMatrix {
  home_to_home: number;
  home_to_draw: number;
  home_to_away: number;
  draw_to_home: number;
  draw_to_draw: number;
  draw_to_away: number;
  away_to_home: number;
  away_to_draw: number;
  away_to_away: number;
  total_transitions: number;
  confidence_scores: {
    [key: string]: number;
  };
}

export interface AnalyticsResponse<T> {
  data: T;
  timestamp: string;
  status: 'success' | 'error';
  message?: string;
}

export interface ConfidenceBucket {
  min: number;
  max: number;
  label: string;
  count: number;
  accuracy: number;
}

export interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc: number;
  predictions_count: number;
}

export interface ModelComparison {
  models: ModelMetrics[];
  best_model: string;
  average_accuracy: number;
  timestamp: string;
}
