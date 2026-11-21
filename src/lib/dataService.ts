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
export { listarTransacciones } from '@/lib/datos/transacciones';
export { listarOrdenes } from '@/lib/datos/ordenes';
export { cerrarPool } from '@/lib/datos/cierre';
