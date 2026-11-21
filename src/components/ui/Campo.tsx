import type { InputHTMLAttributes } from 'react';

interface PropiedadesCampo extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  etiqueta: string;
  error?: string | undefined;
  ayuda?: string | undefined;
}

export function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  className = '',
  ...resto
}: PropiedadesCampo) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descritoPor}
        className={[
          'w-full rounded-lg border bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-suave',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo',
          error ? 'border-critico' : 'border-borde',
          className,
        ].join(' ')}
        {...resto}
      />
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-texto-suave">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-xs font-medium text-critico" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
