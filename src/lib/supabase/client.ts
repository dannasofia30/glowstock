import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_GLOWSTOCK_GLOWSTOCKSUPABASE_URL ??
  process.env.GLOWSTOCK_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_GLOWSTOCK_GLOWSTOCKSUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_GLOWSTOCK_GLOWSTOCKSUPABASE_ANON_KEY ??
  process.env.GLOWSTOCK_SUPABASE_PUBLISHABLE_KEY ??
  process.env.GLOWSTOCK_SUPABASE_ANON_KEY;
let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Falta configurar la URL o la clave publicable de Supabase.');
  }

  browserClient ??= createClient<Database>(supabaseUrl, supabaseKey);
  return browserClient;
}
