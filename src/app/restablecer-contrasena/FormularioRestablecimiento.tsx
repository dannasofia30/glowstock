'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function FormularioRestablecimiento({ token }: { token: string }) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const respuesta = await fetch('/api/auth/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, contrasena, confirmacion }),
      });
      const resultado: { error?: string } = await respuesta.json();

      if (!respuesta.ok) {
        setError(resultado.error ?? 'No se pudo actualizar la contraseña.');
        return;
      }

      router.push('/login?restablecida=1');
    } catch {
      setError('No fue posible conectar con el servicio. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-8">
      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-violet-950/40 backdrop-blur-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-violet-200 uppercase">
            GLOWSTOCK
          </div>
          <h1 className="text-3xl font-bold text-white">Crear nueva contraseña</h1>
          <p className="mt-2 text-sm text-slate-300">
            Elige una contraseña de al menos 8 caracteres.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="contrasena-nueva" className="block text-sm font-medium text-slate-200">
              Nueva contraseña
            </label>
            <input
              id="contrasena-nueva"
              name="contrasena"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmacion-contrasena" className="block text-sm font-medium text-slate-200">
              Confirmar contraseña
            </label>
            <input
              id="confirmacion-contrasena"
              name="confirmacion"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}
