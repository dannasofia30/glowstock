'use client';

import { FormEvent, useState } from 'react';

export function FormularioRecuperacion() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje('');
    setError('');
    setIsSubmitting(true);

    try {
      const respuesta = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resultado: { message?: string; error?: string } = await respuesta.json();
      if (!respuesta.ok) {
        setError(resultado.error ?? 'No se pudo procesar la solicitud.');
        return;
      }

      setMensaje(
        resultado.message ??
          'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
      );
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
          <h1 className="text-3xl font-bold text-white">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-300">
            Si la cuenta existe, enviaremos un enlace para restablecerla.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email-recuperacion" className="block text-sm font-medium text-slate-200">
              Correo electrónico
            </label>
            <input
              id="email-recuperacion"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="correo@empresa.com"
            />
          </div>

          {mensaje ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" role="status">
              {mensaje}
            </p>
          ) : null}
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
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="mt-5 text-center">
          <a href="/login" className="text-sm font-medium text-violet-300 transition hover:text-violet-200">
            Volver al inicio de sesión
          </a>
        </p>
      </section>
    </main>
  );
}
