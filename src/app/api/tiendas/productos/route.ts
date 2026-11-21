import { exigirSesion } from '@/lib/auth/sesion';
import { crearProducto, listarInventario } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosInventario, esquemaProducto } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const url = new URL(request.url);
  const categoria = url.searchParams.get('categoria')?.trim() || undefined;
  const soloCriticosParam = url.searchParams.get('soloCriticos');
  const soloCriticosValor =
    soloCriticosParam === 'true' || soloCriticosParam === '1' ? true : undefined;

  const filtrosValidados = esquemaFiltrosInventario.parse({
    ...(categoria ? { categoria } : {}),
    ...(soloCriticosValor ? { soloCriticos: soloCriticosValor } : {}),
  });

  const filtros: { categoria?: string; soloCriticos?: boolean } = {};
  if (filtrosValidados.categoria !== undefined) {
    filtros.categoria = filtrosValidados.categoria;
  }
  if (filtrosValidados.soloCriticos !== undefined) {
    filtros.soloCriticos = filtrosValidados.soloCriticos;
  }

  const productos = await listarInventario(filtros);
  return responderOk(productos);
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();

  const cuerpo = await leerCuerpo(request);
  const datos = esquemaProducto.parse(cuerpo);
  const creado = await crearProducto({
    codigo: datos.codigo,
    nombre: datos.nombre,
    categoria: datos.categoria,
    precio: datos.precio,
    ...(datos.stockMinimo !== undefined ? { stockMinimo: datos.stockMinimo } : {}),
  });

  return responderOk(creado, 201);
});
