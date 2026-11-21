import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MENSAJES } from '@/lib/reglas/errores';

const COOKIE_SESION = 'tiendas_access_token';

function respuestaNoAutorizada() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        codigo: 'NO_AUTORIZADO',
        mensaje: MENSAJES.NO_AUTORIZADO,
        detalles: null,
      },
    },
    {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export function proxy(request: NextRequest) {
  const tieneSesion = Boolean(request.cookies.get(COOKIE_SESION)?.value);
  const { pathname } = request.nextUrl;

  if (tieneSesion) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/tiendas')) {
    return respuestaNoAutorizada();
  }

  const urlLogin = new URL('/login', request.url);
  urlLogin.searchParams.set('siguiente', pathname);
  return NextResponse.redirect(urlLogin);
}

export const config = {
  matcher: ['/tiendas/:path*', '/api/tiendas/:path*'],
};
