import { costoRuta, costoTotal } from '../../lib/reglas/costos';

describe('Costos logísticos', () => {
  it('T-01: calcula el costo A-B', () => {
    expect(costoRuta('A', 'B')).toBe(2000);
  });

  it('T-02: el costo B-A es simétrico', () => {
    expect(costoRuta('B', 'A')).toBe(2000);
  });

  it('T-03: calcula el costo B-C', () => {
    expect(costoRuta('B', 'C')).toBe(1500);
  });

  it('T-04: calcula el costo A-C', () => {
    expect(costoRuta('A', 'C')).toBe(3500);
  });

  it('T-05: multiplica el costo unitario por la cantidad', () => {
    expect(costoTotal('B', 'A', 3)).toBe(6000);
  });
});