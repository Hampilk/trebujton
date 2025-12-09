import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScheduledJob, JobLog, JobStatus } from '@/types/admin';
import { handleApiError } from '@/lib/apiErrors';

export interface JobFilters {
  status?: JobStatus;
  job_name?: string;
  scheduled_from?: string;
  scheduled_to?: string;
}

export const useScheduledJobs = (filters?: JobFilters) => {
  return useQuery({
    queryKey: ['admin', 'jobs', 'scheduled', filters],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_jobs')
        .select('*')
        .order('next_run_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.job_name) {
        query = query.eq('job_name', filters.job_name);
      }
      if (filters?.scheduled_from) {
        query = query.gte('next_run_at', filters.scheduled_from);
      }
      if (filters?.scheduled_to) {
        query = query.lte('next_run_at', filters.scheduled_to);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);
      return data as ScheduledJob[];
    },
  });
};

export const useJobLogs = (jobId: string, limit = 50) => {
  return useQuery({
    queryKey: ['admin', 'jobs', 'logs', jobId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw handleApiError(error);
      return data as JobLog[];
    },
    enabled: !!jobId,
  });
};

export const useRecentJobLogs = (limit = 20) => {
  return useQuery({
    queryKey: ['admin', 'jobs', 'recent_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_logs')
        .select(`
          *,
          job:scheduled_jobs!job_id(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw handleApiError(error);
      return data as (JobLog & { job?: ScheduledJob })[];
    },
  });
};

export const useEnableJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .update({ 
          is_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Call edge function to enable job
      const { error: edgeError } = await supabase.functions.invoke('admin-job-enable', {
        body: { job_id: jobId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled_jobs'] });
    },
  });
};

export const useDisableJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .update({ 
          is_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Call edge function to disable job
      const { error: edgeError } = await supabase.functions.invoke('admin-job-disable', {
        body: { job_id: jobId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled_jobs'] });
    },
  });
};

export const useTriggerJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, jobName }: { jobId: string; jobName: string }) => {
      const { error: edgeError } = await supabase.functions.invoke('admin-job-trigger', {
        body: { job_id: jobId, job_name: jobName },
      });

      if (edgeError) throw handleApiError(edgeError);

      // Create a manual run entry
      const { data, error } = await supabase
        .from('job_logs')
        .insert({
          job_id: jobId,
          status: 'pending' as JobStatus,
          output: 'Job triggered manually via admin panel',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw handleApiError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job_logs'] });
    },
  });
};

export const useUpdateJobSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      jobId, 
      schedule, 
      retryAttempts 
    }: { 
      jobId: string; 
      schedule: string; 
      retryAttempts?: number;
    }) => {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .update({ 
          schedule,
          retry_attempts: retryAttempts,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw handleApiError(error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled_jobs'] });
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobName,
      schedule,
      config
    }: {
      jobName: string;
      schedule: string;
      config?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .insert({
          job_name: jobName,
          schedule,
          config: config || {},
          is_enabled: false,
          status: 'pending' as JobStatus,
          created_at: new Date().toISOString(),
          next_run_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw handleApiError(error);

      // Call edge function to create the job configuration
      const { error: edgeError } = await supabase.functions.invoke('admin-job-create', {
        body: { job_id: data.id, job_name: jobName, schedule, config },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled_jobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('scheduled_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw handleApiError(error);

      // Call edge function to cleanup job resources
      const { error: edgeError } = await supabase.functions.invoke('admin-job-delete', {
        body: { job_id: jobId },
      });

      if (edgeError) {
        console.error('Edge function call failed:', edgeError);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled_jobs'] });
    },
  });
};