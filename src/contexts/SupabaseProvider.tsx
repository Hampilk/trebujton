import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type Database from "@/integrations/supabase/types";

interface SupabaseContextType {
  client: SupabaseClient<Database> | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used inside <SupabaseProvider>");
  return ctx;
}

// Initialize Supabase client with graceful fallback
function initializeSupabaseClient(): SupabaseClient<Database> | null {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error(
      "Supabase environment variables not configured. Auth features will be disabled.",
      { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_PUBLISHABLE_KEY }
    );
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof localStorage !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const supabaseClient = initializeSupabaseClient();
        setClient(supabaseClient);

        if (supabaseClient) {
          // Get initial session
          const { data, error: sessionError } = await supabaseClient.auth.getSession();
          if (sessionError) {
            console.error("Session retrieval error:", sessionError);
            setError(sessionError.message);
          } else {
            setSession(data.session);
          }

          // Listen for auth changes
          const {
            data: { subscription },
          } = supabaseClient.auth.onAuthStateChange(async (_, newSession) => {
            setSession(newSession);
          });

          return () => subscription.unsubscribe();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize Supabase";
        console.error("Supabase initialization error:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initClient();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, []);

  return (
    <SupabaseContext.Provider
      value={{
        client,
        session,
        loading,
        error,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}
