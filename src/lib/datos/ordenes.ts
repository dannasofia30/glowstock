import type { PoolClient } from 'pg';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import type { Sucursal } from '@/lib/reglas/costos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { ajustar } from './existencias';
import type { OrdenProveedor } from './tipos';

interface FilaOrdenBd {
  id: number;
  producto_id: string;
  producto_codigo?: string;
  producto_nombre?: string;
  sucursal: string;
  cantidad: number;
  motivo: string;
  estado: string;
  fecha: string;
  recibida_at: string | null;
}

export async function registrarOrden(
  tx: PoolClient,
  productoId: string,
  sucursal: Sucursal,
  cantidad: number,
  motivo: string,
): Promise<void> {
  await tx.query(
    `INSERT INTO ordenes_proveedor (producto_id, sucursal, cantidad, motivo, estado)
     VALUES ($1, $2, $3, $4, 'pendiente')`,
    [productoId, sucursal, cantidad, motivo],
  );
}

export async function listarOrdenes(f?: { estado?: string }): Promise<OrdenProveedor[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (f?.estado) {
    valores.push(f.estado);
    condiciones.push(`o.estado = $${valores.length}`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar<FilaOrdenBd>(
    `SELECT o.id,
            o.producto_id,
            p.codigo AS producto_codigo,
            p.nombre AS producto_nombre,
            o.sucursal,
            o.cantidad,
            o.motivo,
            o.estado,
            o.fecha,
            o.recibida_at
       FROM ordenes_proveedor o
       JOIN productos p ON p.id = o.producto_id
       ${where}
      ORDER BY o.fecha DESC, o.id DESC`,
    valores,
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    productoId: fila.producto_id,
    ...(fila.producto_codigo ? { productoCodigo: fila.producto_codigo } : {}),
    ...(fila.producto_nombre ? { productoNombre: fila.producto_nombre } : {}),
    sucursal: fila.sucursal as Sucursal,
    cantidad: Number(fila.cantidad),
    motivo: fila.motivo,
    estado: fila.estado as 'pendiente' | 'recibida',
    fecha: fila.fecha,
    recibidaAt: fila.recibida_at,
  }));
}

export async function recibirOrden(id: number): Promise<OrdenProveedor> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return conTransaccion(async (tx) => {
    const resultado = await tx.query<{
      id: number;
      producto_id: string;
      sucursal: string;
      cantidad: number;
      motivo: string;
      estado: string;
    }>(
      `SELECT id, producto_id, sucursal, cantidad, motivo, estado
         FROM ordenes_proveedor
        WHERE id = $1
        FOR UPDATE`,
      [id],
    );

    const orden = resultado.rows[0];
    if (!orden) {
      throw new ErrorDeNegocio('ORDEN_NO_ENCONTRADA');
    }
    if (orden.estado !== 'pendiente') {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La orden ya fue recibida o no está pendiente.');
    }

    await ajustar(tx, orden.producto_id, orden.sucursal as Sucursal, Number(orden.cantidad));

    await tx.query(
      `UPDATE ordenes_proveedor
          SET estado = 'recibida', recibida_at = NOW()
        WHERE id = $1`,
      [id],
    );

    await tx.query(
      `INSERT INTO transacciones
        (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
       VALUES ($1, 'entrada', NULL, $2, $3, 0, 'recepcion_orden')`,
      [orden.producto_id, orden.sucursal, Number(orden.cantidad)],
    );

    const filas = await tx.query<FilaOrdenBd>(
      `SELECT o.id,
              o.producto_id,
              p.codigo AS producto_codigo,
              p.nombre AS producto_nombre,
              o.sucursal,
              o.cantidad,
              o.motivo,
              o.estado,
              o.fecha,
              o.recibida_at
         FROM ordenes_proveedor o
         JOIN productos p ON p.id = o.producto_id
        WHERE o.id = $1`,
      [id],
    );

    const fila = filas.rows[0];
    if (!fila) {
      throw new ErrorDeNegocio('ORDEN_NO_ENCONTRADA');
    }

    return {
      id: Number(fila.id),
      productoId: fila.producto_id,
      ...(fila.producto_codigo ? { productoCodigo: fila.producto_codigo } : {}),
      ...(fila.producto_nombre ? { productoNombre: fila.producto_nombre } : {}),
      sucursal: fila.sucursal as Sucursal,
      cantidad: Number(fila.cantidad),
      motivo: fila.motivo,
      estado: fila.estado as 'pendiente' | 'recibida',
      fecha: fila.fecha,
      recibidaAt: fila.recibida_at,
    };
  });
}
