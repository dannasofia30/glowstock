import Link from 'next/link';
import { FormularioProducto } from '@/components/tiendas/FormularioProducto';

export default function PaginaNuevoProducto() {
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
      <FormularioProducto />
    </div>
  );
}
