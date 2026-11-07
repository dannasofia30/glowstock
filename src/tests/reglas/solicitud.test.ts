import { esperarCodigo } from './ayudas';
import { decidirSolicitud, validarSolicitud, cumpleSeguridad } from '../../lib/reglas/solicitud';

describe('Reglas de solicitud', () => {
  it('T-06: una sucursal puede ceder y conservar 17 unidades', () => {
    expect(cumpleSeguridad(20, 3)).toBe(true);
  });

  it('T-07: una sucursal puede ceder y conservar exactamente 5 unidades', () => {
    expect(cumpleSeguridad(8, 3)).toBe(true);
  });

  it('T-08: descarta una sucursal que quedaría con 4 unidades', () => {
    expect(cumpleSeguridad(7, 3)).toBe(false);
  });

  it('T-09: rechaza una cantidad cero', () => {
    esperarCodigo(() => validarSolicitud(0), 'DATOS_INVALIDOS');
  });

  it('T-10: rechaza una cantidad negativa', () => {
    esperarCodigo(() => validarSolicitud(-2), 'DATOS_INVALIDOS');
  });

  it('T-11: rechaza una cantidad fraccionaria', () => {
    esperarCodigo(() => validarSolicitud(2.5), 'DATOS_INVALIDOS');
  });

  it('T-12: prioriza la venta local si hay stock suficiente', () => {
    expect(decidirSolicitud({ A: 10, B: 3, C: 3 }, 'A', 4)).toEqual({ accion: 'venta_local' });
  });

  it('T-13: transfiere desde B y descarta C por stock de seguridad', () => {
    expect(decidirSolicitud({ A: 2, B: 20, C: 6 }, 'A', 3)).toEqual({
      accion: 'transferencia',
      origen: 'B',
      costoUnitario: 2000,
      costoTotal: 6000,
    });
  });

  it('T-14: elige B por ser la transferencia menos costosa hacia A', () => {
    expect(decidirSolicitud({ A: 1, B: 20, C: 20 }, 'A', 3)).toEqual({
      accion: 'transferencia',
      origen: 'B',
      costoUnitario: 2000,
      costoTotal: 6000,
    });
  });

  it('T-15: elige B por ser la transferencia menos costosa hacia C', () => {
    expect(decidirSolicitud({ A: 20, B: 20, C: 1 }, 'C', 3)).toEqual({
      accion: 'transferencia',
      origen: 'B',
      costoUnitario: 1500,
      costoTotal: 4500,
    });
  });

  it('T-16: elige C por ser la transferencia menos costosa hacia B', () => {
    expect(decidirSolicitud({ A: 20, B: 1, C: 20 }, 'B', 3)).toEqual({
      accion: 'transferencia',
      origen: 'C',
      costoUnitario: 1500,
      costoTotal: 4500,
    });
  });

  it('T-17: ordena al proveedor cuando ninguna candidata conserva la seguridad', () => {
    expect(decidirSolicitud({ A: 1, B: 6, C: 6 }, 'A', 3)).toEqual({
      accion: 'orden_proveedor',
      motivo: 'sin_candidata_viable',
      loteProveedor: 50,
    });
  });

  it('T-18: distingue el agotamiento total de la red', () => {
    expect(decidirSolicitud({ A: 1, B: 0, C: 0 }, 'A', 5)).toEqual({
      accion: 'orden_proveedor',
      motivo: 'agotamiento_total',
      loteProveedor: 50,
    });
  });

  it('T-19: ordena al proveedor cuando toda la red está agotada', () => {
    expect(decidirSolicitud({ A: 0, B: 0, C: 0 }, 'A', 1)).toEqual({
      accion: 'orden_proveedor',
      motivo: 'agotamiento_total',
      loteProveedor: 50,
    });
  });
});