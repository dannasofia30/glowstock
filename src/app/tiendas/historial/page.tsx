import { listarInventario, listarTransacciones } from '@/lib/dataService';
import { TablaTransacciones } from '@/components/tiendas/TablaTransacciones';
import type { Sucursal } from '@/lib/reglas/costos';

export const dynamic = 'force-dynamic';

type ParametroBusqueda = string | string[] | undefined;

const TIPOS_VALIDOS = new Set(['venta_local', 'transferencia', 'orden_proveedor', 'entrada']);
const SUCURSALES_VALIDAS = new Set(['A', 'B', 'C']);

function obtenerValor(parametro: ParametroBusqueda): string | undefined {
  if (typeof parametro === 'string') {
    const valor = parametro.trim();
    return valor || undefined;
  }
  if (Array.isArray(parametro) && parametro.length > 0) {
    const valor = parametro[0]?.trim();
    return valor || undefined;
  }
  return undefined;
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

export default async function PaginaHistorialTiendas({
  searchParams,
}: {
  searchParams?: Promise<Record<string, ParametroBusqueda>>;
}) {
  const parametros = (await searchParams) ?? {};

  const productoCodigo = obtenerValor(parametros.productoCodigo);
  const tipoValor = obtenerValor(parametros.tipo);
  const sucursalValor = obtenerValor(parametros.sucursal);
  const desdeValor = obtenerValor(parametros.desde);
  const hastaValor = obtenerValor(parametros.hasta);

  const tipo = tipoValor && TIPOS_VALIDOS.has(tipoValor) ? tipoValor : undefined;
  const sucursal =
    sucursalValor && SUCURSALES_VALIDAS.has(sucursalValor)
      ? (sucursalValor as Sucursal)
      : undefined;

  const filtrosConsulta: {
    productoCodigo?: string;
    tipo?: string;
    sucursal?: Sucursal;
    desde?: string;
    hasta?: string;
  } = {};
  if (productoCodigo) filtrosConsulta.productoCodigo = productoCodigo;
  if (tipo) filtrosConsulta.tipo = tipo;
  if (sucursal) filtrosConsulta.sucursal = sucursal;
  if (desdeValor) filtrosConsulta.desde = normalizarDesde(desdeValor);
  if (hastaValor) filtrosConsulta.hasta = normalizarHasta(hastaValor);

  const [transacciones, inventario] = await Promise.all([
    listarTransacciones(filtrosConsulta),
    listarInventario(),
  ]);

  const productos = inventario
    .map((producto) => ({ codigo: producto.codigo, nombre: producto.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const filtrosUi: {
    productoCodigo?: string;
    tipo?: string;
    sucursal?: Sucursal;
    desde?: string;
    hasta?: string;
  } = {};
  if (productoCodigo) filtrosUi.productoCodigo = productoCodigo;
  if (tipo) filtrosUi.tipo = tipo;
  if (sucursal) filtrosUi.sucursal = sucursal;
  if (desdeValor && esFechaSimple(desdeValor)) filtrosUi.desde = desdeValor;
  else if (desdeValor) filtrosUi.desde = desdeValor;
  if (hastaValor && esFechaSimple(hastaValor)) filtrosUi.hasta = hastaValor;
  else if (hastaValor) filtrosUi.hasta = hastaValor;

  return (
    <TablaTransacciones
      transacciones={transacciones}
      productos={productos}
      filtros={filtrosUi}
    />
  );
}
