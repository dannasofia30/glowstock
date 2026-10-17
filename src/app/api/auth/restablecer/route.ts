import { z } from 'zod';
import { calcularHashToken } from '@/lib/tokenRecuperacion';
import {
  actualizarContrasena,
  consumirTokenRecuperacion,
  invalidarTokensRecuperacion,
} from '@/lib/supabase/restablecimientos';

const restablecimientoSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i),
    contrasena: z.string().min(8).max(128),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    path: ['confirmacion'],
  });

export async function POST(request: Request): Promise<Response> {
  const cuerpo: unknown = await request.json().catch(() => null);
  const solicitud = restablecimientoSchema.safeParse(cuerpo);

  if (!solicitud.success) {
    return Response.json(
      {
        error:
          'Revisa el enlace y usa una contraseña de al menos 8 caracteres que coincida con la confirmación.',
      },
      { status: 400 },
    );
  }

  try {
    const { data: tokens, error: errorToken } = await consumirTokenRecuperacion(
      calcularHashToken(solicitud.data.token),
    );
    const token = tokens?.[0];
    if (errorToken || !token) {
      return Response.json(
        { error: 'El enlace no es válido o ya venció.' },
        { status: 400 },
      );
    }

    const { error: errorInvalidacion } = await invalidarTokensRecuperacion(token.usuario_id);
    if (errorInvalidacion) {
      return Response.json(
        { error: 'No se pudo completar el cambio. Solicita un enlace nuevo.' },
        { status: 500 },
      );
    }

    const { error: errorActualizacion } = await actualizarContrasena(
      token.usuario_id,
      solicitud.data.contrasena,
    );
    if (errorActualizacion) {
      return Response.json(
        { error: 'No se pudo actualizar la contraseña. Solicita un enlace nuevo.' },
        { status: 500 },
      );
    }
  } catch {
    return Response.json(
      { error: 'No se pudo completar el cambio. Solicita un enlace nuevo.' },
      { status: 500 },
    );
  }

  return Response.json({ message: 'La contraseña se actualizó correctamente.' });
}
