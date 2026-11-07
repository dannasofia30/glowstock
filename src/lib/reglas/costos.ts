import { COSTOS, SUCURSALES } from '../config/intertiendas';
import { ErrorDeNegocio } from './errores';

export type Sucursal = (typeof SUCURSALES)[number];

export function costoRuta(origen: Sucursal, destino: Sucursal): number {
  if (origen === destino) return 0;

  const costo = COSTOS[`${origen}-${destino}`];
  if (costo === undefined) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return costo;
}

export function costoTotal(origen: Sucursal, destino: Sucursal, cantidad: number): number {
  return costoRuta(origen, destino) * cantidad;
}