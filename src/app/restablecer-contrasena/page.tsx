import Link from 'next/link';
import { FormularioRestablecimiento } from './FormularioRestablecimiento';

export default async function RestablecerContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const parametros = await searchParams;
  const token = typeof parametros.token === 'string' ? parametros.token : '';

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center">
          <h1 className="text-2xl font-bold">Enlace no válido</h1>
          <p className="mt-3 text-sm text-slate-300">
            El enlace no es válido o ya venció. Solicita uno nuevo para continuar.
          </p>
          <Link
            href="/recuperar-contrasena"
            className="mt-5 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Solicitar otro enlace
          </Link>
        </section>
      </main>
    );
  }

  return <FormularioRestablecimiento token={token} />;
}
