import type { ReactNode } from 'react';

interface PropiedadesEstadoVacio {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: PropiedadesEstadoVacio) {
  return (
    <div className="rounded-lg border border-dashed border-borde bg-superficie p-8 text-center">
      <h2 className="text-base font-semibold text-texto">{titulo}</h2>
      {descripcion ? (
        <p className="mt-2 text-sm text-texto-suave">{descripcion}</p>
      ) : null}
      {accion ? <div className="mt-4 flex justify-center">{accion}</div> : null}
    </div>
  );
}
