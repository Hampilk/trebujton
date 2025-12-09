import { Database } from '@/lib/database.types';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Prediction = Database['public']['Tables']['predictions']['Row'];
export type BlockedPredictionForReview = Database['public']['Views']['blocked_predictions_for_review']['Row'];
export type PredictionReviewLog = Database['public']['Tables']['prediction_review_log']['Row'];

export type ModelPerformance = Database['public']['Tables']['model_performance']['Row'];
export type ModelRegistry = Database['public']['Tables']['model_registry']['Row'];
export type ModelVersion = 'champion' | 'challenger' | 'shadow';

export type ScheduledJob = Database['public']['Tables']['scheduled_jobs']['Row'];
export type JobLog = Database['public']['Tables']['job_logs']['Row'];
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SystemHealth = Database['public']['Tables']['system_health']['Row'];
export type SystemLog = Database['public']['Tables']['system_logs']['Row'];
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row'];

export type EnvironmentVariable = Database['public']['Tables']['environment_variables']['Row'];
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row'];

export interface AdminFilters {
  role?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total?: number;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}

export interface ConfidenceBreakdown {
  champion: number;
  challenger?: number;
  ensemble: number;
  model_versions: Record<string, number>;
}

export interface ModelComparisonMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  predictions_count: number;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}