import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SystemHealth, SystemLog, PerformanceMetric } from '@/types/admin';
import { handleApiError } from '@/lib/apiErrors';

export interface MonitoringFilters {
  alertType?: 'error' | 'warning' | 'info';
  component?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export const useSystemHealth = (filters?: MonitoringFilters) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'health', filters],
    queryFn: async () => {
      let query = supabase
        .from('system_health')
        .select('*')
        .order('checked_at', { ascending: false });

      if (filters?.component) {
        query = query.eq('component', filters.component);
      }
      if (filters?.alertType) {
        query = query.eq('alert_type', filters.alertType);
      }

      // Apply time range filter
      const timeRange = filters?.timeRange || '24h';
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);
      
      query = query.gte('checked_at', cutoffTime.toISOString());

      const { data, error } = await query.limit(100);

      if (error) throw handleApiError(error);
      return data as SystemHealth[];
    },
  });
};

export const useSystemLogs = (filters?: MonitoringFilters, limit = 200) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'logs', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.component) {
        query = query.eq('component', filters.component);
      }
      if (filters?.alertType) {
        query = query.eq('log_level', filters.alertType);
      }

      // Apply time range filter
      const timeRange = filters?.timeRange || '24h';
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);
      
      query = query.gte('created_at', cutoffTime.toISOString());

      const { data, error } = await query.limit(limit);

      if (error) throw handleApiError(error);
      return data as SystemLog[];
    },
  });
};

export const usePerformanceMetrics = (filters?: MonitoringFilters) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'performance', filters],
    queryFn: async () => {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (filters?.component) {
        query = query.eq('component', filters.component);
      }

      // Apply time range filter
      const timeRange = filters?.timeRange || '24h';
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);
      
      query = query.gte('recorded_at', cutoffTime.toISOString());

      const { data, error } = await query.limit(500);

      if (error) throw handleApiError(error);
      return data as PerformanceMetric[];
    },
  });
};

export const useDowntimeAlerts = () => {
  const { data: systemHealth } = useSystemHealth({ alertType: 'error' });

  return useQuery({
    queryKey: ['admin', 'monitoring', 'downtime_alerts'],
    queryFn: () => {
      const alerts = (systemHealth || [])
        .filter(health => health.status === 'down' || health.alert_type === 'error')
        .map(health => ({
          id: health.id,
          component: health.component,
          message: health.message || `${health.component} is down`,
          timestamp: health.checked_at,
          type: health.alert_type as 'error' | 'warning' | 'info',
          resolved: false,
        }));

      return alerts;
    },
    enabled: !!systemHealth,
  });
};

export const useSystemUptime = (component?: string) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'uptime', component],
    queryFn: async () => {
      const timeRange = '24h';
      const hours = 24;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      let query = supabase
        .from('system_health')
        .select('*')
        .gte('checked_at', cutoffTime.toISOString())
        .order('checked_at', { ascending: false });

      if (component) {
        query = query.eq('component', component);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);

      const healthData = data as SystemHealth[];
      
      if (healthData.length === 0) return 0;

      const totalTime = hours * 60 * 60 * 1000; // Convert to milliseconds
      const uptimeTime = healthData
        .filter(h => h.status === 'up')
        .reduce((acc, h) => acc + (h.response_time || 60000), 0); // Assume 1 minute intervals

      return Math.round((uptimeTime / totalTime) * 100);
    },
  });
};

export const useAverageResponseTime = (component?: string, minutes = 60) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'response_time', component, minutes],
    queryFn: async () => {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

      let query = supabase
        .from('system_health')
        .select('response_time')
        .eq('status', 'up')
        .gte('checked_at', cutoffTime.toISOString())
        .order('checked_at', { ascending: false });

      if (component) {
        query = query.eq('component', component);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);

      const responseTimes = (data as SystemHealth[])
        .map(h => h.response_time || 0)
        .filter(rt => rt > 0);

      if (responseTimes.length === 0) return 0;

      return Math.round(responseTimes.reduce((acc, rt) => acc + rt, 0) / responseTimes.length);
    },
  });
};

export const useErrorRate = (component?: string, hours = 24) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'error_rate', component, hours],
    queryFn: async () => {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', cutoffTime.toISOString());

      if (component) {
        query = query.eq('component', component);
      }

      const errorQuery = query.eq('log_level', 'error');
      const warningQuery = query.eq('log_level', 'warning');
      
      const [errorResult, warningResult] = await Promise.all([
        errorQuery,
        warningQuery,
      ]);

      const totalLogs = (errorResult.data?.length || 0) + (warningResult.data?.length || 0);
      const errorLogs = errorResult.data?.length || 0;

      if (totalLogs === 0) return 0;

      return Math.round((errorLogs / totalLogs) * 100);
    },
  });
};

export const useResourceUsage = (component?: string) => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'resources', component],
    queryFn: async () => {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 1); // Last hour

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', cutoffTime.toISOString())
        .order('recorded_at', { ascending: false });

      if (component) {
        query = query.eq('component', component);
      }

      const { data, error } = await query.limit(60); // Last 60 readings

      if (error) throw handleApiError(error);

      const metrics = data as PerformanceMetric[];
      
      if (metrics.length === 0) {
        return {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0,
        };
      }

      const latest = metrics[0];
      return {
        cpu: latest.cpu_usage || 0,
        memory: latest.memory_usage || 0,
        disk: latest.disk_usage || 0,
        network: latest.network_io || 0,
      };
    },
  });
};