import type { HTMLAttributes, ReactNode } from 'react';

type TonoInsignia = 'neutro' | 'local' | 'transferencia' | 'proveedor' | 'critico';

interface PropiedadesInsignia extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoInsignia;
  children: ReactNode;
}

const estilosTono: Record<TonoInsignia, string> = {
  neutro: 'border-borde bg-fondo text-texto',
  local: 'border-transparent bg-local/15 text-local',
  transferencia: 'border-transparent bg-transferencia/15 text-transferencia',
  proveedor: 'border-transparent bg-proveedor/15 text-proveedor',
  critico: 'border-transparent bg-critico/15 text-critico',
};

export function Insignia({
  tono = 'neutro',
  className = '',
  children,
  ...resto
}: PropiedadesInsignia) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        estilosTono[tono],
        className,
      ].join(' ')}
      {...resto}
    >
      {children}
    </span>
  );
}
