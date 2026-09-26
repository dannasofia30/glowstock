import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductsPage from './page';

describe('ProductsPage', () => {
  it('muestra la gestión de productos con el layout del sistema', () => {
    render(<ProductsPage />);

    expect(screen.getByRole('heading', { name: /productos/i })).toBeTruthy();
    expect(screen.getByText(/inventario total/i)).toBeTruthy();
    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0);
  });
});
