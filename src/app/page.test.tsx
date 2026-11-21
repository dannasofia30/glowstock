import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const redirectMock = vi.fn();
const obtenerSesionMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock('@/lib/auth/sesion', () => ({
  obtenerSesion: () => obtenerSesionMock(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    obtenerSesionMock.mockReset();
  });

  it('redirige a /tiendas cuando hay sesión', async () => {
    obtenerSesionMock.mockResolvedValue({ email: 'user@glowstock.com' });

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith('/tiendas');
  });

  it('redirige a /login cuando no hay sesión', async () => {
    obtenerSesionMock.mockResolvedValue(null);

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
