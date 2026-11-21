'use client';

import { Aviso } from '@/components/ui/Aviso';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { ResultadoSolicitud as ResultadoSolicitudDatos } from '@/lib/datos/tipos';
import type { Sucursal } from '@/lib/reglas/costos';
import { formatearPesos } from '@/lib/formato';

interface PropiedadesResultadoSolicitud {
  resultado: ResultadoSolicitudDatos;
  solicitante: Sucursal;
  productoNombre: string;
}

function textoMotivo(motivo?: 'agotamiento_total' | 'sin_candidata_viable'): string {
  if (motivo === 'agotamiento_total') {
    return 'agotamiento total';
  }
  if (motivo === 'sin_candidata_viable') {
    return 'sin candidata viable';
  }
  return 'no especificado';
}

export function ResultadoSolicitud({
  resultado,
  solicitante,
  productoNombre,
}: PropiedadesResultadoSolicitud) {
  const { decision, stock, critico } = resultado;
  const stockTotal = stock.A + stock.B + stock.C;

  return (
    <div className="space-y-4" aria-live="polite">
      {decision.accion === 'venta_local' ? (
        <Aviso tipo="exito" titulo="Venta local">
          <div className="space-y-2">
            <Insignia tono="local">Venta local</Insignia>
            <p>Venta realizada en la sucursal {solicitante}.</p>
          </div>
        </Aviso>
      ) : null}

      {decision.accion === 'transferencia' ? (
        <Aviso tipo="info" titulo="Transferencia inter-tiendas">
          <div className="space-y-2">
            <Insignia tono="transferencia">Transferencia</Insignia>
            <p>
              Transferencia autorizada desde la sucursal {decision.origen ?? 'N/D'} a la{' '}
              {solicitante}. Costo de envío: {formatearPesos(decision.costoTotal ?? 0)}.
            </p>
            <p className="text-xs opacity-90">
              Costo unitario: {formatearPesos(decision.costoUnitario ?? 0)} · Cantidad:{' '}
              {decision.costoUnitario ? Math.round((decision.costoTotal ?? 0) / decision.costoUnitario) : 0}
            </p>
          </div>
        </Aviso>
      ) : null}

      {decision.accion === 'orden_proveedor' ? (
        <Aviso tipo="advertencia" titulo="Producto por reponer">
          <div className="space-y-2">
            <Insignia tono="proveedor">Orden al proveedor</Insignia>
            <p>
              Producto por reponer en la red. Se generó una orden de 50 unidades al proveedor
              para la sucursal {solicitante}.
            </p>
            <p>
              Motivo:{' '}
              <strong>
                {decision.motivo === 'agotamiento_total'
                  ? 'agotamiento total'
                  : 'sin candidata viable'}
              </strong>
              {decision.motivo === 'agotamiento_total'
                ? ' (la red no tiene suficiente stock en total).'
                : ' (hay stock en la red, pero ninguna sucursal puede transferir sin romper el stock de seguridad).'}
            </p>
          </div>
        </Aviso>
      ) : null}

      {critico ? (
        <Aviso tipo="error" titulo="Estado crítico">
          <p>
            El producto {productoNombre} quedó en estado crítico (total en la red: {stockTotal}{' '}
            unidades).
          </p>
        </Aviso>
      ) : null}

      <Tarjeta titulo="Stock resultante por sucursal">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-fondo p-3">
            <dt className="text-texto-suave">Sucursal A</dt>
            <dd className="text-lg font-semibold text-texto">{stock.A}</dd>
          </div>
          <div className="rounded-lg bg-fondo p-3">
            <dt className="text-texto-suave">Sucursal B</dt>
            <dd className="text-lg font-semibold text-texto">{stock.B}</dd>
          </div>
          <div className="rounded-lg bg-fondo p-3">
            <dt className="text-texto-suave">Sucursal C</dt>
            <dd className="text-lg font-semibold text-texto">{stock.C}</dd>
          </div>
          <div className="rounded-lg border border-borde bg-primario-suave p-3">
            <dt className="font-medium text-primario">Total red</dt>
            <dd className="text-lg font-bold text-primario">{stockTotal}</dd>
          </div>
        </dl>
      </Tarjeta>
    </div>
  );
}
