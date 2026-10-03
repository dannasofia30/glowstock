import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const pushMock = vi.fn();
const {
  mockSignIn,
  mockSignOut,
  mockSingle,
  mockEq,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  mockSingle: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
    },
    from: mockFrom,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset().mockResolvedValue({ error: null });
    mockSingle.mockReset().mockResolvedValue({ data: { activo: true }, error: null });
    mockEq.mockReset().mockReturnValue({ single: mockSingle });
    mockSelect.mockReset().mockReturnValue({ eq: mockEq });
    mockFrom.mockReset().mockReturnValue({ select: mockSelect });
  });

  it('muestra errores de validación cuando el formulario es inválido', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Ingresa un correo válido.')).toBeTruthy();
    expect(await screen.findByText('La contraseña es obligatoria.')).toBeTruthy();
  });

  it('autentica con Supabase y requiere un perfil activo', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: ' USER@GLOWSTOCK.COM ' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'correct-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'user@glowstock.com',
      password: 'correct-password',
    });
    expect(mockFrom).toHaveBeenCalledWith('usuarios');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('muestra error cuando Supabase rechaza las credenciales', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@glowstock.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'incorrect-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('cierra sesión si el usuario no tiene perfil activo', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { activo: false }, error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@glowstock.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(
      await screen.findByText('No se encontró un perfil activo para esta cuenta.'),
    ).toBeTruthy();
    expect(mockSignOut).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
