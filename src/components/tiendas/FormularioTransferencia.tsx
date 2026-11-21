'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUCURSALES } from '@/lib/config/intertiendas';
import type { Sucursal } from '@/lib/reglas/costos';
import { formatearPesos } from '@/lib/formato';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';

interface ProductoOpcion {
  codigo: string;
  nombre: string;
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

interface ResultadoTransferencia {
  stock: Record<Sucursal, number>;
  costoLogistico: number;
}

export function FormularioTransferencia({ productos }: { productos: ProductoOpcion[] }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [origen, setOrigen] = useState<Sucursal>('A');
  const [destino, setDestino] = useState<Sucursal>('B');
  const [cantidad, setCantidad] = useState('1');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoTransferencia | null>(null);

  const opcionesProductos = useMemo(
    () =>
      productos.map((producto) => ({
        valor: producto.codigo,
        etiqueta: `${producto.nombre} (${producto.codigo})`,
      })),
    [productos],
  );

  const opcionesSucursales = useMemo(
    () => SUCURSALES.map((sucursal) => ({ valor: sucursal, etiqueta: `Sucursal ${sucursal}` })),
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
    if (origen === destino) {
      setError('El origen y el destino deben ser diferentes.');
      return;
    }
    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      setError('La cantidad debe ser un número entero mayor que 0.');
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch('/api/tiendas/transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, origen, destino, cantidad: cantidadNumero }),
      });
      const json = (await respuesta.json()) as RespuestaApi<ResultadoTransferencia>;

      if (!respuesta.ok || !json.ok || !json.datos) {
        setError(json.error?.mensaje ?? 'No se pudo realizar la transferencia.');
        return;
      }

      setResultado(json.datos);
      router.refresh();
    } catch {
      setError('Ocurrió un error de conexión al realizar la transferencia.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tarjeta
        titulo="Transferencia manual"
        descripcion="Mueva stock entre sucursales. El origen debe conservar al menos 5 unidades después de transferir."
      >
        <form className="space-y-4" onSubmit={enviar}>
          <Selector
            id="producto-transferencia"
            etiqueta="Producto"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            opciones={opcionesProductos}
            placeholder="Seleccione un producto"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              id="origen-transferencia"
              etiqueta="Sucursal origen"
              value={origen}
              onChange={(evento) => setOrigen(evento.target.value as Sucursal)}
              opciones={opcionesSucursales}
              required
            />
            <Selector
              id="destino-transferencia"
              etiqueta="Sucursal destino"
              value={destino}
              onChange={(evento) => setDestino(evento.target.value as Sucursal)}
              opciones={opcionesSucursales}
              required
            />
          </div>
          <div className="max-w-xs">
            <Campo
              id="cantidad-transferencia"
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

          <Boton type="submit" cargando={enviando}>
            Realizar transferencia
          </Boton>
        </form>
      </Tarjeta>

      {resultado ? (
        <div className="space-y-4" aria-live="polite">
          <Aviso tipo="exito" titulo="Transferencia realizada">
            <p>
              Se transfirieron unidades de la sucursal {origen} a la sucursal {destino}. Costo
              logístico: <strong>{formatearPesos(resultado.costoLogistico)}</strong>.
            </p>
          </Aviso>
          <Tarjeta titulo="Stock resultante por sucursal">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-fondo p-3">
                <dt className="text-texto-suave">Sucursal A</dt>
                <dd className="text-lg font-semibold text-texto">{resultado.stock.A}</dd>
              </div>
              <div className="rounded-lg bg-fondo p-3">
                <dt className="text-texto-suave">Sucursal B</dt>
                <dd className="text-lg font-semibold text-texto">{resultado.stock.B}</dd>
              </div>
              <div className="rounded-lg bg-fondo p-3">
                <dt className="text-texto-suave">Sucursal C</dt>
                <dd className="text-lg font-semibold text-texto">{resultado.stock.C}</dd>
              </div>
              <div className="rounded-lg border border-borde bg-primario-suave p-3">
                <dt className="font-medium text-primario">Total red</dt>
                <dd className="text-lg font-bold text-primario">
                  {resultado.stock.A + resultado.stock.B + resultado.stock.C}
                </dd>
              </div>
            </dl>
          </Tarjeta>
        </div>
      ) : null}
    </div>
  );
}
