import { exigirSesion } from '@/lib/auth/sesion';
import { transferenciaManual } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaTransferencia } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const cuerpo = await leerCuerpo(request);
  const datos = esquemaTransferencia.parse(cuerpo);
  const resultado = await transferenciaManual({
    codigo: datos.codigo,
    origen: datos.origen,
    destino: datos.destino,
    cantidad: datos.cantidad,
  });

  return responderOk(resultado);
});
