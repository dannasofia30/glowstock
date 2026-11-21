'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { OrdenProveedor } from '@/lib/datos/tipos';
import { formatearFecha } from '@/lib/formato';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';

interface RespuestaApi<T> {
  ok: boolean;
  datos?: T;
  error?: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}

function textoMotivo(motivo: string): string {
  if (motivo === 'agotamiento_total') return 'Agotamiento total';
  if (motivo === 'sin_candidata_viable') return 'Sin candidata viable';
  return motivo;
}

export function ListaOrdenes({
  ordenes,
  estado,
}: {
  ordenes: OrdenProveedor[];
  estado: string;
}) {
  const router = useRouter();
  const [recibiendoId, setRecibiendoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cambiarEstado = (valor: string) => {
    if (!valor) {
      router.replace('/tiendas/ordenes');
      return;
    }
    router.replace(`/tiendas/ordenes?estado=${encodeURIComponent(valor)}`);
  };

  const recibir = async (id: number) => {
    setError(null);
    setExito(null);
    setRecibiendoId(id);
    try {
      const respuesta = await fetch(`/api/tiendas/ordenes/${id}/recibir`, { method: 'POST' });
      const json = (await respuesta.json()) as RespuestaApi<OrdenProveedor>;
      if (!respuesta.ok || !json.ok || !json.datos) {
        setError(json.error?.mensaje ?? 'No se pudo recibir la orden.');
        return;
      }
      setExito(`Orden #${id} recibida. El stock de la sucursal ${json.datos.sucursal} fue actualizado.`);
      router.refresh();
    } catch {
      setError('Ocurrió un error de conexión al recibir la orden.');
    } finally {
      setRecibiendoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-texto">Órdenes al proveedor</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Consulte las órdenes generadas y reciba las pendientes para sumar el lote al stock de la sucursal.
        </p>
      </div>

      <Tarjeta titulo="Filtro">
        <div className="max-w-xs">
          <Selector
            id="filtro-estado-orden"
            etiqueta="Estado"
            value={estado}
            onChange={(evento) => cambiarEstado(evento.target.value)}
            opciones={[
              { valor: '', etiqueta: 'Todas' },
              { valor: 'pendiente', etiqueta: 'Pendientes' },
              { valor: 'recibida', etiqueta: 'Recibidas' },
            ]}
          />
        </div>
      </Tarjeta>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {exito ? <Aviso tipo="exito">{exito}</Aviso> : null}

      {ordenes.length === 0 ? (
        <EstadoVacio
          titulo="No hay órdenes para mostrar"
          descripcion={
            estado
              ? 'No se encontraron órdenes con el estado seleccionado.'
              : 'Las órdenes al proveedor generadas aparecerán aquí.'
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-borde bg-superficie lg:block">
            <table className="min-w-full divide-y divide-borde text-left text-sm">
              <thead className="bg-fondo text-texto-suave">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">ID</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Sucursal</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Recibida</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td className="px-4 py-3 text-texto">#{orden.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-texto">{formatearFecha(orden.fecha)}</td>
                    <td className="px-4 py-3 text-texto">
                      <div className="font-medium">{orden.productoNombre ?? orden.productoId}</div>
                      {orden.productoCodigo ? (
                        <div className="text-xs text-texto-suave">{orden.productoCodigo}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-texto">{orden.sucursal}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">{orden.cantidad}</td>
                    <td className="px-4 py-3 text-texto">{textoMotivo(orden.motivo)}</td>
                    <td className="px-4 py-3">
                      <Insignia tono={orden.estado === 'pendiente' ? 'proveedor' : 'neutro'}>
                        {orden.estado === 'pendiente' ? 'Pendiente' : 'Recibida'}
                      </Insignia>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-texto">
                      {orden.recibidaAt ? formatearFecha(orden.recibidaAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {orden.estado === 'pendiente' ? (
                        <Boton
                          type="button"
                          variante="secundario"
                          onClick={() => recibir(orden.id)}
                          cargando={recibiendoId === orden.id}
                        >
                          Recibir
                        </Boton>
                      ) : (
                        <span className="text-texto-suave">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {ordenes.map((orden) => (
              <Tarjeta key={orden.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-texto">
                      Orden #{orden.id} · {orden.productoNombre ?? orden.productoCodigo ?? 'Producto'}
                    </p>
                    {orden.productoCodigo ? (
                      <p className="text-xs text-texto-suave">{orden.productoCodigo}</p>
                    ) : null}
                  </div>
                  <Insignia tono={orden.estado === 'pendiente' ? 'proveedor' : 'neutro'}>
                    {orden.estado === 'pendiente' ? 'Pendiente' : 'Recibida'}
                  </Insignia>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-texto-suave">Fecha</dt>
                    <dd className="text-texto">{formatearFecha(orden.fecha)}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Sucursal</dt>
                    <dd className="text-texto">{orden.sucursal}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Cantidad</dt>
                    <dd className="text-texto">{orden.cantidad}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Motivo</dt>
                    <dd className="text-texto">{textoMotivo(orden.motivo)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-texto-suave">Recibida</dt>
                    <dd className="text-texto">{orden.recibidaAt ? formatearFecha(orden.recibidaAt) : '-'}</dd>
                  </div>
                </dl>
                {orden.estado === 'pendiente' ? (
                  <div className="mt-3">
                    <Boton
                      type="button"
                      variante="secundario"
                      onClick={() => recibir(orden.id)}
                      cargando={recibiendoId === orden.id}
                    >
                      Recibir orden
                    </Boton>
                  </div>
                ) : null}
              </Tarjeta>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
