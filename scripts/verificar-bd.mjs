import pg from 'pg';

const { Client } = pg;
const connectionUrl = process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING;

if (!connectionUrl) {
  console.error('Falta GLOWSTOCK_POSTGRES_URL_NON_POOLING en el entorno.');
  process.exit(1);
}

const parsedUrl = new URL(connectionUrl);
parsedUrl.searchParams.delete('sslmode');

// Ajuste para ejecución local por restricción de red; no copiar al código de la aplicación.
const client = new Client({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

function printSection(name) {
  console.log(`\n=== ${name} ===`);
}

function summarizeCase(label, ok, details = '') {
  const status = ok ? 'OK' : 'FALLA';
  console.log(`${status} :: ${label}${details ? ` :: ${details}` : ''}`);
  return ok;
}

async function main() {
  await client.connect();
  const tables = ['productos', 'existencias', 'transacciones', 'ordenes_proveedor'];
  const viewName = 'v_inventario';
  let failures = 0;

  printSection('Existencia de objetos');
  for (const table of tables) {
    const result = await client.query(
      'SELECT to_regclass($1) AS object_name', [`public.${table}`],
    );
    console.log(`${table}: ${result.rows[0]?.object_name ? 'EXISTE' : 'NO EXISTE'}`);
  }

  const viewResult = await client.query(
    'SELECT to_regclass($1) AS object_name', [`public.${viewName}`],
  );
  console.log(`${viewName}: ${viewResult.rows[0]?.object_name ? 'EXISTE' : 'NO EXISTE'}`);

  printSection('Conteo de filas');
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::int AS total FROM public.${table}`);
    console.log(`${table}: ${result.rows[0].total}`);
  }

  printSection('Restricciones e índices');
  const constraintInfo = await client.query(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.productos'::regclass
      OR conrelid = 'public.existencias'::regclass
      OR conrelid = 'public.transacciones'::regclass
  `);
  const names = constraintInfo.rows.map((row) => row.conname);
  for (const name of [
    'productos_codigo_unico',
    'existencias_sucursal_valida',
    'existencias_cantidad_no_neg',
    'existencias_unica',
    'trans_tipo_valido',
  ]) {
    console.log(`${name}: ${names.includes(name) ? 'PRESENTE' : 'FALTA'}`);
  }

  printSection('RLS');
  const rlsResult = await client.query(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname IN ('productos', 'existencias', 'transacciones', 'ordenes_proveedor')
      AND relnamespace = 'public'::regnamespace
  `);
  for (const row of rlsResult.rows) {
    console.log(`${row.relname}: ${row.relrowsecurity ? 'ACTIVO' : 'INACTIVO'}`);
  }

  printSection('Pruebas de integridad con rollback');
  await client.query('BEGIN');

  const cases = [];

  try {
    const productA = 'IT-A';
    await client.query(
      'INSERT INTO public.productos (codigo, nombre, categoria, precio, stock_minimo) VALUES ($1, $2, $3, $4, $5)',
      [productA, 'Producto prueba A', 'Cosméticos', 20000, 5],
    );
    cases.push({ label: 'Crear producto con código válido', ok: true });

    await client.query('SAVEPOINT s_dup');
    try {
      await client.query(
        'INSERT INTO public.productos (codigo, nombre, categoria, precio, stock_minimo) VALUES ($1, $2, $3, $4, $5)',
        [productA, 'Duplicado', 'Cosméticos', 25000, 5],
      );
      cases.push({ label: 'Duplicado de codigo genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23505';
      cases.push({ label: 'Duplicado de codigo genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_dup');
    }

    await client.query('SAVEPOINT s_precio');
    try {
      await client.query(
        'INSERT INTO public.productos (codigo, nombre, categoria, precio, stock_minimo) VALUES ($1, $2, $3, $4, $5)',
        ['IT-B', 'Precio cero', 'Cosméticos', 0, 5],
      );
      cases.push({ label: 'Precio 0 genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23514';
      cases.push({ label: 'Precio 0 genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_precio');
    }

    await client.query('SAVEPOINT s_sucursal');
    try {
      await client.query(
        'INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ((SELECT id FROM public.productos WHERE codigo = $1), $2, $3)',
        [productA, 'D', 10],
      );
      cases.push({ label: 'Sucursal inválida genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23514';
      cases.push({ label: 'Sucursal inválida genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_sucursal');
    }

    await client.query('SAVEPOINT s_neg');
    try {
      await client.query(
        'INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ((SELECT id FROM public.productos WHERE codigo = $1), $2, $3)',
        [productA, 'A', -1],
      );
      cases.push({ label: 'Cantidad negativa genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23514';
      cases.push({ label: 'Cantidad negativa genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_neg');
    }

    await client.query('SAVEPOINT s_unica');
    try {
      const productoId = (await client.query('SELECT id FROM public.productos WHERE codigo = $1', [productA])).rows[0].id;
      await client.query('INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ($1, $2, $3)', [productoId, 'A', 7]);
      await client.query('INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ($1, $2, $3)', [productoId, 'A', 9]);
      cases.push({ label: 'Duplicado de existencia genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23505';
      cases.push({ label: 'Duplicado de existencia genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_unica');
    }

    await client.query('SAVEPOINT s_tipo');
    try {
      const productoId = (await client.query('SELECT id FROM public.productos WHERE codigo = $1', [productA])).rows[0].id;
      await client.query(
        'INSERT INTO public.transacciones (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [productoId, 'devolucion', 'A', 'B', 1, 0, 'n/a'],
      );
      cases.push({ label: 'Tipo de transacción inválido genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23514';
      cases.push({ label: 'Tipo de transacción inválido genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_tipo');
    }

    await client.query('SAVEPOINT s_transcantidad');
    try {
      const productoId = (await client.query('SELECT id FROM public.productos WHERE codigo = $1', [productA])).rows[0].id;
      await client.query(
        'INSERT INTO public.transacciones (producto_id, tipo, sucursal_origen, sucursal_destino, cantidad, costo_logistico, motivo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [productoId, 'venta_local', 'A', 'B', 0, 0, 'test'],
      );
      cases.push({ label: 'Cantidad de transacción inválida genera error', ok: false, detail: 'Se insertó sin error' });
    } catch (error) {
      const code = error?.code || 'NO_CODE';
      const ok = code === '23514';
      cases.push({ label: 'Cantidad de transacción inválida genera error', ok, detail: ok ? `codigo=${code}` : `codigo=${code}` });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT s_transcantidad');
    }

    const productoId = (await client.query('SELECT id FROM public.productos WHERE codigo = $1', [productA])).rows[0].id;
    await client.query('INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ($1, $2, $3)', [productoId, 'A', 10]);
    await client.query('INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ($1, $2, $3)', [productoId, 'B', 20]);
    await client.query('INSERT INTO public.existencias (producto_id, sucursal, cantidad) VALUES ($1, $2, $3)', [productoId, 'C', 20]);
    const totalView = await client.query('SELECT stock_total, critico FROM public.v_inventario WHERE codigo = $1', [productA]);
    const total = Number(totalView.rows[0]?.stock_total ?? 0);
    const critico = totalView.rows[0]?.critico;
    const okTotal = total === 50 && critico === false;
    cases.push({ label: 'Vista inventario total 50 y critico=false', ok: okTotal, detail: okTotal ? `stock_total=${total}` : `stock_total=${total}` });

    await client.query('UPDATE public.existencias SET cantidad = 10 WHERE producto_id = $1 AND sucursal = $2', [productoId, 'A']);
    await client.query('UPDATE public.existencias SET cantidad = 0 WHERE producto_id = $1 AND sucursal = $2', [productoId, 'B']);
    await client.query('UPDATE public.existencias SET cantidad = 0 WHERE producto_id = $1 AND sucursal = $2', [productoId, 'C']);
    const totalViewAfter = await client.query('SELECT stock_total, critico FROM public.v_inventario WHERE codigo = $1', [productA]);
    const totalAfter = Number(totalViewAfter.rows[0]?.stock_total ?? 0);
    const criticoAfter = totalViewAfter.rows[0]?.critico;
    const okCritico = totalAfter === 10 && criticoAfter === true;
    cases.push({ label: 'Vista inventario total 10 y critico=true', ok: okCritico, detail: okCritico ? `stock_total=${totalAfter}` : `stock_total=${totalAfter}` });
  } catch (error) {
    console.error('Error general en la transacción de prueba:', error);
    failures += 1;
  }

  await client.query('ROLLBACK');

  for (const current of cases) {
    const isOk = summarizeCase(current.label, current.ok, current.detail);
    if (!isOk) failures += 1;
  }

  console.log(`\nTOTAL_FALLAS=${failures}`);
  process.exit(failures > 0 ? 1 : 0);
}

try {
  await main();
} catch (error) {
  console.error('Error ejecutando verificación:', error);
  process.exit(1);
} finally {
  await client.end();
}
