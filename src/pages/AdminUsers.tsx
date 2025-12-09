import { useState } from 'react';
import { useAdminUsers, useUpdateUserActiveStatus, useUpdateUserRole } from '@/hooks/useAdminUsers';
import { GlassCard } from '@/components/Admin/GlassCard';
import { useAuth } from '@/contexts/AuthContext';

export const AdminUsers = () => {
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const { data: users, isLoading, error } = useAdminUsers(filters);
  const updateActiveStatus = useUpdateUserActiveStatus();
  const updateRole = useUpdateUserRole();
  const { user: currentUser } = useAuth();

  if (isLoading) return <div className="text-white p-8">Loading users...</div>;
  if (error) return <div className="text-red-400 p-8">Error loading users: {error.message}</div>;

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRole.mutate({ userId, role: newRole });
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
        
        <GlassCard>
          <div className="p-6">
            <div className="mb-6 flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 flex-1 min-w-64"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <select
                className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="premium">Premium</option>
              </select>
              <select
                className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Last Login</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.user_id} className="border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-30 transition-colors">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-slate-400">ID: {user.user_id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        {user.auth_user?.email || 'N/A'}
                      </td>
                      <td className="p-3">
                        <select
                          className="px-2 py-1 bg-slate-700 text-white rounded border border-slate-600"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                          disabled={user.user_id === currentUser?.id || updateRole.isPending}
                        >
                          <option value="user">User</option>
                          <option value="premium">Premium</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-600 bg-opacity-30 text-green-400' : 'bg-red-600 bg-opacity-30 text-red-400'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-400">
                        {user.auth_user?.last_sign_in_at ? new Date(user.auth_user.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateActiveStatus.mutate({ 
                              userId: user.user_id, 
                              isActive: !user.is_active 
                            })}
                            className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                              user.is_active 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            disabled={user.user_id === currentUser?.id || updateActiveStatus.isPending}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users?.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No users found matching your criteria
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};