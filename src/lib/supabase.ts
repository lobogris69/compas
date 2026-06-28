import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * true si hay credenciales de Supabase.
 * Cuando es false, Compás funciona en modo local (localStorage) — útil para
 * demos y desarrollo sin montar backend.
 */
export const isSupabaseEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Cliente de Supabase (singleton) o null si no está configurado. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseEnabled) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
