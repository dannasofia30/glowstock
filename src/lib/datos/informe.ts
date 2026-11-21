import { consultar } from '@/lib/db/conexion';
import type { Informe } from './tipos';

interface ConteoTransaccionesBd {
  ventas_locales: number;
  transferencias: number;
  ordenes_proveedor: number;
  entradas: number;
  costo_logistico_total: number;
  unidades_vendidas: number;
  unidades_transferidas: number;
  total_transacciones: number;
}

interface ConteoCriticosBd {
  productos_criticos: number;
}

function esFechaSimple(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function normalizarDesde(valor: string): string {
  return esFechaSimple(valor) ? `${valor}T00:00:00.000-05:00` : valor;
}

function normalizarHasta(valor: string): string {
  return esFechaSimple(valor) ? `${valor}T23:59:59.999-05:00` : valor;
}

export async function obtenerInforme(desde: string, hasta: string): Promise<Informe> {
  const desdeNormalizado = normalizarDesde(desde);
  const hastaNormalizado = normalizarHasta(hasta);

  const filas = await consultar<ConteoTransaccionesBd>(
    `SELECT
      COUNT(*) FILTER (WHERE tipo = 'venta_local')::int AS ventas_locales,
      COUNT(*) FILTER (WHERE tipo = 'transferencia')::int AS transferencias,
      COUNT(*) FILTER (WHERE tipo = 'orden_proveedor')::int AS ordenes_proveedor,
      COUNT(*) FILTER (WHERE tipo = 'entrada')::int AS entradas,
      COALESCE(SUM(costo_logistico) FILTER (WHERE tipo = 'transferencia'), 0)::int AS costo_logistico_total,
      COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'venta_local'), 0)::int AS unidades_vendidas,
      COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'transferencia'), 0)::int AS unidades_transferidas,
      COUNT(*)::int AS total_transacciones
    FROM transacciones
    WHERE fecha >= $1::timestamptz
      AND fecha <= $2::timestamptz`,
    [desdeNormalizado, hastaNormalizado],
  );

  const conteo = filas[0] ?? {
    ventas_locales: 0,
    transferencias: 0,
    ordenes_proveedor: 0,
    entradas: 0,
    costo_logistico_total: 0,
    unidades_vendidas: 0,
    unidades_transferidas: 0,
    total_transacciones: 0,
  };

  const filasCriticos = await consultar<ConteoCriticosBd>(
    `SELECT COUNT(*)::int AS productos_criticos
       FROM v_inventario
      WHERE activo = true AND stock_total <= 10`,
  );
  const productosCriticos = filasCriticos[0]?.productos_criticos ?? 0;

  return {
    desde,
    hasta,
    ventasLocales: Number(conteo.ventas_locales),
    transferencias: Number(conteo.transferencias),
    ordenesProveedor: Number(conteo.ordenes_proveedor),
    entradas: Number(conteo.entradas),
    costoLogisticoTotal: Number(conteo.costo_logistico_total),
    unidadesVendidas: Number(conteo.unidades_vendidas),
    unidadesTransferidas: Number(conteo.unidades_transferidas),
    totalTransacciones: Number(conteo.total_transacciones),
    productosCriticos: Number(productosCriticos),
  };
}
