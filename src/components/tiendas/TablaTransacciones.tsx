'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { Transaccion } from '@/lib/datos/tipos';
import type { Sucursal } from '@/lib/reglas/costos';
import { SUCURSALES } from '@/lib/config/intertiendas';
import { formatearFecha, formatearPesos } from '@/lib/formato';

interface ProductoFiltro {
  codigo: string;
  nombre: string;
}

interface PropiedadesTablaTransacciones {
  transacciones: Transaccion[];
  productos: ProductoFiltro[];
  filtros: {
    productoCodigo?: string;
    tipo?: string;
    sucursal?: Sucursal;
    desde?: string;
    hasta?: string;
  };
}

const TIPOS = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'venta_local', etiqueta: 'Venta local' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'orden_proveedor', etiqueta: 'Orden al proveedor' },
  { valor: 'entrada', etiqueta: 'Entrada' },
];

function etiquetaTipo(tipo: Transaccion['tipo']): string {
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

function tonoTipo(tipo: Transaccion['tipo']): 'local' | 'transferencia' | 'proveedor' | 'neutro' {
  switch (tipo) {
    case 'venta_local':
      return 'local';
    case 'transferencia':
      return 'transferencia';
    case 'orden_proveedor':
      return 'proveedor';
    default:
      return 'neutro';
  }
}

function textoMotivo(motivo: string | null): string {
  if (!motivo) return '-';
  if (motivo === 'agotamiento_total') return 'Agotamiento total';
  if (motivo === 'sin_candidata_viable') return 'Sin candidata viable';
  return motivo;
}

export function TablaTransacciones({
  transacciones,
  productos,
  filtros,
}: PropiedadesTablaTransacciones) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const opcionesProductos = useMemo(
    () => [
      { valor: '', etiqueta: 'Todos los productos' },
      ...productos.map((producto) => ({
        valor: producto.codigo,
        etiqueta: `${producto.nombre} (${producto.codigo})`,
      })),
    ],
    [productos],
  );

  const opcionesSucursales = useMemo(
    () => [
      { valor: '', etiqueta: 'Todas las sucursales' },
      ...SUCURSALES.map((sucursal) => ({ valor: sucursal, etiqueta: `Sucursal ${sucursal}` })),
    ],
    [],
  );

  const actualizar = (clave: string, valor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(clave, valor);
    } else {
      params.delete(clave);
    }
    const consulta = params.toString();
    router.replace(consulta ? `${pathname}?${consulta}` : pathname);
  };

  const limpiar = () => {
    router.replace(pathname);
  };

  const hayFiltros = Boolean(
    filtros.productoCodigo || filtros.tipo || filtros.sucursal || filtros.desde || filtros.hasta,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-texto">Historial de transacciones</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Consulte las ventas locales, transferencias, órdenes al proveedor y entradas registradas.
        </p>
      </div>

      <Tarjeta titulo="Filtros">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Selector
            id="filtro-producto"
            etiqueta="Producto"
            value={filtros.productoCodigo ?? ''}
            onChange={(evento) => actualizar('productoCodigo', evento.target.value)}
            opciones={opcionesProductos}
          />
          <Selector
            id="filtro-tipo"
            etiqueta="Tipo"
            value={filtros.tipo ?? ''}
            onChange={(evento) => actualizar('tipo', evento.target.value)}
            opciones={TIPOS}
          />
          <Selector
            id="filtro-sucursal"
            etiqueta="Sucursal"
            value={filtros.sucursal ?? ''}
            onChange={(evento) => actualizar('sucursal', evento.target.value)}
            opciones={opcionesSucursales}
          />
          <Campo
            id="filtro-desde"
            etiqueta="Desde"
            type="date"
            value={filtros.desde ?? ''}
            onChange={(evento) => actualizar('desde', evento.target.value)}
          />
          <Campo
            id="filtro-hasta"
            etiqueta="Hasta"
            type="date"
            value={filtros.hasta ?? ''}
            onChange={(evento) => actualizar('hasta', evento.target.value)}
          />
        </div>
        {hayFiltros ? (
          <div className="mt-4">
            <Boton variante="fantasma" onClick={limpiar}>
              Limpiar filtros
            </Boton>
          </div>
        ) : null}
      </Tarjeta>

      {transacciones.length === 0 ? (
        <EstadoVacio
          titulo="No hay transacciones para mostrar"
          descripcion={
            hayFiltros
              ? 'No se encontraron transacciones con los filtros seleccionados.'
              : 'Las transacciones registradas aparecerán aquí.'
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-borde bg-superficie xl:block">
            <table className="min-w-full divide-y divide-borde text-left text-sm">
              <thead className="bg-fondo text-texto-suave">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Origen</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Destino</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Costo logístico</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {transacciones.map((transaccion) => (
                  <tr key={transaccion.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-texto">
                      {formatearFecha(transaccion.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <Insignia tono={tonoTipo(transaccion.tipo)}>
                        {etiquetaTipo(transaccion.tipo)}
                      </Insignia>
                    </td>
                    <td className="px-4 py-3 text-texto">
                      <div className="font-medium">{transaccion.productoNombre}</div>
                      <div className="text-xs text-texto-suave">{transaccion.productoCodigo}</div>
                    </td>
                    <td className="px-4 py-3 text-texto">{transaccion.sucursalOrigen ?? '-'}</td>
                    <td className="px-4 py-3 text-texto">{transaccion.sucursalDestino ?? '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">{transaccion.cantidad}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-texto">
                      {transaccion.costoLogistico > 0
                        ? formatearPesos(transaccion.costoLogistico)
                        : formatearPesos(0)}
                    </td>
                    <td className="px-4 py-3 text-texto">{textoMotivo(transaccion.motivo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {transacciones.map((transaccion) => (
              <Tarjeta key={transaccion.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-texto">{transaccion.productoNombre}</p>
                    <p className="text-xs text-texto-suave">{transaccion.productoCodigo}</p>
                  </div>
                  <Insignia tono={tonoTipo(transaccion.tipo)}>
                    {etiquetaTipo(transaccion.tipo)}
                  </Insignia>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-texto-suave">Fecha</dt>
                    <dd className="text-texto">{formatearFecha(transaccion.fecha)}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Cantidad</dt>
                    <dd className="font-medium text-texto">{transaccion.cantidad}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Origen</dt>
                    <dd className="text-texto">{transaccion.sucursalOrigen ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Destino</dt>
                    <dd className="text-texto">{transaccion.sucursalDestino ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-suave">Costo logístico</dt>
                    <dd className="text-texto">{formatearPesos(transaccion.costoLogistico)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-texto-suave">Motivo</dt>
                    <dd className="text-texto">{textoMotivo(transaccion.motivo)}</dd>
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
