import { consultar } from '@/lib/db/conexion';
import type { Sucursal } from '@/lib/reglas/costos';
import type { Transaccion } from './tipos';

interface FilaTransaccionBd {
  id: number;
  producto_id: string;
  producto_codigo: string;
  producto_nombre: string;
  tipo: string;
  sucursal_origen: string | null;
  sucursal_destino: string | null;
  cantidad: number;
  costo_logistico: number;
  motivo: string | null;
  fecha: string;
}

export async function listarTransacciones(f?: {
  productoCodigo?: string;
  tipo?: string;
  sucursal?: Sucursal;
  desde?: string;
  hasta?: string;
}): Promise<Transaccion[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (f?.productoCodigo) {
    valores.push(f.productoCodigo);
    condiciones.push(`p.codigo = $${valores.length}`);
  }
  if (f?.tipo) {
    valores.push(f.tipo);
    condiciones.push(`t.tipo = $${valores.length}`);
  }
  if (f?.sucursal) {
    valores.push(f.sucursal);
    condiciones.push(
      `(t.sucursal_origen = $${valores.length} OR t.sucursal_destino = $${valores.length})`,
    );
  }
  if (f?.desde) {
    valores.push(f.desde);
    condiciones.push(`t.fecha >= $${valores.length}::timestamptz`);
  }
  if (f?.hasta) {
    valores.push(f.hasta);
    condiciones.push(`t.fecha <= $${valores.length}::timestamptz`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar<FilaTransaccionBd>(
    `SELECT t.id,
            t.producto_id,
            p.codigo AS producto_codigo,
            p.nombre AS producto_nombre,
            t.tipo,
            t.sucursal_origen,
            t.sucursal_destino,
            t.cantidad,
            t.costo_logistico,
            t.motivo,
            t.fecha
       FROM transacciones t
       JOIN productos p ON p.id = t.producto_id
       ${where}
      ORDER BY t.fecha DESC, t.id DESC`,
    valores,
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    productoId: fila.producto_id,
    productoCodigo: fila.producto_codigo,
    productoNombre: fila.producto_nombre,
    tipo: fila.tipo as Transaccion['tipo'],
    sucursalOrigen: (fila.sucursal_origen as Sucursal | null) ?? null,
    sucursalDestino: (fila.sucursal_destino as Sucursal | null) ?? null,
    cantidad: Number(fila.cantidad),
    costoLogistico: Number(fila.costo_logistico),
    motivo: fila.motivo,
    fecha: fila.fecha,
  }));
}
