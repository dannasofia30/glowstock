import type { SelectHTMLAttributes } from 'react';

interface OpcionSelector {
  valor: string;
  etiqueta: string;
}

interface PropiedadesSelector extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  etiqueta: string;
  opciones: OpcionSelector[];
  error?: string | undefined;
  ayuda?: string | undefined;
  placeholder?: string | undefined;
}

export function Selector({
  id,
  etiqueta,
  opciones,
  error,
  ayuda,
  placeholder,
  className = '',
  children,
  ...resto
}: PropiedadesSelector) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {etiqueta}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descritoPor}
        className={[
          'w-full rounded-lg border bg-superficie px-3 py-2 text-sm text-texto',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo',
          error ? 'border-critico' : 'border-borde',
          className,
        ].join(' ')}
        {...resto}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
        {children}
      </select>
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
