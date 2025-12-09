import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserProfile, AdminAuditLog } from '@/types/admin';
import { PostgrestError } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/apiErrors';

export interface AdminUserFilters {
  role?: string;
  status?: string;
  is_active?: boolean;
  search?: string;
}

export const useAdminUsers = (filters?: AdminUserFilters) => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          auth_user:users!user_id(id, email, created_at, last_sign_in_at)
        `)
        .order('created_at', { ascending: false });

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.ilike('full_name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw handleApiError(error);
      return data as (UserProfile & { auth_user?: any })[];
    },
  });
};

export const useUpdateUserActiveStatus = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .select()
        .single();

      if (profileError) throw handleApiError(profileError);

      // Log the action to admin audit log
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: currentUser?.id,
          action: 'update_user_status',
          target_user_id: userId,
          target_field: 'is_active',
          old_value: (!isActive).toString(),
          new_value: isActive.toString(),
          ip_address: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'unknown'),
        });

      if (auditError) {
        console.error('Failed to log admin action:', auditError);
      }

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw handleApiError(fetchError);

      const oldRole = currentProfile?.role;

      const { data: profile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw handleApiError(updateError);

      // Log the role change to admin audit log
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: currentUser?.id,
          action: 'update_user_role',
          target_user_id: userId,
          target_field: 'role',
          old_value: oldRole || 'null',
          new_value: role,
          ip_address: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'unknown'),
        });

      if (auditError) {
        console.error('Failed to log admin action:', auditError);
      }

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    },
  });
};

export const useAdminAuditLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['admin', 'audit_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_user:users!admin_user_id(id, email, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw handleApiError(error);
      return data as (AdminAuditLog & { admin_user?: any })[];
    },
  });
};