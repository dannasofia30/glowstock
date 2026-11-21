import { listarOrdenes } from '@/lib/dataService';
import { ListaOrdenes } from '@/components/tiendas/ListaOrdenes';

export const dynamic = 'force-dynamic';

type ParametroBusqueda = string | string[] | undefined;

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

export default async function PaginaOrdenesTiendas({
  searchParams,
}: {
  searchParams?: Promise<Record<string, ParametroBusqueda>>;
}) {
  const parametros = (await searchParams) ?? {};
  const estado = obtenerValor(parametros.estado) ?? '';

  const estadoFiltro =
    estado === 'pendiente' || estado === 'recibida' ? estado : undefined;

  const ordenes = await listarOrdenes(estadoFiltro ? { estado: estadoFiltro } : undefined);

  return <ListaOrdenes ordenes={ordenes} estado={estadoFiltro ?? ''} />;
}
