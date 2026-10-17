'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type ChangePasswordFormProps = {
  mode: 'request' | 'update' | 'change';
  initialEmail?: string;
  onCancel?: () => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChangePasswordForm({
  mode,
  initialEmail = '',
  onCancel,
}: ChangePasswordFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(mode === 'request');
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    if (mode === 'request') {
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        const client = getSupabaseBrowserClient();
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          if (isMounted) {
            setIsSessionReady(Boolean(session));
            setEmail(session?.user.email ?? '');
            setSessionError(
              session
                ? ''
                : mode === 'change'
                  ? 'Inicia sesión para cambiar tu contraseña.'
                  : 'El enlace no es válido o ha caducado. Solicita uno nuevo desde el inicio de sesión.',
            );
          }
        });
        unsubscribe = () => subscription.unsubscribe();
        if (mode === 'change') {
          return client.auth.getUser().then(({ data, error: userError }) => ({
            user: data.user,
            error: userError,
          }));
        }
        return client.auth.getSession().then(({ data, error: sessionLookupError }) => ({
          user: data.session?.user ?? null,
          error: sessionLookupError,
        }));
      })
      .then((result) => {
        if (!isMounted) {
          return;
        }

        if (!result) {
          return;
        }

        if (result.error) {
          setSessionError(
            mode === 'change'
              ? 'No fue posible verificar tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo.'
              : 'No fue posible verificar el enlace. Solicita uno nuevo desde el inicio de sesión.',
          );
        } else if (result.user) {
          setIsSessionReady(true);
          setEmail(result.user.email ?? '');
          setSessionError(
            mode === 'change' && !result.user.email
              ? 'No se encontró el correo de la cuenta. Vuelve a iniciar sesión.'
              : '',
          );
        } else {
          setSessionError(
            mode === 'change'
              ? 'Inicia sesión para cambiar tu contraseña.'
              : 'El enlace no es válido o ha caducado. Solicita uno nuevo desde el inicio de sesión.',
          );
        }
      })
      .catch((cause) => {
        if (isMounted) {
          setSessionError(
            cause instanceof Error
              ? cause.message
              : mode === 'change'
                ? 'No fue posible verificar tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo.'
                : 'No fue posible verificar el enlace. Solicita uno nuevo desde el inicio de sesión.',
          );
        }
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [mode]);

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!emailPattern.test(email.trim())) {
      setError('Ingresa un correo válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );

      if (requestError) {
        setError(`No se pudo enviar el enlace: ${requestError.message}`);
        return;
      }

      setEmailSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible conectar con el servicio de autenticación.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'change' && !currentPassword) {
      setError('Ingresa tu contraseña actual.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === 'change') {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user?.email) {
          setError('Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.');
          return;
        }

        const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
          email: data.user.email,
          password: currentPassword,
        });
        if (reauthenticationError) {
          setError('La contraseña actual es incorrecta.');
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(`No se pudo cambiar la contraseña: ${updateError.message}`);
        return;
      }

      setIsSessionReady(false);
      setEmailSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible conectar con el servicio de autenticación.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'request' ? 'Recuperar contraseña' : 'Cambiar contraseña';

  return (
    <main
      className={
        mode === 'change'
          ? 'mx-auto w-full max-w-2xl'
          : 'relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-8'
      }
    >
      {mode !== 'change' ? (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
      ) : null}

      <section
        className={`relative w-full rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-violet-950/40 backdrop-blur-sm sm:p-8 ${
          mode === 'change' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-violet-200 uppercase">
            GLOWSTOCK
          </div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {mode === 'request'
              ? 'Te enviaremos un enlace para crear una contraseña nueva.'
              : mode === 'change'
                ? 'Confirma tu contraseña actual y elige una nueva.'
                : 'Elige una contraseña nueva para tu cuenta.'}
          </p>
        </div>

        {emailSent ? (
          <div className="space-y-5 text-center">
            <p
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
              role="status"
            >
              {mode === 'request'
                ? 'Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.'
                : 'Tu contraseña se cambió correctamente.'}
            </p>
            <Link
              href={mode === 'change' ? '/' : '/login'}
              className="inline-block text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              {mode === 'change' ? 'Volver al sistema' : 'Volver al inicio de sesión'}
            </Link>
          </div>
        ) : mode === 'request' ? (
          <form className="space-y-5" onSubmit={handleRequestSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="recovery-email"
                className="block text-sm font-medium text-slate-200"
              >
                Correo electrónico
              </label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                placeholder="correo@empresa.com"
                aria-invalid={Boolean(error)}
              />
            </div>

            {error ? (
              <p
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
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
        ) : isSessionReady && !sessionError ? (
          <form className="space-y-5" onSubmit={handleUpdateSubmit} noValidate>
            {mode === 'change' ? (
              <div className="space-y-2">
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Contraseña actual
                </label>
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  aria-invalid={Boolean(error)}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-slate-200"
              >
                Nueva contraseña
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-200"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                aria-invalid={Boolean(error)}
              />
            </div>

            {error ? (
              <p
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        ) : (
          <p
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            role="alert"
          >
            {sessionError || (mode === 'change' ? 'Verificando tu sesión...' : 'Verificando el enlace de recuperación...')}
          </p>
        )}

        {mode === 'request' && onCancel ? (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}