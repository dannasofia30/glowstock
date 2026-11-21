import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormularioEntrada } from '@/components/tiendas/FormularioEntrada';
import { InsigniaCritico } from '@/components/tiendas/InsigniaCritico';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarTransacciones, obtenerProducto } from '@/lib/dataService';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

function etiquetaTipo(tipo: string): string {
  switch (tipo) {
    case 'venta_local':
      return 'Venta local';
    case 'transferencia':
      return 'Transferencia';
    case 'orden_proveedor':
      return 'Orden al proveedor';
    case 'entrada':
      return 'Entrada';
    default:
      return tipo;
  }
}

export default async function PaginaDetalleProducto({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo: codigoParam } = await params;
  const codigo = decodeURIComponent(codigoParam);

  let producto;
  try {
    producto = await obtenerProducto(codigo);
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'PRODUCTO_NO_ENCONTRADO') {
      notFound();
    }
    throw error;
  }

  const transacciones = await listarTransacciones({ productoCodigo: producto.codigo });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/tiendas"
          className="text-sm font-medium text-primario hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo rounded"
        >
          ← Volver al inventario
        </Link>
      </div>

      <Tarjeta>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-texto-suave">{producto.codigo}</p>
            <h1 className="text-2xl font-bold text-texto">{producto.nombre}</h1>
            <p className="mt-1 text-sm text-texto-suave">
              {producto.categoria} · Precio: {formatearPesos(producto.precio)} · Stock mínimo: {producto.stockMinimo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-texto-suave">Estado:</span>
            <InsigniaCritico critico={producto.critico} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-fondo p-3">
            <p className="text-sm text-texto-suave">Sucursal A</p>
            <p className="text-xl font-semibold text-texto">{producto.stockA}</p>
          </div>
          <div className="rounded-lg bg-fondo p-3">
            <p className="text-sm text-texto-suave">Sucursal B</p>
            <p className="text-xl font-semibold text-texto">{producto.stockB}</p>
          </div>
          <div className="rounded-lg bg-fondo p-3">
            <p className="text-sm text-texto-suave">Sucursal C</p>
            <p className="text-xl font-semibold text-texto">{producto.stockC}</p>
          </div>
          <div className="rounded-lg border border-borde bg-primario-suave p-3">
            <p className="text-sm font-medium text-primario">Total en red</p>
            <p className="text-2xl font-bold text-primario">{producto.stockTotal}</p>
          </div>
        </div>
      </Tarjeta>

      <FormularioEntrada codigo={producto.codigo} />

      <Tarjeta titulo="Transacciones del producto" descripcion="Historial de movimientos registrados para este producto.">
        {transacciones.length === 0 ? (
          <EstadoVacio
            titulo="Sin transacciones"
            descripcion="Aún no hay movimientos registrados para este producto."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-borde text-left text-sm">
                <thead className="text-texto-suave">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Fecha</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Tipo</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Origen</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Destino</th>
                    <th scope="col" className="px-3 py-2 font-semibold text-right">Cantidad</th>
                    <th scope="col" className="px-3 py-2 font-semibold text-right">Costo logístico</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {transacciones.map((transaccion) => (
                    <tr key={transaccion.id}>
                      <td className="px-3 py-2 text-texto">{formatearFecha(transaccion.fecha)}</td>
                      <td className="px-3 py-2 text-texto">{etiquetaTipo(transaccion.tipo)}</td>
                      <td className="px-3 py-2 text-texto">{transaccion.sucursalOrigen ?? '—'}</td>
                      <td className="px-3 py-2 text-texto">{transaccion.sucursalDestino ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-texto">{transaccion.cantidad}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-texto">{formatearPesos(transaccion.costoLogistico)}</td>
                      <td className="px-3 py-2 text-texto">{transaccion.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {transacciones.map((transaccion) => (
                <div key={transaccion.id} className="rounded-lg border border-borde bg-fondo p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-texto">{etiquetaTipo(transaccion.tipo)}</p>
                    <p className="text-xs text-texto-suave">{formatearFecha(transaccion.fecha)}</p>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-texto-suave">Origen</dt>
                      <dd className="text-texto">{transaccion.sucursalOrigen ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-texto-suave">Destino</dt>
                      <dd className="text-texto">{transaccion.sucursalDestino ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-texto-suave">Cantidad</dt>
                      <dd className="text-texto">{transaccion.cantidad}</dd>
                    </div>
                    <div>
                      <dt className="text-texto-suave">Costo logístico</dt>
                      <dd className="text-texto">{formatearPesos(transaccion.costoLogistico)}</dd>
                    </div>
                  </dl>
                  {transaccion.motivo ? (
                    <p className="mt-2 text-texto-suave">Motivo: {transaccion.motivo}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
