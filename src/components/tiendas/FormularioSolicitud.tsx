'use client';

import { useMemo, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Aviso } from '@/components/ui/Aviso';
import { ResultadoSolicitud } from '@/components/tiendas/ResultadoSolicitud';
import { SUCURSALES } from '@/lib/config/intertiendas';
import type { ResultadoSolicitud as ResultadoSolicitudDatos } from '@/lib/datos/tipos';
import type { Sucursal } from '@/lib/reglas/costos';

interface ProductoOpcion {
  codigo: string;
  nombre: string;
}

interface PropiedadesFormularioSolicitud {
  productos: ProductoOpcion[];
}

interface RespuestaApi<T> {
  ok: boolean;
  datos?: T;
  error?: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}

export function FormularioSolicitud({ productos }: PropiedadesFormularioSolicitud) {
  const [codigo, setCodigo] = useState('');
  const [solicitante, setSolicitante] = useState<Sucursal>('A');
  const [cantidad, setCantidad] = useState('1');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoSolicitudDatos | null>(null);
  const [contextoResultado, setContextoResultado] = useState<{
    solicitante: Sucursal;
    productoNombre: string;
  } | null>(null);

  const opcionesProductos = useMemo(
    () =>
      productos.map((producto) => ({
        valor: producto.codigo,
        etiqueta: `${producto.nombre} (${producto.codigo})`,
      })),
    [productos],
  );

  const opcionesSucursales = useMemo(
    () =>
      SUCURSALES.map((sucursal) => ({
        valor: sucursal,
        etiqueta: `Sucursal ${sucursal}`,
      })),
    [],
  );

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setResultado(null);

    const cantidadNumero = Number(cantidad);
    if (!codigo) {
      setError('Seleccione un producto.');
      return;
    }
    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      setError('La cantidad debe ser un número entero mayor que 0.');
      return;
    }

    const producto = productos.find((item) => item.codigo === codigo);
    setEnviando(true);
    try {
      const respuesta = await fetch('/api/tiendas/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          solicitante,
          cantidad: cantidadNumero,
        }),
      });
      const json = (await respuesta.json()) as RespuestaApi<ResultadoSolicitudDatos>;

      if (!respuesta.ok || !json.ok || !json.datos) {
        setError(json.error?.mensaje ?? 'No se pudo procesar la solicitud.');
        return;
      }

      setResultado(json.datos);
      setContextoResultado({
        solicitante,
        productoNombre: producto?.nombre ?? codigo,
      });
    } catch {
      setError('Ocurrió un error de conexión al procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tarjeta
        titulo="Procesar solicitud de compra"
        descripcion="Seleccione el producto, la sucursal solicitante y la cantidad. El sistema decidirá si la venta es local, si requiere transferencia o si se debe generar una orden al proveedor."
      >
        <form className="space-y-4" onSubmit={enviar}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              id="producto-solicitud"
              etiqueta="Producto"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              opciones={opcionesProductos}
              placeholder="Seleccione un producto"
              required
            />
            <Selector
              id="sucursal-solicitante"
              etiqueta="Sucursal solicitante"
              value={solicitante}
              onChange={(evento) => setSolicitante(evento.target.value as Sucursal)}
              opciones={opcionesSucursales}
              required
            />
          </div>
          <div className="max-w-xs">
            <Campo
              id="cantidad-solicitud"
              etiqueta="Cantidad"
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(evento) => setCantidad(evento.target.value)}
              required
            />
          </div>

          {error ? <Aviso tipo="error">{error}</Aviso> : null}

          <div className="flex flex-wrap gap-3">
            <Boton type="submit" cargando={enviando}>
              Procesar solicitud
            </Boton>
            {resultado ? (
              <Boton
                variante="secundario"
                type="button"
                onClick={() => {
                  setResultado(null);
                  setContextoResultado(null);
                  setError(null);
                }}
              >
                Nueva solicitud
              </Boton>
            ) : null}
          </div>
        </form>
      </Tarjeta>

      {resultado && contextoResultado ? (
        <ResultadoSolicitud
          resultado={resultado}
          solicitante={contextoResultado.solicitante}
          productoNombre={contextoResultado.productoNombre}
        />
      ) : null}
    </div>
  );
}
