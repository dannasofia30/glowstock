import { listarInventario } from '@/lib/dataService';
import { MatrizInventario } from '@/components/tiendas/MatrizInventario';

export const dynamic = 'force-dynamic';

export default async function PaginaInventarioTiendas({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string | string[]; criticos?: string | string[] }>;
}) {
  const parametros = (await searchParams) ?? {};
  const categoria =
    typeof parametros.categoria === 'string' && parametros.categoria.trim()
      ? parametros.categoria.trim()
      : undefined;
  const soloCriticos =
    parametros.criticos === '1' ||
    (Array.isArray(parametros.criticos) && parametros.criticos.includes('1'));

  const [productos, inventarioCompleto] = await Promise.all([
    listarInventario({
      ...(categoria ? { categoria } : {}),
      ...(soloCriticos ? { soloCriticos: true } : {}),
    }),
    listarInventario(),
  ]);

  const categorias = Array.from(
    new Set(inventarioCompleto.map((producto) => producto.categoria)),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <MatrizInventario
      productos={productos}
      categorias={categorias}
      {...(categoria ? { categoriaSeleccionada: categoria } : {})}
      soloCriticos={soloCriticos}
    />
  );
}
