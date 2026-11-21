'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface PropiedadesNavegacionTiendas {
  correo?: string;
}

const enlaces = [
  { href: '/tiendas', etiqueta: 'Inventario' },
  { href: '/tiendas/solicitud', etiqueta: 'Solicitud' },
  { href: '/tiendas/historial', etiqueta: 'Historial' },
  { href: '/tiendas/transferencia', etiqueta: 'Transferencia' },
  { href: '/tiendas/ordenes', etiqueta: 'Órdenes' },
  { href: '/tiendas/informe', etiqueta: 'Informe' },
];

function claseEnlace(activo: boolean): string {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-primario',
    activo
      ? 'bg-white/20 text-white'
      : 'text-white/90 hover:bg-white/10 hover:text-white',
  ].join(' ');
}

export function NavegacionTiendas({ correo }: PropiedadesNavegacionTiendas) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Se limpia la cookie local aunque falle el cierre remoto.
    } finally {
      const seguro = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `tiendas_access_token=; Path=/; Max-Age=0; SameSite=Lax${seguro}`;
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="border-b border-borde/30 bg-primario text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/tiendas"
            className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primario rounded"
          >
            Inter-Tiendas
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {enlaces.map((enlace) => {
            const activo =
              enlace.href === '/tiendas'
                ? pathname === '/tiendas'
                : pathname.startsWith(enlace.href);
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={claseEnlace(activo)}
              >
                {enlace.etiqueta}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {correo ? <span className="text-xs text-white/80">{correo}</span> : null}
          <Boton
            variante="fantasma"
            onClick={cerrarSesion}
            cargando={cerrando}
            className="border-white/30 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-primario"
          >
            Cerrar sesión
          </Boton>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-lg border border-white/30 px-3 py-2 text-sm font-medium md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primario"
          aria-expanded={menuAbierto}
          aria-controls="menu-movil-tiendas"
          onClick={() => setMenuAbierto((valor) => !valor)}
        >
          {menuAbierto ? 'Cerrar menú' : 'Menú'}
        </button>
      </div>

      {menuAbierto ? (
        <div
          id="menu-movil-tiendas"
          className="border-t border-white/20 px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {enlaces.map((enlace) => {
              const activo =
                enlace.href === '/tiendas'
                  ? pathname === '/tiendas'
                  : pathname.startsWith(enlace.href);
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className={claseEnlace(activo)}
                  onClick={() => setMenuAbierto(false)}
                >
                  {enlace.etiqueta}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
            {correo ? <span className="text-xs text-white/80">{correo}</span> : null}
            <Boton
              variante="fantasma"
              onClick={cerrarSesion}
              cargando={cerrando}
              className="w-full border-white/30 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-primario"
            >
              Cerrar sesión
            </Boton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
