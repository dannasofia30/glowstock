import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buscarUsuarioPorEmail,
  contarSolicitudesRecuperacion,
  crearTokenRecuperacion,
  invalidarTokensRecuperacion,
} from '@/lib/supabase/restablecimientos';
import { enviarCorreo } from '@/lib/correo';
import { POST } from './route';

vi.mock('@/lib/supabase/restablecimientos', () => ({
  buscarUsuarioPorEmail: vi.fn(),
  contarSolicitudesRecuperacion: vi.fn(),
  crearTokenRecuperacion: vi.fn(),
  invalidarTokensRecuperacion: vi.fn(),
}));

vi.mock('@/lib/correo', () => ({
  enviarCorreo: vi.fn(),
}));

vi.mock('@/lib/tokenRecuperacion', () => ({
  generarToken: () => 'a'.repeat(64),
  calcularHashToken: () => 'hash-seguro',
}));

describe('POST /api/auth/recuperar', () => {
  beforeEach(() => {
    vi.mocked(buscarUsuarioPorEmail).mockReset().mockResolvedValue({
      data: { id: 'usuario-1', email: 'danna.osorio02@usa.edu.co' },
      error: null,
    } as never);
    vi.mocked(contarSolicitudesRecuperacion).mockReset().mockResolvedValue({
      data: 0,
      error: null,
    } as never);
    vi.mocked(crearTokenRecuperacion).mockReset().mockResolvedValue({
      data: 'restablecimiento-1',
      error: null,
    } as never);
    vi.mocked(invalidarTokensRecuperacion).mockReset().mockResolvedValue({
      data: undefined,
      error: null,
    } as never);
    vi.mocked(enviarCorreo).mockReset().mockResolvedValue({ ok: true, id: 'correo-1' });
    vi.stubEnv('APP_URL', 'http://localhost:3000');
  });

  it('valida el correo antes de consultar la cuenta', async () => {
    const respuesta = await POST(
      new Request('http://localhost/api/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify({ email: 'correo-invalido' }),
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(buscarUsuarioPorEmail).not.toHaveBeenCalled();
  });

  it('responde igual para correos no registrados sin enviar mensajes', async () => {
    vi.mocked(buscarUsuarioPorEmail).mockResolvedValue({
      data: null,
      error: null,
    } as never);

    const respuesta = await POST(
      new Request('http://localhost/api/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify({ email: 'desconocido@ejemplo.com' }),
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      message:
        'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    });
    expect(enviarCorreo).not.toHaveBeenCalled();
  });

  it('limita las solicitudes y entrega enlaces al correo registrado', async () => {
    const solicitud = () =>
      POST(
        new Request('http://localhost/api/auth/recuperar', {
          method: 'POST',
          body: JSON.stringify({ email: 'DANNA.OSORIO02@USA.EDU.CO' }),
        }),
      );

    await solicitud();
    expect(buscarUsuarioPorEmail).toHaveBeenCalledWith('danna.osorio02@usa.edu.co');
    expect(crearTokenRecuperacion).toHaveBeenCalledWith('usuario-1', 'hash-seguro');
    expect(enviarCorreo).toHaveBeenCalledWith(
      expect.objectContaining({
        para: 'danna.osorio02@usa.edu.co',
        asunto: 'Restablecer contraseña',
        html: expect.stringContaining(
          'http://localhost:3000/restablecer-contrasena?token=' + 'a'.repeat(64),
        ),
      }),
    );

    vi.mocked(contarSolicitudesRecuperacion).mockResolvedValue({
      data: 3,
      error: null,
    } as never);
    vi.mocked(enviarCorreo).mockClear();

    await solicitud();
    expect(enviarCorreo).not.toHaveBeenCalled();
  });
});
