import { vi } from 'vitest';

vi.mock('../../lib/reglas/costos', () => ({
  costoRuta: () => 1000,
  costoTotal: () => 1000,
}));

import { elegirOrigen } from '../../lib/reglas/solicitud';

describe('Desempate defensivo de origen', () => {
  it('T-20: elige la primera sucursal en orden A, B, C cuando los costos empatan', () => {
    expect(elegirOrigen(['C', 'A'], 'B')).toBe('A');
  });
});