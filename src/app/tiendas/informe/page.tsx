import Link from 'next/link';
import { obtenerInforme } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';
import { formatearPesos } from '@/lib/formato';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';

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

export default async function PaginaInformeTiendas({
  searchParams,
}: {
  searchParams?: Promise<Record<string, ParametroBusqueda>>;
}) {
  const parametros = (await searchParams) ?? {};
  const hoy = hoyBogota();
  const desde = obtenerValor(parametros.desde) ?? hoy;
  const hasta = obtenerValor(parametros.hasta) ?? hoy;

  const informe = await obtenerInforme(desde, hasta);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-texto">Informe diario</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Resumen de ventas locales, transferencias, órdenes al proveedor y productos en estado crítico del periodo.
        </p>
      </div>

      <Tarjeta titulo="Periodo del informe">
        <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" method="get">
          <Campo
            id="informe-desde"
            etiqueta="Desde"
            name="desde"
            type="date"
            defaultValue={desde}
            required
          />
          <Campo
            id="informe-hasta"
            etiqueta="Hasta"
            name="hasta"
            type="date"
            defaultValue={hasta}
            required
          />
          <Boton type="submit">Consultar</Boton>
        </form>
      </Tarjeta>

      <Tarjeta titulo={`Resumen del periodo ${desde} a ${hasta}`}>
        {informe.totalTransacciones === 0 && informe.productosCriticos === 0 ? (
          <EstadoVacio
            titulo="Sin actividad registrada en el periodo"
            descripcion="No se encontraron transacciones en el rango seleccionado. Ajuste las fechas para consultar otro periodo."
            accion={
              <Link
                href="/tiendas/historial"
                className="inline-flex items-center justify-center rounded-lg border border-borde bg-superficie px-4 py-2 text-sm font-medium text-texto transition hover:bg-fondo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
              >
                Ver historial
              </Link>
            }
          />
        ) : null}

        <dl className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <dt className="text-sm text-texto-suave">Ventas locales</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.ventasLocales}</dd>
            <dd className="text-xs text-texto-suave">{informe.unidadesVendidas} unidades vendidas</dd>
          </div>
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <dt className="text-sm text-texto-suave">Transferencias</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.transferencias}</dd>
            <dd className="text-xs text-texto-suave">{informe.unidadesTransferidas} unidades transferidas</dd>
          </div>
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <dt className="text-sm text-texto-suave">Órdenes al proveedor</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.ordenesProveedor}</dd>
            <dd className="text-xs text-texto-suave">En el periodo seleccionado</dd>
          </div>
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <dt className="text-sm text-texto-suave">Entradas registradas</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.entradas}</dd>
            <dd className="text-xs text-texto-suave">Incluye ingresos de stock</dd>
          </div>
          <div className="rounded-lg border border-borde bg-primario-suave p-4">
            <dt className="text-sm font-medium text-primario">Costo logístico total</dt>
            <dd className="mt-1 text-2xl font-bold text-primario">
              {formatearPesos(informe.costoLogisticoTotal)}
            </dd>
            <dd className="text-xs text-primario/80">Suma de costos de transferencias</dd>
          </div>
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <dt className="text-sm text-texto-suave">Productos en estado crítico</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.productosCriticos}</dd>
            <dd className="text-xs text-texto-suave">Stock total en red ≤ 10 (actual)</dd>
          </div>
          <div className="rounded-lg border border-borde bg-fondo p-4 sm:col-span-2 lg:col-span-2">
            <dt className="text-sm text-texto-suave">Total de transacciones del periodo</dt>
            <dd className="mt-1 text-2xl font-bold text-texto">{informe.totalTransacciones}</dd>
            <dd className="text-xs text-texto-suave">
              Ventas locales, transferencias, órdenes al proveedor y entradas entre {desde} y {hasta}.
            </dd>
          </div>
        </dl>
      </Tarjeta>
    </div>
  );
}
