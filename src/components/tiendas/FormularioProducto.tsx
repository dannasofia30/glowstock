'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { esquemaProducto } from '@/lib/validacion/esquemas';

interface ErroresFormulario {
  codigo?: string;
  nombre?: string;
  categoria?: string;
  precio?: string;
  stockMinimo?: string;
  general?: string;
}

export function FormularioProducto() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensajeExito, setMensajeExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrores({});
    setMensajeExito('');

    const datos = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      precio: precio === '' ? NaN : Number(precio),
      ...(stockMinimo.trim() === ''
        ? {}
        : { stockMinimo: Number(stockMinimo) }),
    };

    const validacion = esquemaProducto.safeParse(datos);

    if (!validacion.success) {
      const nuevosErrores: ErroresFormulario = {};
      for (const issue of validacion.error.issues) {
        const campo = issue.path[0];
        if (typeof campo === 'string' && !(campo in nuevosErrores)) {
          nuevosErrores[campo as keyof ErroresFormulario] = issue.message;
        }
      }
      if (Object.keys(nuevosErrores).length === 0) {
        nuevosErrores.general = 'Revise los datos ingresados.';
      }
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch('/api/tiendas/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacion.data),
      });

      const resultado = (await respuesta.json()) as {
        ok: boolean;
        datos?: { id: string; codigo: string };
        error?: { codigo?: string; mensaje?: string };
      };

      if (!respuesta.ok || !resultado.ok) {
        const codigoError = resultado.error?.codigo;
        const mensaje = resultado.error?.mensaje ?? 'No fue posible crear el producto.';
        if (codigoError === 'PRODUCTO_DUPLICADO') {
          setErrores({ codigo: mensaje, general: mensaje });
        } else {
          setErrores({ general: mensaje });
        }
        return;
      }

      setMensajeExito('Producto creado correctamente. Redirigiendo al inventario...');
      router.push('/tiendas');
      router.refresh();
    } catch {
      setErrores({ general: 'No fue posible conectar con el servidor.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta
      titulo="Nuevo producto"
      descripcion="Registra un producto en la red. Nacerá con existencias en 0 en las sucursales A, B y C."
    >
      <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
        {errores.general ? <Aviso tipo="error">{errores.general}</Aviso> : null}
        {mensajeExito ? <Aviso tipo="exito">{mensajeExito}</Aviso> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="codigo"
            etiqueta="Código"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            error={errores.codigo}
            required
            maxLength={40}
            autoComplete="off"
          />
          <Campo
            id="nombre"
            etiqueta="Nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            error={errores.nombre}
            required
            maxLength={160}
          />
          <Campo
            id="categoria"
            etiqueta="Categoría"
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
            error={errores.categoria}
            required
            maxLength={80}
          />
          <Campo
            id="precio"
            etiqueta="Precio (COP)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={precio}
            onChange={(evento) => setPrecio(evento.target.value)}
            error={errores.precio}
            ayuda="Ingresa el precio en pesos enteros."
            required
          />
          <Campo
            id="stockMinimo"
            etiqueta="Stock mínimo"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={stockMinimo}
            onChange={(evento) => setStockMinimo(evento.target.value)}
            error={errores.stockMinimo}
            ayuda="Valor entero mayor o igual a 0."
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Boton
            type="button"
            variante="secundario"
            onClick={() => router.push('/tiendas')}
            disabled={enviando}
          >
            Cancelar
          </Boton>
          <Boton type="submit" cargando={enviando}>
            Crear producto
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
