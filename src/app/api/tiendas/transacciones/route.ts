import { exigirSesion } from '@/lib/auth/sesion';
import { listarTransacciones } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosTransacciones } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const url = new URL(request.url);
  const productoCodigo = url.searchParams.get('productoCodigo')?.trim() || undefined;
  const tipo = url.searchParams.get('tipo')?.trim() || undefined;
  const sucursal = url.searchParams.get('sucursal')?.trim() || undefined;
  const desde = url.searchParams.get('desde')?.trim() || undefined;
  const hasta = url.searchParams.get('hasta')?.trim() || undefined;

  const filtrosValidados = esquemaFiltrosTransacciones.parse({
    ...(productoCodigo ? { productoCodigo } : {}),
    ...(tipo ? { tipo } : {}),
    ...(sucursal ? { sucursal } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
  });

  const filtros: {
    productoCodigo?: string;
    tipo?: string;
    sucursal?: 'A' | 'B' | 'C';
    desde?: string;
    hasta?: string;
  } = {};
  if (filtrosValidados.productoCodigo !== undefined) {
    filtros.productoCodigo = filtrosValidados.productoCodigo;
  }
  if (filtrosValidados.tipo !== undefined) {
    filtros.tipo = filtrosValidados.tipo;
  }
  if (filtrosValidados.sucursal !== undefined) {
    filtros.sucursal = filtrosValidados.sucursal;
  }
  if (filtrosValidados.desde !== undefined) {
    filtros.desde = filtrosValidados.desde;
  }
  if (filtrosValidados.hasta !== undefined) {
    filtros.hasta = filtrosValidados.hasta;
  }

  const transacciones = await listarTransacciones(filtros);
  return responderOk(transacciones);
});
