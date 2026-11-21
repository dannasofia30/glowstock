import type { HTMLAttributes, ReactNode } from 'react';

type TipoAviso = 'info' | 'exito' | 'advertencia' | 'error';

interface PropiedadesAviso extends HTMLAttributes<HTMLDivElement> {
  tipo?: TipoAviso;
  titulo?: string;
  children: ReactNode;
}

const estilosTipo: Record<TipoAviso, string> = {
  info: 'border-transferencia/30 bg-transferencia/10 text-transferencia',
  exito: 'border-local/30 bg-local/10 text-local',
  advertencia: 'border-proveedor/30 bg-proveedor/10 text-proveedor',
  error: 'border-critico/30 bg-critico/10 text-critico',
};

export function Aviso({
  tipo = 'info',
  titulo,
  className = '',
  children,
  ...resto
}: PropiedadesAviso) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={[
        'rounded-lg border px-4 py-3 text-sm',
        estilosTipo[tipo],
        className,
      ].join(' ')}
      {...resto}
    >
      {titulo ? <p className="mb-1 font-semibold">{titulo}</p> : null}
      <div className="text-current">{children}</div>
    </div>
  );
}
