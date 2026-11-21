import { ZONA_HORARIA } from '@/lib/config/intertiendas';

const formateadorPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const formateadorFecha = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatearPesos(valor: number): string {
  return formateadorPesos.format(valor);
}

export function formatearFecha(valor: string | number | Date): string {
  const fecha = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return formateadorFecha.format(fecha);
}
