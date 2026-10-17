import 'server-only';

import { createSupabaseAdminClient } from './admin';

export async function buscarUsuarioPorEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.from('usuarios').select('id, email').eq('email', email).maybeSingle();
}

export async function contarSolicitudesRecuperacion(usuarioId: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.rpc('contar_solicitudes_recuperacion', { p_usuario_id: usuarioId });
}

export async function invalidarTokensRecuperacion(usuarioId: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.rpc('invalidar_tokens_recuperacion', { p_usuario_id: usuarioId });
}

export async function crearTokenRecuperacion(usuarioId: string, tokenHash: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.rpc('crear_token_recuperacion', {
    p_usuario_id: usuarioId,
    p_token_hash: tokenHash,
  });
}

export async function consumirTokenRecuperacion(tokenHash: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.rpc('consumir_token_recuperacion', { p_token_hash: tokenHash });
}

export async function actualizarContrasena(usuarioId: string, contrasena: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.auth.admin.updateUserById(usuarioId, { password: contrasena });
}
