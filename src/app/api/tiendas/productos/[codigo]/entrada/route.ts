import { exigirSesion } from '@/lib/auth/sesion';
import { registrarEntrada } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaEntrada } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(
  async (request: Request, { params }: { params: Promise<{ codigo: string }> }) => {
    await exigirSesion();

    const { codigo } = await params;
    const cuerpo = await leerCuerpo(request);
    const datos = esquemaEntrada.parse(cuerpo);
    const resultado = await registrarEntrada(
      decodeURIComponent(codigo),
      datos.sucursal,
      datos.cantidad,
    );

    return responderOk(resultado, 201);
  },
);
