import { useState } from 'react';
import { useSystemHealth, useSystemLogs, usePerformanceMetrics, useDowntimeAlerts } from '@/hooks/useMonitoring';
import { GlassCard } from '@/components/Admin/GlassCard';

export const AdminMonitoring = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const { data: systemHealth } = useSystemHealth({ timeRange });
  const { data: systemLogs } = useSystemLogs({ timeRange }, 100);
  const { data: performanceMetrics } = usePerformanceMetrics({ timeRange });
  const { data: downtimeAlerts } = useDowntimeAlerts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">System Monitoring</h1>

        {downtimeAlerts && downtimeAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Active Alerts</h3>
            <div className="space-y-1">
              {downtimeAlerts.map((alert) => (
                <div key={alert.id} className="text-red-300">
                  {alert.message} - {new Date(alert.timestamp).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-4 py-2 rounded font-medium ${
              timeRange === '1h' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Last Hour
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded font-medium ${
              timeRange === '24h' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded font-medium ${
              timeRange === '7d' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Last 7 Days
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>
              <div className="space-y-3">
                {systemHealth?.map((health) => (
                  <div key={health.id} className="p-3 bg-slate-800 bg-opacity-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{health.component}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        health.alert_type === 'error' ? 'bg-red-600 bg-opacity-30 text-red-400' :
                        health.alert_type === 'warning' ? 'bg-yellow-600 bg-opacity-30 text-yellow-400' :
                        'bg-green-600 bg-opacity-30 text-green-400'
                      }`}>
                        {health.alert_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-medium ${getStatusColor(health.status)}`}>
                        {health.status}
                      </span>
                      <span className="text-slate-400">
                        {new Date(health.checked_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {health.message && (
                      <p className="text-slate-400 text-sm mt-2">{health.message}</p>
                    )}
                  </div>
                ))}
              </div>

              {systemHealth?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No health checks in selected time range
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Metrics</h2>
              {performanceMetrics && performanceMetrics.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800 bg-opacity-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {(performanceMetrics.reduce((acc, m) => acc + (m.cpu_usage || 0), 0) / performanceMetrics.length).toFixed(1)}%
                      </div>
                      <div className="text-slate-400 text-sm">CPU Usage</div>
                    </div>
                    <div className="p-3 bg-slate-800 bg-opacity-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {(performanceMetrics.reduce((acc, m) => acc + (m.memory_usage || 0), 0) / performanceMetrics.length).toFixed(1)}%
                      </div>
                      <div className="text-slate-400 text-sm">Memory Usage</div>
                    </div>
                    <div className="p-3 bg-slate-800 bg-opacity-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {(performanceMetrics.reduce((acc, m) => acc + (m.disk_usage || 0), 0) / performanceMetrics.length).toFixed(1)}%
                      </div>
                      <div className="text-slate-400 text-sm">Disk Usage</div>
                    </div>
                    <div className="p-3 bg-slate-800 bg-opacity-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {(performanceMetrics.reduce((acc, m) => acc + (m.network_io || 0), 0) / performanceMetrics.length).toFixed(1)} Mbps
                      </div>
                      <div className="text-slate-400 text-sm">Network I/O</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No performance metrics available
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Logs</h2>
            <div className="max-h-96 overflow-y-auto">
              {systemLogs?.map((log) => (
                <div key={log.id} className="p-2 border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.log_level === 'error' ? 'bg-red-600 bg-opacity-30 text-red-400' :
                        log.log_level === 'warning' ? 'bg-yellow-600 bg-opacity-30 text-yellow-400' :
                        'bg-blue-600 bg-opacity-30 text-blue-400'
                      }`}>
                        {log.log_level}
                      </span>
                      <span className="text-white text-sm font-medium">{log.component}</span>
                    </div>
                    <span className="text-slate-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-300 text-sm ml-0">
                    {log.message}
                  </div>
                  {log.stack_trace && (
                    <details className="mt-2">
                      <summary className="text-slate-500 text-xs cursor-pointer">Stack Trace</summary>
                      <pre className="text-slate-400 text-xs mt-1 overflow-x-auto">
                        {log.stack_trace}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {systemLogs?.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No logs in selected time range
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};