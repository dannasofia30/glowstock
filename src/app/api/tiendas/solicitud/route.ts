import { exigirSesion } from '@/lib/auth/sesion';
import { procesarSolicitud } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaSolicitud } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const cuerpo = await leerCuerpo(request);
  const datos = esquemaSolicitud.parse(cuerpo);
  const resultado = await procesarSolicitud(datos);

  return responderOk(resultado);
});
