import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { NavegacionTiendas } from '@/components/tiendas/NavegacionTiendas';
import { obtenerSesion } from '@/lib/auth/sesion';

export default async function LayoutTiendas({
  children,
}: {
  children: ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-fondo text-texto">
      <NavegacionTiendas correo={sesion.email} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
