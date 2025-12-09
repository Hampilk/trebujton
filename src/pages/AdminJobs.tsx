import { useState } from 'react';
import { useScheduledJobs, useRecentJobLogs, useEnableJob, useDisableJob, useTriggerJob } from '@/hooks/useJobs';
import { GlassCard } from '@/components/Admin/GlassCard';

export const AdminJobs = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: jobs, isLoading, error } = useScheduledJobs({ status: statusFilter || undefined });
  const { data: recentLogs } = useRecentJobLogs(10);
  const enableJob = useEnableJob();
  const disableJob = useDisableJob();
  const triggerJob = useTriggerJob();

  if (isLoading) return <div className="text-white p-8">Loading jobs...</div>;
  if (error) return <div className="text-red-400 p-8">Error: {error.message}</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 bg-opacity-30 text-green-400';
      case 'running': return 'bg-blue-600 bg-opacity-30 text-blue-400';
      case 'failed': return 'bg-red-600 bg-opacity-30 text-red-400';
      case 'cancelled': return 'bg-gray-600 bg-opacity-30 text-gray-400';
      default: return 'bg-yellow-600 bg-opacity-30 text-yellow-400';
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Job Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Active Jobs</h3>
              <div className="text-2xl font-bold text-green-400">
                {jobs?.filter(j => j.is_enabled).length || 0}
              </div>
              <div className="text-slate-400">Scheduled</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Recent Activity</h3>
              <div className="text-2xl font-bold text-blue-400">
                {recentLogs?.filter(log => log.status === 'completed').length || 0}
              </div>
              <div className="text-slate-400">Completed today</div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Scheduled Jobs</h2>
                <select
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="space-y-3">
                {jobs?.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-800 bg-opacity-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{job.job_name}</h4>
                        <p className="text-sm text-slate-400">Next: {new Date(job.next_run_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.is_enabled ? 'bg-green-600 bg-opacity-30 text-green-400' : 'bg-gray-600 bg-opacity-30 text-gray-400'
                        }`}>
                          {job.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      {job.is_enabled ? (
                        <button
                          onClick={() => disableJob.mutate(job.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                          disabled={disableJob.isPending}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => enableJob.mutate(job.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                          disabled={enableJob.isPending}
                        >
                          Enable
                        </button>
                      )}
                      <button
                        onClick={() => triggerJob.mutate({ jobId: job.id, jobName: job.job_name })}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        disabled={triggerJob.isPending}
                      >
                        Trigger Now
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      Schedule: {job.schedule}
                    </div>
                  </div>
                ))}
              </div>

              {jobs?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No scheduled jobs found
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Logs</h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs?.map((log) => (
                  <div key={log.id} className="p-2 bg-slate-800 bg-opacity-30 rounded text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-slate-400">{log.job?.job_name}</span>
                      <span className={`px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown time'}
                    </div>
                    {log.output && (
                      <div className="text-slate-400 mt-1 text-xs truncate">{log.output}</div>
                    )}
                  </div>
                ))}
              </div>

              {recentLogs?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No recent job logs
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};