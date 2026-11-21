'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatearPesos } from '@/lib/formato';
import type { FilaInventario } from '@/lib/datos/tipos';
import { InsigniaCritico } from '@/components/tiendas/InsigniaCritico';
import { Boton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';

interface PropiedadesMatrizInventario {
  productos: FilaInventario[];
  categorias: string[];
  categoriaSeleccionada?: string;
  soloCriticos?: boolean;
}

export function MatrizInventario({
  productos,
  categorias,
  categoriaSeleccionada = '',
  soloCriticos = false,
}: PropiedadesMatrizInventario) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const actualizarFiltros = (cambios: { categoria?: string; criticos?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());

    const categoria = cambios.categoria ?? categoriaSeleccionada;
    const criticos = cambios.criticos ?? soloCriticos;

    if (categoria) {
      params.set('categoria', categoria);
    } else {
      params.delete('categoria');
    }

    if (criticos) {
      params.set('criticos', '1');
    } else {
      params.delete('criticos');
    }

    const consulta = params.toString();
    router.replace(consulta ? `${pathname}?${consulta}` : pathname);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto">Inventario de la red</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Existencias por sucursal, total y estado crítico de cada producto.
          </p>
        </div>
        <Link
          href="/tiendas/productos/nuevo"
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
        >
          Nuevo producto
        </Link>
      </div>

      <Tarjeta>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto] lg:items-end">
          <Selector
            id="filtro-categoria"
            etiqueta="Categoría"
            value={categoriaSeleccionada}
            onChange={(evento) => actualizarFiltros({ categoria: evento.target.value })}
            opciones={[
              { valor: '', etiqueta: 'Todas las categorías' },
              ...categorias.map((categoria) => ({ valor: categoria, etiqueta: categoria })),
            ]}
          />
          <label className="flex items-center gap-2 rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto">
            <input
              type="checkbox"
              checked={soloCriticos}
              onChange={(evento) => actualizarFiltros({ criticos: evento.target.checked })}
              className="h-4 w-4 rounded border-borde text-primario focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario"
            />
            Solo críticos
          </label>
        </div>
        {(categoriaSeleccionada || soloCriticos) ? (
          <div className="mt-4">
            <Boton
              variante="fantasma"
              onClick={() => router.replace(pathname)}
            >
              Limpiar filtros
            </Boton>
          </div>
        ) : null}
      </Tarjeta>

      {productos.length === 0 ? (
        <EstadoVacio
          titulo="No hay productos para mostrar"
          descripcion={
            soloCriticos || categoriaSeleccionada
              ? 'No se encontraron productos con los filtros seleccionados.'
              : 'Registra un producto para comenzar a gestionar el inventario de la red.'
          }
          accion={
            !soloCriticos && !categoriaSeleccionada ? (
              <Link
                href="/tiendas/productos/nuevo"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
              >
                Nuevo producto
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-borde bg-superficie md:block">
            <table className="min-w-full divide-y divide-borde text-left text-sm">
              <thead className="bg-fondo text-texto-suave">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Sucursal A</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Sucursal B</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Sucursal C</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Total</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {productos.map((producto) => (
                  <tr key={producto.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tiendas/productos/${encodeURIComponent(producto.codigo)}`}
                        className="font-medium text-texto underline-offset-2 hover:text-primario hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo rounded"
                      >
                        {producto.nombre}
                      </Link>
                      <div className="text-xs text-texto-suave">
                        {producto.codigo} · {formatearPesos(producto.precio)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-texto">{producto.categoria}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">{producto.stockA}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">{producto.stockB}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">{producto.stockC}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-texto">{producto.stockTotal}</td>
                    <td className="px-4 py-3">
                      <InsigniaCritico critico={producto.critico} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {productos.map((producto) => (
              <Tarjeta key={producto.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/tiendas/productos/${encodeURIComponent(producto.codigo)}`}
                      className="text-base font-semibold text-texto underline-offset-2 hover:text-primario hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo rounded"
                    >
                      {producto.nombre}
                    </Link>
                    <p className="text-xs text-texto-suave">
                      {producto.codigo} · {producto.categoria} · {formatearPesos(producto.precio)}
                    </p>
                  </div>
                  <InsigniaCritico critico={producto.critico} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-fondo p-2">
                    <dt className="text-texto-suave">Sucursal A</dt>
                    <dd className="font-semibold text-texto">{producto.stockA}</dd>
                  </div>
                  <div className="rounded-lg bg-fondo p-2">
                    <dt className="text-texto-suave">Sucursal B</dt>
                    <dd className="font-semibold text-texto">{producto.stockB}</dd>
                  </div>
                  <div className="rounded-lg bg-fondo p-2">
                    <dt className="text-texto-suave">Sucursal C</dt>
                    <dd className="font-semibold text-texto">{producto.stockC}</dd>
                  </div>
                  <div className="rounded-lg border border-borde bg-primario-suave p-2">
                    <dt className="font-medium text-primario">Total</dt>
                    <dd className="text-lg font-bold text-primario">{producto.stockTotal}</dd>
                  </div>
                </dl>
              </Tarjeta>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
