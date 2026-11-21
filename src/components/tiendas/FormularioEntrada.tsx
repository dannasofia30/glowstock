'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SUCURSALES } from '@/lib/config/intertiendas';
import { esquemaEntrada } from '@/lib/validacion/esquemas';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { Tarjeta } from '@/components/ui/Tarjeta';

interface PropiedadesFormularioEntrada {
  codigo: string;
}

export function FormularioEntrada({ codigo }: PropiedadesFormularioEntrada) {
  const router = useRouter();
  const [sucursal, setSucursal] = useState<'A' | 'B' | 'C'>('A');
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError('');
    setExito('');

    const datos = {
      sucursal,
      cantidad: cantidad === '' ? NaN : Number(cantidad),
    };

    const validacion = esquemaEntrada.safeParse(datos);
    if (!validacion.success) {
      setError('Ingresa una sucursal válida y una cantidad entera mayor que 0.');
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch(
        `/api/tiendas/productos/${encodeURIComponent(codigo)}/entrada`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validacion.data),
        },
      );

      const resultado = (await respuesta.json()) as {
        ok: boolean;
        error?: { mensaje?: string };
      };

      if (!respuesta.ok || !resultado.ok) {
        setError(resultado.error?.mensaje ?? 'No fue posible registrar la entrada.');
        return;
      }

      setExito(`Entrada registrada en la sucursal ${validacion.data.sucursal}.`);
      setCantidad('');
      router.refresh();
    } catch {
      setError('No fue posible conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta
      titulo="Ingresar stock"
      descripcion="Registra una entrada de existencias para una sucursal."
    >
      <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        {exito ? <Aviso tipo="exito">{exito}</Aviso> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            id="sucursal-entrada"
            etiqueta="Sucursal"
            value={sucursal}
            onChange={(evento) => setSucursal(evento.target.value as 'A' | 'B' | 'C')}
            opciones={SUCURSALES.map((item) => ({ valor: item, etiqueta: `Sucursal ${item}` }))}
          />
          <Campo
            id="cantidad-entrada"
            etiqueta="Cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={cantidad}
            onChange={(evento) => setCantidad(evento.target.value)}
            required
          />
        </div>

        <div className="flex justify-end">
          <Boton type="submit" cargando={enviando}>
            Registrar entrada
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
