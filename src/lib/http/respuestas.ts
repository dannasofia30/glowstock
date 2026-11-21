import { ZodError } from 'zod';
import { ESTADO_HTTP, ErrorDeNegocio, MENSAJES } from '@/lib/reglas/errores';

const CABECERAS_JSON = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function respuestaJson(cuerpo: unknown, estado: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: CABECERAS_JSON,
  });
}

export function responderOk(datos: unknown, estado = 200): Response {
  return respuestaJson({ ok: true, datos }, estado);
}

function traducirErrorPg(error: unknown): { codigo: keyof typeof ESTADO_HTTP; estado: number } | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidato = error as { code?: string; constraint?: string };
  const codigo = candidato.code;
  const restriccion = candidato.constraint;

  if (codigo === '23505' && restriccion === 'productos_codigo_unico') {
    return { codigo: 'PRODUCTO_DUPLICADO', estado: ESTADO_HTTP.PRODUCTO_DUPLICADO };
  }

  if (codigo === '23505' && restriccion === 'existencias_unica') {
    return { codigo: 'ERROR_INTERNO', estado: ESTADO_HTTP.ERROR_INTERNO };
  }

  if (codigo === '23503') {
    return { codigo: 'TIENE_DEPENDENCIAS', estado: ESTADO_HTTP.TIENE_DEPENDENCIAS };
  }

  if (codigo === '23514' && restriccion === 'existencias_cantidad_no_neg') {
    return { codigo: 'CANTIDAD_INSUFICIENTE', estado: ESTADO_HTTP.CANTIDAD_INSUFICIENTE };
  }

  if (codigo === '23514') {
    return { codigo: 'DATOS_INVALIDOS', estado: ESTADO_HTTP.DATOS_INVALIDOS };
  }

  return null;
}

export function responderError(error: unknown): Response {
  if (error instanceof ErrorDeNegocio) {
    return respuestaJson(
      {
        ok: false,
        error: {
          codigo: error.codigo,
          mensaje: error.message,
          detalles: error.detalles ?? null,
        },
      },
      ESTADO_HTTP[error.codigo],
    );
  }

  if (error instanceof ZodError) {
    return respuestaJson(
      {
        ok: false,
        error: {
          codigo: 'DATOS_INVALIDOS',
          mensaje: MENSAJES.DATOS_INVALIDOS,
          detalles: error.flatten(),
        },
      },
      400,
    );
  }

  const errorPg = traducirErrorPg(error);
  if (errorPg) {
    if (errorPg.codigo === 'ERROR_INTERNO') {
      console.error(error);
    }
    return respuestaJson(
      {
        ok: false,
        error: {
          codigo: errorPg.codigo,
          mensaje: MENSAJES[errorPg.codigo],
          detalles: null,
        },
      },
      errorPg.estado,
    );
  }

  console.error(error);
  return respuestaJson(
    {
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: MENSAJES.ERROR_INTERNO,
        detalles: null,
      },
    },
    500,
  );
}

export function conManejoDeErrores<T extends unknown[]>(
  manejador: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await manejador(...args);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}
