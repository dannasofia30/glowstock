import type { PoolClient } from 'pg';
import { SUCURSALES } from '@/lib/config/intertiendas';
import { conTransaccion } from '@/lib/db/conexion';
import { esCritico } from '@/lib/reglas/alertas';
import type { Sucursal } from '@/lib/reglas/costos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { decidirSolicitud, validarSolicitud } from '@/lib/reglas/solicitud';
import { ajustar, bloquearStock } from './existencias';
import { registrarOrden } from './ordenes';
import type { DatosSolicitud, ResultadoSolicitud } from './tipos';

function esSucursal(valor: string): valor is Sucursal {
  return (SUCURSALES as readonly string[]).includes(valor);
}

async function obtenerProductoActivo(
  tx: PoolClient,
  datos: DatosSolicitud,
): Promise<{ id: string; codigo: string }> {
  const codigo = datos.codigo?.trim();
  const productoId = datos.productoId?.trim();

  if (productoId) {
    const resultado = await tx.query<{ id: string; codigo: string }>(
      `SELECT id, codigo FROM productos WHERE id = $1 AND activo = true`,
      [productoId],
    );
    const fila = resultado.rows[0];
    if (!fila) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
    return fila;
  }

  if (codigo) {
    const resultado = await tx.query<{ id: string; codigo: string }>(
      `SELECT id, codigo FROM productos WHERE codigo = $1 AND activo = true`,
      [codigo],
    );
    const fila = resultado.rows[0];
    if (!fila) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
    return fila;
  }

  throw new ErrorDeNegocio('DATOS_INVALIDOS');
}

function stockTotal(stock: Record<Sucursal, number>): number {
  return SUCURSALES.reduce((suma, sucursal) => suma + stock[sucursal], 0);
}

export async function procesarSolicitud(d: DatosSolicitud): Promise<ResultadoSolicitud> {
  validarSolicitud(d.cantidad);
  if (!esSucursal(d.solicitante)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return conTransaccion(async (tx) => {
    const producto = await obtenerProductoActivo(tx, d);
    const stock = await bloquearStock(tx, producto.id);
    const decision = decidirSolicitud(stock, d.solicitante, d.cantidad);
    const nuevoStock: Record<Sucursal, number> = { ...stock };

    switch (decision.accion) {
      case 'venta_local': {
        await ajustar(tx, producto.id, d.solicitante, -d.cantidad);
        nuevoStock[d.solicitante] = stock[d.solicitante] - d.cantidad;
        await tx.query(
          `INSERT INTO transacciones
            (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
           VALUES ($1, 'venta_local', NULL, $2, $3, 0, NULL)`,
          [producto.id, d.solicitante, d.cantidad],
        );
        break;
      }
      case 'transferencia': {
        const origen = decision.origen;
        if (!origen) {
          throw new ErrorDeNegocio('ERROR_INTERNO');
        }
        await ajustar(tx, producto.id, origen, -d.cantidad);
        await ajustar(tx, producto.id, d.solicitante, d.cantidad);
        nuevoStock[origen] = stock[origen] - d.cantidad;
        nuevoStock[d.solicitante] = stock[d.solicitante] + d.cantidad;
        await tx.query(
          `INSERT INTO transacciones
            (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
           VALUES ($1, 'transferencia', $2, $3, $4, $5, NULL)`,
          [
            producto.id,
            origen,
            d.solicitante,
            d.cantidad,
            decision.costoTotal ?? 0,
          ],
        );
        break;
      }
      case 'orden_proveedor': {
        const lote = decision.loteProveedor ?? 50;
        const motivo = decision.motivo ?? 'agotamiento_total';
        await registrarOrden(tx, producto.id, d.solicitante, lote, motivo);
        await tx.query(
          `INSERT INTO transacciones
            (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
           VALUES ($1, 'orden_proveedor', NULL, $2, $3, 0, $4)`,
          [producto.id, d.solicitante, lote, motivo],
        );
        break;
      }
      default:
        throw new ErrorDeNegocio('ERROR_INTERNO');
    }

    const total = stockTotal(nuevoStock);
    const critico = esCritico(total);

    return { decision, stock: nuevoStock, critico };
  });
}
