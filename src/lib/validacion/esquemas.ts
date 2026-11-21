import { z } from 'zod';
import { SUCURSALES } from '@/lib/config/intertiendas';

export const esquemaSucursal = z.enum(SUCURSALES);

export const esquemaProducto = z.object({
  codigo: z.string().trim().min(1).max(40),
  nombre: z.string().trim().min(1).max(160),
  categoria: z.string().trim().min(1).max(80),
  precio: z.number().int().min(1),
  stockMinimo: z.number().int().min(0).optional(),
});

export type DatosProductoEntrada = z.infer<typeof esquemaProducto>;

export const esquemaEntrada = z.object({
  sucursal: esquemaSucursal,
  cantidad: z.number().int().min(1),
});

export type DatosEntrada = z.infer<typeof esquemaEntrada>;

export const esquemaSolicitud = z.object({
  codigo: z.string().trim().min(1),
  solicitante: esquemaSucursal,
  cantidad: z.number().int().min(1),
});

export type DatosSolicitud = z.infer<typeof esquemaSolicitud>;

export const esquemaTransferencia = z
  .object({
    codigo: z.string().trim().min(1),
    origen: esquemaSucursal,
    destino: esquemaSucursal,
    cantidad: z.number().int().min(1),
  })
  .refine((datos) => datos.origen !== datos.destino, {
    message: 'El origen y el destino deben ser diferentes.',
    path: ['destino'],
  });

export type DatosTransferencia = z.infer<typeof esquemaTransferencia>;

export const esquemaFiltrosInventario = z.object({
  categoria: z.string().trim().min(1).optional(),
  soloCriticos: z.boolean().optional(),
});

export const esquemaFiltrosTransacciones = z.object({
  productoCodigo: z.string().trim().min(1).optional(),
  tipo: z.string().trim().min(1).optional(),
  sucursal: esquemaSucursal.optional(),
  desde: z.string().trim().min(1).optional(),
  hasta: z.string().trim().min(1).optional(),
});

export const esquemaFiltrosOrdenes = z.object({
  estado: z.string().trim().min(1).optional(),
});

export const esquemaInforme = z.object({
  desde: z.string().trim().min(1),
  hasta: z.string().trim().min(1),
});
