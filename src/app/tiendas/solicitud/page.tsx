import Link from 'next/link';
import { listarInventario } from '@/lib/dataService';
import { FormularioSolicitud } from '@/components/tiendas/FormularioSolicitud';
import { EstadoVacio } from '@/components/ui/EstadoVacio';

export const dynamic = 'force-dynamic';

export default async function PaginaSolicitudTiendas() {
  const productos = await listarInventario();
  const opciones = productos.map((producto) => ({
    codigo: producto.codigo,
    nombre: producto.nombre,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-texto">Solicitud de compra</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Procese una solicitud en una sucursal y consulte si se resuelve con venta local,
          transferencia inter-tiendas u orden al proveedor.
        </p>
      </div>

      {opciones.length === 0 ? (
        <EstadoVacio
          titulo="No hay productos disponibles"
          descripcion="Debe registrar al menos un producto antes de procesar solicitudes."
          accion={
            <Link
              href="/tiendas/productos/nuevo"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
            >
              Nuevo producto
            </Link>
          }
        />
      ) : (
        <FormularioSolicitud productos={opciones} />
      )}
    </div>
  );
}
