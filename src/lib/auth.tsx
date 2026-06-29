"use client";

// Autenticación de dueños de academia (modo real, Supabase Auth · email+contraseña).
// Cuando Supabase no está configurado, `enabled` es false y el resto de la app
// sigue funcionando en modo local sin login.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseEnabled } from "./supabase";

interface AuthValue {
  enabled: boolean;
  ready: boolean;
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isSupabaseEnabled);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      enabled: isSupabaseEnabled,
      ready,
      user,
      async signUp(email, password) {
        const supabase = getSupabase();
        if (!supabase) return { error: "Supabase no está configurado" };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      async signIn(email, password) {
        const supabase = getSupabase();
        if (!supabase) return { error: "Supabase no está configurado" };
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },
      async signOut() {
        const supabase = getSupabase();
        await supabase?.auth.signOut();
      },
    }),
    [ready, user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
