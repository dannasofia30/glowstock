import { createRequire } from 'module';
import pg from 'pg';

const require = createRequire(import.meta.url);
require('tsconfig-paths').register({
  baseUrl: '.',
  paths: { '@/*': ['src/*'], '@data/*': ['data/*'] },
});

const { Client } = pg;
const CODIGO = 'IT-TEST-1';

type Paso = { nombre: string; ok: boolean; detalle?: string };
const pasos: Paso[] = [];

function describirError(error: unknown): string {
  if (error instanceof Error) {
    const e = error as Error & {
      code?: string | number;
      errno?: string | number;
      syscall?: string;
      hostname?: string;
      address?: string;
      port?: string | number;
    };
    const partes = [e.message || String(error)];
    if (e.code !== undefined) partes.push(`code=${e.code}`);
    if (e.errno !== undefined) partes.push(`errno=${e.errno}`);
    if (e.syscall) partes.push(`syscall=${e.syscall}`);
    if (e.hostname) partes.push(`hostname=${e.hostname}`);
    if (e.address) partes.push(`address=${e.address}`);
    if (e.port !== undefined) partes.push(`port=${e.port}`);
    return partes.join(' | ');
  }
  return String(error);
}

function registrar(nombre: string, ok: boolean, detalle?: string) {
  if (detalle === undefined) {
    pasos.push({ nombre, ok });
  } else {
    pasos.push({ nombre, ok, detalle });
  }
  const estado = ok ? 'OK' : 'FALLA';
  console.log(`${estado} :: ${nombre}${detalle ? ` :: ${detalle}` : ''}`);
}

async function cargarModulo<T = any>(ruta: string): Promise<T> {
  const mod: any = await import(ruta);
  return (mod && mod.default && Object.keys(mod).length <= 2 ? mod.default : mod) as T;
}

