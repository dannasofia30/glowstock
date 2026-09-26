import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('muestra el panel principal del inventario', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /inventario/i })).toBeTruthy();
    expect(screen.getByText(/resumen general/i)).toBeTruthy();
  });
});
