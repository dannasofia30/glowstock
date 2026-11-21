import { SUCURSALES, STOCK_SEGURIDAD } from '@/lib/config/intertiendas';
import { conTransaccion } from '@/lib/db/conexion';
import type { Sucursal } from '@/lib/reglas/costos';
import { costoTotal } from '@/lib/reglas/costos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { ajustar, bloquearStock, type StockPorSucursal } from './existencias';

function esSucursal(valor: string): valor is Sucursal {
  return (SUCURSALES as readonly string[]).includes(valor);
}

function validarCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export async function transferenciaManual(d: {
  codigo: string;
  origen: Sucursal;
  destino: Sucursal;
  cantidad: number;
}): Promise<{ stock: StockPorSucursal; costoLogistico: number }> {
  const codigo = d.codigo.trim();
  if (!codigo || !esSucursal(d.origen) || !esSucursal(d.destino) || d.origen === d.destino) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  validarCantidad(d.cantidad);

  return conTransaccion(async (tx) => {
    const producto = await tx.query<{ id: string }>(
      `SELECT id FROM productos WHERE codigo = $1 AND activo = true`,
      [codigo],
    );
    const filaProducto = producto.rows[0];
    if (!filaProducto) {
      throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
    }

    const stock = await bloquearStock(tx, filaProducto.id);
    if (stock[d.origen] - d.cantidad < STOCK_SEGURIDAD) {
      throw new ErrorDeNegocio('ROMPE_SEGURIDAD');
    }

    await ajustar(tx, filaProducto.id, d.origen, -d.cantidad);
    await ajustar(tx, filaProducto.id, d.destino, d.cantidad);

    const costoLogistico = costoTotal(d.origen, d.destino, d.cantidad);
    await tx.query(
      `INSERT INTO transacciones
        (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
       VALUES ($1, 'transferencia', $2, $3, $4, $5, NULL)`,
      [filaProducto.id, d.origen, d.destino, d.cantidad, costoLogistico],
    );

    const nuevoStock: StockPorSucursal = {
      ...stock,
      [d.origen]: stock[d.origen] - d.cantidad,
      [d.destino]: stock[d.destino] + d.cantidad,
    };

    return { stock: nuevoStock, costoLogistico };
  });
}
