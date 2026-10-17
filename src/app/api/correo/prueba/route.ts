import { z } from 'zod';
import { enviarCorreo } from '@/lib/correo';

const solicitudCorreoSchema = z.object({
  para: z.string().trim().email(),
});

export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'No encontrado.' }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = solicitudCorreoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Ingresa una dirección de correo válida.' }, { status: 400 });
  }

  const resultado = await enviarCorreo({
    para: parsed.data.para,
    asunto: 'Prueba de correo',
    html: '<p>¡El envío de correo de Glowstock funciona correctamente!</p>',
  });

  if (!resultado.ok) {
    return Response.json({ error: resultado.error }, { status: 500 });
  }

  return Response.json({ id: resultado.id }, { status: 200 });
}
