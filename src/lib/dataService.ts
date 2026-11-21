export type {
  DatosProducto,
  DatosSolicitud,
  DetalleProducto,
  FilaInventario,
  Informe,
  OrdenProveedor,
  ResultadoSolicitud,
  Transaccion,
} from '@/lib/datos/tipos';

export { crearProducto, listarInventario, obtenerProducto } from '@/lib/datos/productos';
export { registrarEntrada } from '@/lib/datos/existencias';
export { procesarSolicitud } from '@/lib/datos/solicitudes';
export { transferenciaManual } from '@/lib/datos/transferencias';
export { listarTransacciones } from '@/lib/datos/transacciones';
export { listarOrdenes, recibirOrden } from '@/lib/datos/ordenes';
export { obtenerInforme } from '@/lib/datos/informe';
export { cerrarPool } from '@/lib/datos/cierre';
