import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enviarCorreo } from '@/lib/correo';
import { POST } from './route';

vi.mock('@/lib/correo', () => ({
  enviarCorreo: vi.fn(),
}));

describe('POST /api/correo/prueba', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.mocked(enviarCorreo).mockReset();
  });

  it('oculta el endpoint en producción', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const response = await POST(
      new Request('http://localhost/api/correo/prueba', { method: 'POST' }),
    );

    expect(response.status).toBe(404);
    expect(enviarCorreo).not.toHaveBeenCalled();
  });

  it('rechaza direcciones inválidas', async () => {
    const response = await POST(
      new Request('http://localhost/api/correo/prueba', {
        method: 'POST',
        body: JSON.stringify({ para: 'correo-invalido' }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Ingresa una dirección de correo válida.',
    });
    expect(enviarCorreo).not.toHaveBeenCalled();
  });

  it('envía el correo de prueba al destinatario validado', async () => {
    vi.mocked(enviarCorreo).mockResolvedValue({ ok: true, id: 'email-123' });

    const response = await POST(
      new Request('http://localhost/api/correo/prueba', {
        method: 'POST',
        body: JSON.stringify({ para: 'danna.osorio02@usa.edu.co' }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'email-123' });
    expect(enviarCorreo).toHaveBeenCalledWith({
      para: 'danna.osorio02@usa.edu.co',
      asunto: 'Prueba de correo',
      html: '<p>¡El envío de correo de Glowstock funciona correctamente!</p>',
    });
  });

  it('responde con el error de Resend cuando falla el envío', async () => {
    vi.mocked(enviarCorreo).mockResolvedValue({
      ok: false,
      error: 'No se pudo enviar el mensaje.',
    });

    const response = await POST(
      new Request('http://localhost/api/correo/prueba', {
        method: 'POST',
        body: JSON.stringify({ para: 'danna.osorio02@usa.edu.co' }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'No se pudo enviar el mensaje.' });
  });
});
