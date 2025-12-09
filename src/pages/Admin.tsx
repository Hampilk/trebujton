import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/Admin/GlassCard';

export const Admin = () => {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and access levels',
      path: '/admin/users',
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Prediction Review',
      description: 'Review and moderate high-risk predictions',
      path: '/admin/predictions',
      icon: '🔍',
      color: 'bg-green-500',
    },
    {
      title: 'Model Management',
      description: 'Manage ML models, versions, and performance',
      path: '/admin/models',
      icon: '🤖',
      color: 'bg-purple-500',
    },
    {
      title: 'Job Management',
      description: 'Schedule and monitor background jobs',
      path: '/admin/jobs',
      icon: '⚙️',
      color: 'bg-orange-500',
    },
    {
      title: 'System Monitoring',
      description: 'Monitor system health and performance',
      path: '/admin/monitoring',
      icon: '📊',
      color: 'bg-red-500',
    },
    {
      title: 'Settings',
      description: 'Configure system settings and thresholds',
      path: '/admin/settings',
      icon: '⚙️',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage and monitor system operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link key={section.path} to={section.path}>
              <GlassCard className="hover:bg-opacity-20 transition-all duration-200 cursor-pointer">
                <div className="p-6">
                  <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                  <p className="text-slate-400">{section.description}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};