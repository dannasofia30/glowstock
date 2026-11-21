import { exigirSesion } from '@/lib/auth/sesion';
import { obtenerProducto } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(
  async (_request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    await exigirSesion();

    const { codigo } = await params;
    const producto = await obtenerProducto(decodeURIComponent(codigo));

    return responderOk(producto);
  },
);
