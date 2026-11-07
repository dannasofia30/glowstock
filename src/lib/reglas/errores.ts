export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'PRODUCTO_DUPLICADO'
  | 'PRODUCTO_NO_ENCONTRADO'
  | 'CANTIDAD_INSUFICIENTE'
  | 'ROMPE_SEGURIDAD'
  | 'ORDEN_NO_ENCONTRADA'
  | 'TIENE_DEPENDENCIAS'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión.',
  PRODUCTO_DUPLICADO: 'Ya existe un producto con ese código.',
  PRODUCTO_NO_ENCONTRADO: 'El producto no existe.',
  CANTIDAD_INSUFICIENTE: 'No hay suficiente stock para esa operación.',
  ROMPE_SEGURIDAD: 'La transferencia dejaría la sucursal origen por debajo del stock de seguridad.',
  ORDEN_NO_ENCONTRADA: 'La orden de proveedor no existe.',
  TIENE_DEPENDENCIAS: 'No se puede eliminar: tiene transacciones asociadas.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  PRODUCTO_DUPLICADO: 409,
  PRODUCTO_NO_ENCONTRADO: 404,
  CANTIDAD_INSUFICIENTE: 409,
  ROMPE_SEGURIDAD: 409,
  ORDEN_NO_ENCONTRADA: 404,
  TIENE_DEPENDENCIAS: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  constructor(
    public codigo: CodigoError,
    mensaje?: string,
    public detalles?: unknown,
  ) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorDeNegocio';
  }
}