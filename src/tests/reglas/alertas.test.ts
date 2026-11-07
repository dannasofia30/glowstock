import { esCritico } from '../../lib/reglas/alertas';

describe('Punto de reorden global', () => {
  it('T-21: marca crítico el stock igual al umbral', () => {
    expect(esCritico(10)).toBe(true);
  });

  it('T-22: no marca crítico el stock por encima del umbral', () => {
    expect(esCritico(11)).toBe(false);
  });

  it('T-23: marca crítico el stock cero', () => {
    expect(esCritico(0)).toBe(true);
  });
});