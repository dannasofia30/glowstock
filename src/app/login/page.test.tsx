import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('muestra errores de validación cuando el formulario es inválido', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Ingresa un correo válido.')).toBeTruthy();
    expect(await screen.findByText('La contraseña es obligatoria.')).toBeTruthy();
  });

  it('redirecciona a la página principal cuando las credenciales son correctas', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'demo@glowstock.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'demo1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });
});
