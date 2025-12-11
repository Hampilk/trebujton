import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, UserCircle } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

const Profile = () => {
  const { user, profile, role, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      bio: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          avatar_url: data.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>
        {role && (
          <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
            {role}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium">{profile?.full_name || 'No name set'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role:</span>
                <span className="capitalize">{role || 'user'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={profile?.is_active ? 'default' : 'secondary'}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your profile information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  {...register('full_name')}
                  disabled={isLoading}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us about yourself..."
                  {...register('bio')}
                  disabled={isLoading}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  {...register('avatar_url')}
                  disabled={isLoading}
                />
                {errors.avatar_url && (
                  <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this page
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
