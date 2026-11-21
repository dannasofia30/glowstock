import type { PoolClient } from 'pg';
import { SUCURSALES } from '@/lib/config/intertiendas';
import { conTransaccion } from '@/lib/db/conexion';
import type { Sucursal } from '@/lib/reglas/costos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export type StockPorSucursal = Record<Sucursal, number>;

function esSucursal(valor: string): valor is Sucursal {
  return (SUCURSALES as readonly string[]).includes(valor);
}

function validarCantidadPositiva(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export async function bloquearStock(
  tx: PoolClient,
  productoId: string,
): Promise<StockPorSucursal> {
  const resultado = await tx.query<{ sucursal: string; cantidad: number }>(
    `SELECT sucursal, cantidad
       FROM existencias
      WHERE producto_id = $1
      ORDER BY sucursal
      FOR UPDATE`,
    [productoId],
  );

  const stock: StockPorSucursal = { A: 0, B: 0, C: 0 };
  for (const fila of resultado.rows) {
    if (esSucursal(fila.sucursal)) {
      stock[fila.sucursal] = Number(fila.cantidad);
    }
  }
  return stock;
}

export async function ajustar(
  tx: PoolClient,
  productoId: string,
  sucursal: Sucursal,
  delta: number,
): Promise<void> {
  await tx.query(
    `UPDATE existencias
        SET cantidad = cantidad + $3
      WHERE producto_id = $1 AND sucursal = $2`,
    [productoId, sucursal, delta],
  );
}

async function obtenerStockActual(
  tx: PoolClient,
  productoId: string,
): Promise<StockPorSucursal> {
  const resultado = await tx.query<{ sucursal: string; cantidad: number }>(
    `SELECT sucursal, cantidad
       FROM existencias
      WHERE producto_id = $1
      ORDER BY sucursal`,
    [productoId],
  );
  const stock: StockPorSucursal = { A: 0, B: 0, C: 0 };
  for (const fila of resultado.rows) {
    if (esSucursal(fila.sucursal)) {
      stock[fila.sucursal] = Number(fila.cantidad);
    }
  }
  return stock;
}

export async function registrarEntrada(
  codigo: string,
  sucursal: Sucursal,
  cantidad: number,
): Promise<{ stock: StockPorSucursal }> {
  if (!esSucursal(sucursal)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  validarCantidadPositiva(cantidad);

  return conTransaccion(async (tx) => {
    const producto = await tx.query<{ id: string }>(
      `SELECT id FROM productos WHERE codigo = $1 AND activo = true FOR UPDATE`,
      [codigo.trim()],
    );
    const fila = producto.rows[0];
    if (!fila) {
      throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
    }

    await ajustar(tx, fila.id, sucursal, cantidad);
    await tx.query(
      `INSERT INTO transacciones
        (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo)
       VALUES ($1, 'entrada', NULL, $2, $3, 0, NULL)`,
      [fila.id, sucursal, cantidad],
    );

    const stock = await obtenerStockActual(tx, fila.id);
    return { stock };
  });
}
