import { ErrorDeNegocio } from './errores';

export interface DatosProducto {
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockMinimo: number;
}

export function validarProducto(datos: DatosProducto): void {
  const textosValidos = [datos.codigo, datos.nombre, datos.categoria].every(
    (valor) => valor.trim().length > 0,
  );

  if (
    !textosValidos ||
    !Number.isInteger(datos.precio) ||
    datos.precio <= 0 ||
    !Number.isInteger(datos.stockMinimo) ||
    datos.stockMinimo < 0
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}