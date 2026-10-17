import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarContrasena,
  consumirTokenRecuperacion,
  invalidarTokensRecuperacion,
} from '@/lib/supabase/restablecimientos';
import { POST } from './route';

vi.mock('@/lib/supabase/restablecimientos', () => ({
  actualizarContrasena: vi.fn(),
  consumirTokenRecuperacion: vi.fn(),
  invalidarTokensRecuperacion: vi.fn(),
}));

vi.mock('@/lib/tokenRecuperacion', () => ({
  calcularHashToken: () => 'hash-seguro',
}));

describe('POST /api/auth/restablecer', () => {
  beforeEach(() => {
    vi.mocked(consumirTokenRecuperacion).mockReset().mockResolvedValue({
      data: [{ id: 'restablecimiento-1', usuario_id: 'usuario-1' }],
      error: null,
    } as never);
    vi.mocked(invalidarTokensRecuperacion).mockReset().mockResolvedValue({
      data: undefined,
      error: null,
    } as never);
    vi.mocked(actualizarContrasena).mockReset().mockResolvedValue({
      data: { user: { id: 'usuario-1' } },
      error: null,
    } as never);
  });

  it('rechaza tokens inválidos y contraseñas que no coinciden', async () => {
    const respuesta = await POST(
      new Request('http://localhost/api/auth/restablecer', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalido',
          contrasena: 'contraseña-segura',
          confirmacion: 'otra-contraseña',
        }),
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(consumirTokenRecuperacion).not.toHaveBeenCalled();
  });

  it('rechaza enlaces vencidos o ya usados', async () => {
    vi.mocked(consumirTokenRecuperacion).mockResolvedValue({
      data: [],
      error: null,
    } as never);

    const respuesta = await POST(
      new Request('http://localhost/api/auth/restablecer', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          contrasena: 'contraseña-segura',
          confirmacion: 'contraseña-segura',
        }),
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: 'El enlace no es válido o ya venció.',
    });
    expect(actualizarContrasena).not.toHaveBeenCalled();
  });

  it('consume el token e actualiza la contraseña en Supabase Auth', async () => {
    const respuesta = await POST(
      new Request('http://localhost/api/auth/restablecer', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          contrasena: 'contraseña-segura',
          confirmacion: 'contraseña-segura',
        }),
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(consumirTokenRecuperacion).toHaveBeenCalledWith('hash-seguro');
    expect(invalidarTokensRecuperacion).toHaveBeenCalledWith('usuario-1');
    expect(actualizarContrasena).toHaveBeenCalledWith(
      'usuario-1',
      'contraseña-segura',
    );
  });
});
