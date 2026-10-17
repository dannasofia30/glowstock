import 'server-only';

import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

type Correo = {
  para: string;
  asunto: string;
  html: string;
};

type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function obtenerClaveResend(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  return getToken('resend/cobalt-candle', { subject: { type: 'app' } });
}

export async function enviarCorreo({ para, asunto, html }: Correo): Promise<ResultadoEnvio> {
  try {
    const clave = await obtenerClaveResend();
    const resend = new Resend(clave);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: para,
      subject: asunto,
      html,
    });

    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? 'El servicio de correo no pudo confirmar el envío.',
      };
    }

    return { ok: true, id: data.id };
  } catch (cause) {
    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : 'No fue posible conectar con el servicio de correo.',
    };
  }
}
