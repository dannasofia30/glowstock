import { SUCURSALES } from '@/lib/config/intertiendas';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { esCritico } from '@/lib/reglas/alertas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { validarProducto } from '@/lib/reglas/producto';
import type { DatosProducto, DetalleProducto, FilaInventario } from './tipos';

interface FilaInventarioBd {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock_minimo: number;
  activo: boolean;
  stock_a: number;
  stock_b: number;
  stock_c: number;
  stock_total: number;
  critico: boolean;
  created_at?: string;
  updated_at?: string;
}

function mapearInventario(fila: FilaInventarioBd): FilaInventario {
  const stockTotal = Number(fila.stock_total);
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    categoria: fila.categoria,
    precio: Number(fila.precio),
    stockMinimo: Number(fila.stock_minimo),
    activo: Boolean(fila.activo),
    stockA: Number(fila.stock_a),
    stockB: Number(fila.stock_b),
    stockC: Number(fila.stock_c),
    stockTotal,
    critico: esCritico(stockTotal),
  };
}

export async function listarInventario(f?: {
  categoria?: string;
  soloCriticos?: boolean;
}): Promise<FilaInventario[]> {
  const condiciones: string[] = ['activo = true'];
  const valores: unknown[] = [];

  if (f?.categoria) {
    valores.push(f.categoria);
    condiciones.push(`categoria = $${valores.length}`);
  }

  if (f?.soloCriticos) {
    condiciones.push('stock_total <= 10');
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar<FilaInventarioBd>(
    `SELECT id, codigo, nombre, categoria, precio, stock_minimo, activo,
            stock_a, stock_b, stock_c, stock_total, critico
       FROM v_inventario
       ${where}
      ORDER BY nombre ASC, codigo ASC`,
    valores,
  );

  return filas.map(mapearInventario);
}

export async function crearProducto(d: DatosProducto): Promise<{ id: string; codigo: string }> {
  const datos = {
    codigo: d.codigo.trim(),
    nombre: d.nombre.trim(),
    categoria: d.categoria.trim(),
    precio: d.precio,
    stockMinimo: d.stockMinimo ?? 5,
  };

  validarProducto(datos);

  try {
    return await conTransaccion(async (tx) => {
      const producto = await tx.query<{ id: string; codigo: string }>(
        `INSERT INTO productos (codigo, nombre, categoria, precio, stock_minimo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, codigo`,
        [datos.codigo, datos.nombre, datos.categoria, datos.precio, datos.stockMinimo],
      );

      const creado = producto.rows[0];
      if (!creado) {
        throw new ErrorDeNegocio('ERROR_INTERNO');
      }

      for (const sucursal of SUCURSALES) {
        await tx.query(
          `INSERT INTO existencias (producto_id, sucursal, cantidad)
           VALUES ($1, $2, 0)`,
          [creado.id, sucursal],
        );
      }

      return { id: creado.id, codigo: creado.codigo };
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      throw new ErrorDeNegocio('PRODUCTO_DUPLICADO');
    }
    throw error;
  }
}

export async function obtenerProducto(codigo: string): Promise<DetalleProducto> {
  const filas = await consultar<FilaInventarioBd>(
    `SELECT id, codigo, nombre, categoria, precio, stock_minimo, activo,
            stock_a, stock_b, stock_c, stock_total, critico, created_at, updated_at
       FROM v_inventario
      WHERE codigo = $1
      LIMIT 1`,
    [codigo],
  );

  const fila = filas[0];
  if (!fila) {
    throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
  }

  const stockTotal = Number(fila.stock_total);
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    categoria: fila.categoria,
    precio: Number(fila.precio),
    stockMinimo: Number(fila.stock_minimo),
    activo: Boolean(fila.activo),
    stockA: Number(fila.stock_a),
    stockB: Number(fila.stock_b),
    stockC: Number(fila.stock_c),
    stockTotal,
    critico: esCritico(stockTotal),
    ...(fila.created_at ? { createdAt: fila.created_at } : {}),
    ...(fila.updated_at ? { updatedAt: fila.updated_at } : {}),
  };
}
