import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type Database from "@/integrations/supabase/types";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export type UserRole = "user" | "analyst" | "admin" | "viewer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;

  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Fetch profile
  // ----------------------------------------------------
  const loadProfile = async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from("user_profiles" as any)
      .select("*")
      .eq("id", userId)
      .single();

    // If profile does not exist → create one
    if (error?.code === "PGRST116") {
      const newProfile = {
        id: userId,
        email: email || "",
        full_name: null,
        avatar_url: null,
        bio: null,
        is_active: true,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("user_profiles" as any)
        .insert([newProfile] as any);

      if (!insertError) {
        setProfile(newProfile);
        return newProfile;
      }

      console.error("Profile creation failed:", insertError);
      return null;
    }

    if (error) {
      console.error("Profile load error:", error);
      return null;
    }

    if (!data) return null;

    setProfile(data);
    return data;
  };

  // ----------------------------------------------------
  // Fetch role
  // ----------------------------------------------------
  const loadUserRole = async (userId: string) => {
    const _res = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", userId)
      .single();

    const data = _res.data as any
    const error = _res.error

    // Missing role → create default "viewer"
    if (error?.code === "PGRST116") {
      await supabase.from("user_roles" as any).insert([
        {
          user_id: userId,
          role: "viewer",
        },
      ] as any);
      setRole("viewer");
      return "viewer";
    }

    if (error) {
      console.error("Role load error:", error);
      return null;
    }

    if (!data) return null;

    setRole(data.role as UserRole);
    return data.role as UserRole;
  };

  // ----------------------------------------------------
  // Load session, user, profile, role
  // ----------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id, session.user.email);
        await loadUserRole(session.user.id);
      }

      setLoading(false);
    };

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id, session.user.email);
        await loadUserRole(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ----------------------------------------------------
  // Auth functions
  // ----------------------------------------------------
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? null } },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
