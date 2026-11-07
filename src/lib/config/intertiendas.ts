export const SUCURSALES = ['A', 'B', 'C'] as const;
export const STOCK_SEGURIDAD = 5;
export const LOTE_PROVEEDOR = 50;
export const REORDEN_GLOBAL = 10;

export const COSTOS: Record<string, number> = {
  'A-B': 2000,
  'B-A': 2000,
  'B-C': 1500,
  'C-B': 1500,
  'A-C': 3500,
  'C-A': 3500,
};

export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;