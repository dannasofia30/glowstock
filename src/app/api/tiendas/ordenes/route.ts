import { exigirSesion } from '@/lib/auth/sesion';
import { listarOrdenes } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosOrdenes } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const url = new URL(request.url);
  const estado = url.searchParams.get('estado')?.trim() || undefined;
  const filtros = esquemaFiltrosOrdenes.parse({
    ...(estado ? { estado } : {}),
  });

  const ordenes = await listarOrdenes(filtros.estado ? { estado: filtros.estado } : undefined);
  return responderOk(ordenes);
});
