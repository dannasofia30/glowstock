'use client';

import { useEffect, type ReactNode } from 'react';
import { Boton } from './Boton';

interface PropiedadesModal {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
  acciones?: ReactNode;
}

export function Modal({
  abierto,
  titulo,
  children,
  onCerrar,
  acciones,
}: PropiedadesModal) {
  useEffect(() => {
    if (!abierto) {
      return;
    }

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };

    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto/40 p-4"
      role="presentation"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="w-full max-w-lg rounded-lg border border-borde bg-superficie p-5 text-texto shadow-xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <Boton variante="fantasma" onClick={onCerrar} aria-label="Cerrar modal">
            Cerrar
          </Boton>
        </div>
        <div className="text-sm text-texto">{children}</div>
        {acciones ? <div className="mt-5 flex justify-end gap-2">{acciones}</div> : null}
      </div>
    </div>
  );
}
