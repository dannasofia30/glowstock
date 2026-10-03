import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserManagement } from './UserManagement';

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession: mockGetSession } }),
}));

const firstUser = {
  id: '00000000-0000-4000-8000-000000000001',
  nombre_completo: 'Admin Glowstock',
  email: 'admin@glowstock.com',
  rol: 'admin' as const,
  activo: true,
  created_at: '2026-10-03T10:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('UserManagement', () => {
  beforeEach(() => {
    mockGetSession.mockReset().mockResolvedValue({
      data: { session: { access_token: 'test-access-token' } },
      error: null,
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('carga usuarios pasando el token de sesión al endpoint administrativo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([firstUser]));
    render(<UserManagement />);

    expect(await screen.findByText('admin@glowstock.com')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/users',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }),
      }),
    );
  });

  it('crea una cuenta desde el formulario de administración', async () => {
    const createdUser = {
      ...firstUser,
      id: '00000000-0000-4000-8000-000000000002',
      nombre_completo: 'Ana Pérez',
      email: 'ana@example.com',
      rol: 'usuario' as const,
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([firstUser]))
      .mockResolvedValueOnce(jsonResponse(createdUser, 201));
    render(<UserManagement />);

    await screen.findByText('admin@glowstock.com');
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Ana Pérez' },
    });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), {
      target: { value: 'a-long-secure-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('ana@example.com')).toBeTruthy();
    expect((await screen.findByRole('status')).textContent).toContain('Cuenta creada');
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/admin/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nombre_completo: 'Ana Pérez',
          email: 'ana@example.com',
          password: 'a-long-secure-password',
          rol: 'usuario',
        }),
      }),
    );
  });
});
