import { z } from 'zod';
import { enviarCorreo } from '@/lib/correo';
import { plantillaRecuperacion } from '@/lib/plantillasCorreo';
import { calcularHashToken, generarToken } from '@/lib/tokenRecuperacion';
import { obtenerUrlBase } from '@/lib/urlBase';
import {
  buscarUsuarioPorEmail,
  contarSolicitudesRecuperacion,
  crearTokenRecuperacion,
  invalidarTokensRecuperacion,
} from '@/lib/supabase/restablecimientos';

const solicitudSchema = z.object({
  email: z.string().trim().email().max(254),
});

const mensajeGenerico =
  'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.';

export async function POST(request: Request): Promise<Response> {
  const cuerpo: unknown = await request.json().catch(() => null);
  const solicitud = solicitudSchema.safeParse(cuerpo);

  if (!solicitud.success) {
    return Response.json({ error: 'Ingresa una dirección de correo válida.' }, { status: 400 });
  }

  try {
    const { data: usuario, error: errorUsuario } = await buscarUsuarioPorEmail(
      solicitud.data.email.toLowerCase(),
    );
    if (errorUsuario || !usuario) {
      return Response.json({ message: mensajeGenerico });
    }

    const { data: solicitudes, error: errorLimite } = await contarSolicitudesRecuperacion(
      usuario.id,
    );
    if (errorLimite || solicitudes === null || solicitudes >= 3) {
      return Response.json({ message: mensajeGenerico });
    }

    const { error: errorInvalidacion } = await invalidarTokensRecuperacion(usuario.id);
    if (errorInvalidacion) {
      return Response.json({ message: mensajeGenerico });
    }

    const token = generarToken();
    const { error: errorCreacion } = await crearTokenRecuperacion(
      usuario.id,
      calcularHashToken(token),
    );
    if (errorCreacion) {
      return Response.json({ message: mensajeGenerico });
    }

    const enlace = `${obtenerUrlBase()}/restablecer-contrasena?token=${token}`;
    const resultado = await enviarCorreo({
      para: usuario.email,
      asunto: 'Restablecer contraseña',
      html: plantillaRecuperacion(enlace),
    });

    if (!resultado.ok) {
      await invalidarTokensRecuperacion(usuario.id);
    }
  } catch {
    return Response.json({ message: mensajeGenerico });
  }

  return Response.json({ message: mensajeGenerico });
}
