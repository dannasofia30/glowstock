import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordForm } from './ChangePasswordForm';

const {
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockGetSession,
  mockGetUser,
  mockSignIn,
  mockSubscribe,
} = vi.hoisted(() => ({
    mockResetPasswordForEmail: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockGetSession: vi.fn(),
    mockGetUser: vi.fn(),
    mockSignIn: vi.fn(),
    mockSubscribe: vi.fn(),
  }));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      getUser: mockGetUser,
      signInWithPassword: mockSignIn,
      onAuthStateChange: mockSubscribe,
    },
  }),
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    mockResetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
    mockUpdateUser.mockReset().mockResolvedValue({ error: null });
    mockGetSession
      .mockReset()
      .mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null });
    mockGetUser
      .mockReset()
      .mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@glowstock.com' } }, error: null });
    mockSignIn.mockReset().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSubscribe.mockReset().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('solicita un enlace de recuperación para el correo indicado', async () => {
    render(
      <ChangePasswordForm
        mode="request"
        initialEmail=" USER@GLOWSTOCK.COM "
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect((await screen.findByRole('status')).textContent).toContain(
      'Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.',
    );
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@glowstock.com',
      { redirectTo: `${window.location.origin}/reset-password` },
    );
  });

  it('valida que las contraseñas coincidan antes de actualizar', async () => {
    render(<ChangePasswordForm mode="update" />);

    await screen.findByLabelText('Nueva contraseña');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'different-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('actualiza la contraseña usando la sesión del enlace de recuperación', async () => {
    render(<ChangePasswordForm mode="update" />);

    await screen.findByLabelText('Nueva contraseña');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password' });
    });
    expect(await screen.findByText('Tu contraseña se cambió correctamente.')).toBeTruthy();
  });

  it('rechaza enlaces caducados o sin sesión de recuperación', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    render(<ChangePasswordForm mode="update" />);

    expect(
      await screen.findByText(
        'El enlace no es válido o ha caducado. Solicita uno nuevo desde el inicio de sesión.',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Nueva contraseña')).toBeNull();
  });

  it('cambia la contraseña desde ajustes tras confirmar la contraseña actual', async () => {
    render(<ChangePasswordForm mode="change" />);

    await screen.findByLabelText('Contraseña actual');
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'current-password' },
    });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'user@glowstock.com',
        password: 'current-password',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password' });
    });
    expect(await screen.findByText('Tu contraseña se cambió correctamente.')).toBeTruthy();
  });

  it('no cambia la contraseña si la contraseña actual no es válida', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    render(<ChangePasswordForm mode="change" />);

    await screen.findByLabelText('Contraseña actual');
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('La contraseña actual es incorrecta.')).toBeTruthy();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});