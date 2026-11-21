import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/auth/sesion';

export default async function HomePage() {
  const sesion = await obtenerSesion();

  if (sesion) {
    redirect('/tiendas');
  }

  redirect('/login');
}

