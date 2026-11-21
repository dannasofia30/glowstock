import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const COOKIE_SESION = 'tiendas_access_token';

function obtenerUrlSupabase(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.GLOWSTOCK_SUPABASE_URL;
}

function obtenerClavePublicaSupabase(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.GLOWSTOCK_SUPABASE_PUBLISHABLE_KEY
  );
}

export async function obtenerSesion(): Promise<{ email: string } | null> {
  const almacenCookies = await cookies();
  const token = almacenCookies.get(COOKIE_SESION)?.value;

  if (!token) {
    return null;
  }

  const url = obtenerUrlSupabase();
  const clavePublica = obtenerClavePublicaSupabase();

  if (!url || !clavePublica) {
    return null;
  }

  const cliente = createClient(url, clavePublica, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data, error } = await cliente.auth.getUser(token);

  if (error || !data.user?.email) {
    return null;
  }

  return { email: data.user.email };
}

export async function exigirSesion(): Promise<{ email: string }> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new ErrorDeNegocio('NO_AUTORIZADO');
  }

  return sesion;
}

export const COOKIE_SESION_TIENDAS = COOKIE_SESION;