async function crearCliente(): Promise<pg.Client> {
  const connectionUrl = process.env.GLOWSTOCK_POSTGRES_URL;
  if (!connectionUrl) {
    throw new Error('Falta GLOWSTOCK_POSTGRES_URL en el entorno.');
  }

  const parsedUrl = new URL(connectionUrl);
  parsedUrl.searchParams.delete('sslmode');
  const connectionString = parsedUrl.toString();

  const connectionStringOculta = (() => {
    try {
      const urlOculta = new URL(connectionString);
      if (urlOculta.password) {
        urlOculta.password = '****';
      }
      return urlOculta.toString();
    } catch {
      return connectionString.replace(/:\/\/([^:/?#]+):([^@/?#]+)@/, '://$1:****@');
    }
  })();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  });

  try {
    await client.connect();
  } catch (err) {
    const error = err as Error & { code?: string | number };
    console.error('Error al conectar a la base de datos');
    console.error('err.message:', error.message);
    console.error('err.code:', error.code);
    console.error('connectionString:', connectionStringOculta);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    try {
      await client.end();
    } catch {
      // ignorar error al cerrar cliente fallido
    }
    throw err;
  }

  return client;
}

async function limpiarPrueba(): Promise<void> {
  const client = await crearCliente();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM transacciones WHERE producto_id IN (SELECT id FROM productos WHERE codigo = $1)`,
      [CODIGO],
    );
    await client.query(
      `DELETE FROM ordenes_proveedor WHERE producto_id IN (SELECT id FROM productos WHERE codigo = $1)`,
      [CODIGO],
    );
    await client.query(
      `DELETE FROM existencias WHERE producto_id IN (SELECT id FROM productos WHERE codigo = $1)`,
      [CODIGO],
    );
    await client.query(`DELETE FROM productos WHERE codigo = $1`, [CODIGO]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function ajustarStock(stock: { A: number; B: number; C: number }): Promise<void> {
  const client = await crearCliente();
  try {
    await client.query('BEGIN');
    const prod = await client.query<{ id: string }>(
      `SELECT id FROM productos WHERE codigo = $1`,
      [CODIGO],
    );
    const id = prod.rows[0]?.id;
    if (!id) throw new Error('Producto de prueba no encontrado para ajuste.');
    for (const sucursal of ['A', 'B', 'C'] as const) {
      await client.query(
        `UPDATE existencias SET cantidad = $3 WHERE producto_id = $1 AND sucursal = $2`,
        [id, sucursal, stock[sucursal]],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<number> {
  const dataService: any = await cargarModulo('@/lib/dataService');
  const errores: any = await cargarModulo('@/lib/reglas/errores');
  const {
    crearProducto,
    listarInventario,
    listarTransacciones,
    obtenerProducto,
    procesarSolicitud,
    registrarEntrada,
    cerrarPool,
  } = dataService;
  const { ErrorDeNegocio } = errores;

  const esCodigoError = (error: unknown, codigo: string): boolean =>
    error instanceof ErrorDeNegocio && (error as any).codigo === codigo;

  await limpiarPrueba();

  try {
    try {
      const creado = await crearProducto({
        codigo: CODIGO,
        nombre: 'Labial Prueba',
        categoria: 'Cosméticos',
        precio: 20000,
        stockMinimo: 5,
      });
      const detalle = await obtenerProducto(CODIGO);
      const ok =
        !!creado?.id &&
        creado.codigo === CODIGO &&
        detalle.stockA === 0 &&
        detalle.stockB === 0 &&
        detalle.stockC === 0;
      registrar(
        '1. Crear producto IT-TEST-1 con existencias 0 en A, B, C',
        ok,
        ok ? `id=${creado.id}` : `stock=${detalle.stockA},${detalle.stockB},${detalle.stockC}`,
      );
    } catch (error) {
      registrar(
        '1. Crear producto IT-TEST-1 con existencias 0 en A, B, C',
        false,
        describirError(error),
      );
    }

    try {
      await crearProducto({
        codigo: CODIGO,
        nombre: 'Labial Prueba',
        categoria: 'Cosméticos',
        precio: 20000,
        stockMinimo: 5,
      });
      registrar('2. Crear IT-TEST-1 otra vez rechaza duplicado', false, 'No lanzó error');
    } catch (error) {
      const ok = esCodigoError(error, 'PRODUCTO_DUPLICADO');
      registrar(
        '2. Crear IT-TEST-1 otra vez rechaza duplicado',
        ok,
        ok ? 'PRODUCTO_DUPLICADO' : describirError(error),
      );
    }

    try {
      await registrarEntrada(CODIGO, 'A', 10);
      await registrarEntrada(CODIGO, 'B', 20);
      await registrarEntrada(CODIGO, 'C', 20);
      const detalle = await obtenerProducto(CODIGO);
      const ok = detalle.stockA === 10 && detalle.stockB === 20 && detalle.stockC === 20;
      registrar(
        '3. Entrada de 10 a A, 20 a B, 20 a C',
        ok,
        `A=${detalle.stockA}, B=${detalle.stockB}, C=${detalle.stockC}`,
      );
    } catch (error) {
      registrar('3. Entrada de 10 a A, 20 a B, 20 a C', false, describirError(error));
    }

    try {
      const resultado = await procesarSolicitud({ codigo: CODIGO, solicitante: 'A', cantidad: 4 });
      const ok =
        resultado.decision.accion === 'venta_local' &&
        resultado.stock.A === 6 &&
        resultado.stock.B === 20 &&
        resultado.stock.C === 20;
      registrar(
        '4. Solicitud A pide 4 -> venta local, A queda 6',
        ok,
        `accion=${resultado.decision.accion}, A=${resultado.stock.A}`,
      );
    } catch (error) {
      registrar('4. Solicitud A pide 4 -> venta local, A queda 6', false, describirError(error));
    }

    try {
      const resultado = await procesarSolicitud({ codigo: CODIGO, solicitante: 'A', cantidad: 8 });
      const ok =
        resultado.decision.accion === 'transferencia' &&
        resultado.decision.origen === 'B' &&
        resultado.decision.costoTotal === 16000 &&
        resultado.stock.A === 14 &&
        resultado.stock.B === 12 &&
        resultado.stock.C === 20;
      registrar(
        '5. Solicitud A pide 8 -> transferencia desde B, costo 16000',
        ok,
        `accion=${resultado.decision.accion}, origen=${resultado.decision.origen}, costo=${resultado.decision.costoTotal}, A=${resultado.stock.A}, B=${resultado.stock.B}`,
      );
    } catch (error) {
      registrar('5. Solicitud A pide 8 -> transferencia desde B, costo 16000', false, describirError(error));
    }

    try {
      await ajustarStock({ A: 1, B: 6, C: 6 });
      const resultado = await procesarSolicitud({ codigo: CODIGO, solicitante: 'A', cantidad: 3 });
      const ok =
        resultado.decision.accion === 'orden_proveedor' &&
        resultado.decision.motivo === 'sin_candidata_viable';
      registrar(
        '6. Ajuste A=1,B=6,C=6 y solicitud A pide 3 -> orden sin_candidata_viable',
        ok,
        `accion=${resultado.decision.accion}, motivo=${resultado.decision.motivo}`,
      );
    } catch (error) {
      registrar(
        '6. Ajuste A=1,B=6,C=6 y solicitud A pide 3 -> orden sin_candidata_viable',
        false,
        describirError(error),
      );
    }

    try {
      await ajustarStock({ A: 1, B: 0, C: 0 });
      const resultado = await procesarSolicitud({ codigo: CODIGO, solicitante: 'A', cantidad: 5 });
      const ok =
        resultado.decision.accion === 'orden_proveedor' &&
        resultado.decision.motivo === 'agotamiento_total';
      registrar(
        '7. Ajuste A=1,B=0,C=0 y solicitud A pide 5 -> orden agotamiento_total',
        ok,
        `accion=${resultado.decision.accion}, motivo=${resultado.decision.motivo}`,
      );
    } catch (error) {
      registrar(
        '7. Ajuste A=1,B=0,C=0 y solicitud A pide 5 -> orden agotamiento_total',
        false,
        describirError(error),
      );
    }

    try {
      await procesarSolicitud({ codigo: CODIGO, solicitante: 'A', cantidad: 0 });
      registrar('8. Solicitud con cantidad 0 rechazada', false, 'No lanzó error');
    } catch (error) {
      const ok = esCodigoError(error, 'DATOS_INVALIDOS');
      registrar('8. Solicitud con cantidad 0 rechazada', ok, ok ? 'DATOS_INVALIDOS' : describirError(error));
    }

    try {
      const inventario = await listarInventario();
      const fila = inventario.find((item: any) => item.codigo === CODIGO);
      const ok = !!fila && fila.critico === true && fila.stockTotal <= 10;
      registrar(
        '9. Inventario muestra el producto como crítico (total <= 10)',
        ok,
        fila ? `total=${fila.stockTotal}, critico=${fila.critico}` : 'no encontrado',
      );
    } catch (error) {
      registrar('9. Inventario muestra el producto como crítico (total <= 10)', false, describirError(error));
    }

    try {
      const transacciones = await listarTransacciones({ productoCodigo: CODIGO });
      const cronologicas = [...transacciones].sort((a: any, b: any) => Number(a.id) - Number(b.id));
      const tipos = cronologicas.map((t: any) => t.tipo);
      const transferencia = cronologicas.find((t: any) => t.tipo === 'transferencia');
      const esperadoTipos = [
        'entrada',
        'entrada',
        'entrada',
        'venta_local',
        'transferencia',
        'orden_proveedor',
        'orden_proveedor',
      ];
      const esperadoCostoTransferencia = 16000;
      const obtenidoCostoTransferencia = transferencia?.costoLogistico ?? null;
      const motivosOrden = cronologicas
        .filter((t: any) => t.tipo === 'orden_proveedor')
        .map((t: any) => t.motivo);
      const esperadoMotivosOrden = ['sin_candidata_viable', 'agotamiento_total'];
      const ok =
        tipos.length === esperadoTipos.length &&
        esperadoTipos.every((tipo, i) => tipos[i] === tipo) &&
        Number(obtenidoCostoTransferencia ?? 0) === esperadoCostoTransferencia &&
        motivosOrden.length === esperadoMotivosOrden.length &&
        esperadoMotivosOrden.every((motivo, i) => motivosOrden[i] === motivo);
      const detalleHistorial = cronologicas.map((t: any) => ({
        id: t.id,
        tipo: t.tipo,
        origen: t.sucursalOrigen,
        destino: t.sucursalDestino,
        cantidad: t.cantidad,
        costoLogistico: t.costoLogistico,
        motivo: t.motivo,
      }));
      registrar(
        '10. Historial: entradas, venta local, transferencia (con costo) y 2 órdenes proveedor, en orden',
        ok,
        `esperado={tipos:[${esperadoTipos.join(', ')}], costoTransferencia:${esperadoCostoTransferencia}, motivosOrden:[${esperadoMotivosOrden.join(', ')}]} | obtenido={tipos:[${tipos.join(', ')}], costoTransferencia:${obtenidoCostoTransferencia ?? 'n/a'}, motivosOrden:[${motivosOrden.join(', ')}]} | historial=${JSON.stringify(detalleHistorial)}`,
      );
    } catch (error) {
      registrar(
        '10. Historial: entradas, venta local, transferencia (con costo) y 2 órdenes proveedor, en orden',
        false,
        describirError(error),
      );
    }

    try {
      const detalle = await obtenerProducto(CODIGO);
      const ok = detalle.stockA >= 0 && detalle.stockB >= 0 && detalle.stockC >= 0;
      registrar(
        '11. Ninguna existencia quedó negativa',
        ok,
        `A=${detalle.stockA}, B=${detalle.stockB}, C=${detalle.stockC}`,
      );
    } catch (error) {
      registrar('11. Ninguna existencia quedó negativa', false, describirError(error));
    }
  } finally {
    try {
      await limpiarPrueba();
    } catch (error) {
      console.error('Error en limpieza final:', describirError(error));
      console.error(error instanceof Error ? error.stack : error);
    }
    try {
      if (typeof cerrarPool === 'function') await cerrarPool();
    } catch {
      // ignorar
    }
  }

  return pasos.filter((p) => !p.ok).length;
}

main()
  .then((fallas) => {
    console.log(`\nResumen: ${pasos.length - fallas} OK, ${fallas} FALLA`);
    process.exit(fallas > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Error al ejecutar probar-flujo:', describirError(error));
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  });
