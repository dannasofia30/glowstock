import { exigirSesion } from '@/lib/auth/sesion';
import { obtenerInforme } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaInforme } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const url = new URL(request.url);
  const desde = url.searchParams.get('desde')?.trim() || '';
  const hasta = url.searchParams.get('hasta')?.trim() || '';

  const filtros = esquemaInforme.parse({ desde, hasta });
  const informe = await obtenerInforme(filtros.desde, filtros.hasta);

  return responderOk(informe);
});
