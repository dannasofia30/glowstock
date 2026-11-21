import type { Sucursal } from '@/lib/reglas/costos';
import type { Decision } from '@/lib/reglas/solicitud';

export type { Sucursal, Decision };

export interface FilaInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockMinimo: number;
  activo: boolean;
  stockA: number;
  stockB: number;
  stockC: number;
  stockTotal: number;
  critico: boolean;
}

export interface DetalleProducto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockMinimo: number;
  activo: boolean;
  stockA: number;
  stockB: number;
  stockC: number;
  stockTotal: number;
  critico: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatosProducto {
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockMinimo?: number;
}

export interface DatosSolicitud {
  codigo?: string;
  productoId?: string;
  solicitante: Sucursal;
  cantidad: number;
}

export interface ResultadoSolicitud {
  decision: Decision;
  stock: Record<Sucursal, number>;
  critico: boolean;
}

export interface Transaccion {
  id: number;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  tipo: 'venta_local' | 'transferencia' | 'orden_proveedor' | 'entrada';
  sucursalOrigen: Sucursal | null;
  sucursalDestino: Sucursal | null;
  cantidad: number;
  costoLogistico: number;
  motivo: string | null;
  fecha: string;
}

export interface OrdenProveedor {
  id: number;
  productoId: string;
  productoCodigo?: string;
  productoNombre?: string;
  sucursal: Sucursal;
  cantidad: number;
  motivo: string;
  estado: 'pendiente' | 'recibida';
  fecha: string;
  recibidaAt: string | null;
}

export interface Informe {
  desde: string;
  hasta: string;
  ventasLocales: number;
  transferencias: number;
  ordenesProveedor: number;
  entradas: number;
  costoLogisticoTotal: number;
  unidadesVendidas: number;
  unidadesTransferidas: number;
  totalTransacciones: number;
}
