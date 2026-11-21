import type { HTMLAttributes, ReactNode } from 'react';

interface PropiedadesTarjeta extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  titulo?: string;
  descripcion?: string;
}

export function Tarjeta({
  children,
  titulo,
  descripcion,
  className = '',
  ...resto
}: PropiedadesTarjeta) {
  return (
    <section
      className={[
        'rounded-lg border border-borde bg-superficie p-4 text-texto shadow-sm',
        className,
      ].join(' ')}
      {...resto}
    >
      {titulo ? (
        <header className="mb-3">
          <h2 className="text-base font-semibold text-texto">{titulo}</h2>
          {descripcion ? (
            <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
