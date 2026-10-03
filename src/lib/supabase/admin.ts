import 'server-only';

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from './database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.GLOWSTOCK_SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Falta configurar el acceso administrativo de Supabase.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

type AdminAccess =
  | { client: SupabaseClient; user: User }
  | { response: Response };

export async function requireAdmin(request: Request): Promise<AdminAccess> {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return { response: Response.json({ error: 'Sesión requerida.' }, { status: 401 }) };
  }

  if (!supabaseUrl || !publishableKey) {
    return {
      response: Response.json(
        { error: 'La autenticación de Supabase no está configurada.' },
        { status: 500 },
      ),
    };
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return { response: Response.json({ error: 'Sesión inválida.' }, { status: 401 }) };
  }

  const client = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await client
    .from('usuarios')
    .select('rol, activo')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      response: Response.json(
        { error: 'No se pudo validar el perfil administrativo.' },
        { status: 500 },
      ),
    };
  }

  if (profile?.rol !== 'admin' || !profile.activo) {
    return { response: Response.json({ error: 'Permisos insuficientes.' }, { status: 403 }) };
  }

  return { client, user: data.user };
}
