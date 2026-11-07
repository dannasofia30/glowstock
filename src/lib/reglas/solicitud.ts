import { LOTE_PROVEEDOR, STOCK_SEGURIDAD, SUCURSALES } from '../config/intertiendas';
import { costoRuta, costoTotal, type Sucursal } from './costos';
import { ErrorDeNegocio } from './errores';

export type AccionSolicitud = 'venta_local' | 'transferencia' | 'orden_proveedor';

export interface Decision {
  accion: AccionSolicitud;
  origen?: Sucursal;
  costoUnitario?: number;
  costoTotal?: number;
  motivo?: 'agotamiento_total' | 'sin_candidata_viable';
  loteProveedor?: number;
}

export function validarSolicitud(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export function cumpleSeguridad(stockOrigen: number, cantidad: number): boolean {
  return stockOrigen - cantidad >= STOCK_SEGURIDAD;
}

export function elegirOrigen(candidatas: Sucursal[], solicitante: Sucursal): Sucursal {
  if (candidatas.length === 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return [...candidatas].sort((a, b) => {
    const diferenciaCosto = costoRuta(a, solicitante) - costoRuta(b, solicitante);
    return diferenciaCosto || SUCURSALES.indexOf(a) - SUCURSALES.indexOf(b);
  })[0]!;
}

export function decidirSolicitud(
  stock: Record<Sucursal, number>,
  solicitante: Sucursal,
  cantidad: number,
): Decision {
  validarSolicitud(cantidad);

  if (stock[solicitante] >= cantidad) {
    return { accion: 'venta_local' };
  }

  const candidatas = SUCURSALES.filter(
    (sucursal) => sucursal !== solicitante && cumpleSeguridad(stock[sucursal], cantidad),
  );

  if (candidatas.length > 0) {
    const origen = elegirOrigen(candidatas, solicitante);
    const costoUnitario = costoRuta(origen, solicitante);
    return {
      accion: 'transferencia',
      origen,
      costoUnitario,
      costoTotal: costoTotal(origen, solicitante, cantidad),
    };
  }

  const totalRed = stock.A + stock.B + stock.C;
  return {
    accion: 'orden_proveedor',
    motivo: totalRed < cantidad ? 'agotamiento_total' : 'sin_candidata_viable',
    loteProveedor: LOTE_PROVEEDOR,
  };
}