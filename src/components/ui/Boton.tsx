import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface PropiedadesBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  cargando?: boolean;
  children: ReactNode;
}

const estilosVariante: Record<VarianteBoton, string> = {
  primario: 'border-transparent bg-primario text-white hover:brightness-110',
  secundario: 'border-borde bg-primario-suave text-primario hover:brightness-95',
  peligro: 'border-transparent bg-critico text-white hover:brightness-110',
  fantasma: 'border-borde bg-transparent text-texto hover:bg-primario-suave',
};

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...resto
}: PropiedadesBoton) {
  const deshabilitado = disabled || cargando;

  return (
    <button
      type={type}
      disabled={deshabilitado}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo',
        'disabled:cursor-not-allowed disabled:opacity-60',
        estilosVariante[variante],
        className,
      ].join(' ')}
      {...resto}
    >
      {cargando ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : null}
      <span>{cargando ? 'Cargando...' : children}</span>
    </button>
  );
}
