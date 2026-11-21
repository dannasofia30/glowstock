import { exigirSesion } from '@/lib/auth/sesion';
import { recibirOrden } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await exigirSesion();

    const { id } = await params;
    const idNumero = Number(id);
    if (!Number.isInteger(idNumero) || idNumero <= 0) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }

    const orden = await recibirOrden(idNumero);
    return responderOk(orden);
  },
);
