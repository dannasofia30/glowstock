'use client';

import { FormEvent, useState } from 'react';

export function FormularioPruebaCorreo() {
  const [para, setPara] = useState('danna.osorio02@usa.edu.co');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/correo/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ para }),
      });
      const resultado: { error?: string } = await response.json();

      if (!response.ok) {
        setMensaje(resultado.error ?? 'No se pudo enviar el correo.');
        return;
      }

      setMensaje('Correo enviado');
    } catch {
      setMensaje('No fue posible conectar con el servicio de correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold">Prueba de correo</h1>
        <p className="mt-2 text-sm text-slate-300">
          Envía un correo de prueba usando Resend.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="correo-destino" className="block text-sm font-medium text-slate-200">
              Correo de destino
            </label>
            <input
              id="correo-destino"
              name="para"
              type="email"
              autoComplete="email"
              required
              value={para}
              onChange={(event) => setPara(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar prueba'}
          </button>
        </form>

        {mensaje ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              mensaje === 'Correo enviado'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
            role={mensaje === 'Correo enviado' ? 'status' : 'alert'}
          >
            {mensaje}
          </p>
        ) : null}
      </section>
    </main>
  );
}
