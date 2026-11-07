import type { CodigoError } from '../../lib/reglas/errores';
import { ErrorDeNegocio } from '../../lib/reglas/errores';

export function esperarCodigo(fn: () => unknown, codigo: CodigoError): void {
  let error: unknown;

  try {
    fn();
  } catch (capturado) {
    error = capturado;
  }

  expect(error).toBeInstanceOf(ErrorDeNegocio);
  expect((error as ErrorDeNegocio).codigo).toBe(codigo);
}