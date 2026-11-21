import { createRequire } from 'module';
import pg from 'pg';

const require = createRequire(import.meta.url);
require('tsconfig-paths').register({
  baseUrl: '.',
  paths: { '@/*': ['src/*'], '@data/*': ['data/*'] },
});

process.env.GLOWSTOCK_POSTGRES_URL =
  process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING || process.env.GLOWSTOCK_POSTGRES_URL;

const { Client } = pg;

async function cargarModulo<T = any>(ruta: string): Promise<T> {
  const mod: any = await import(ruta);
  return (mod && mod.default && Object.keys(mod).length <= 2 ? mod.default : mod) as T;
}

async function limpiarDemo(): Promise<void> {
  const connectionUrl =
    process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING || process.env.GLOWSTOCK_POSTGRES_URL;

  if (!connectionUrl) {
    throw new Error('Falta GLOWSTOCK_POSTGRES_URL_NON_POOLING o GLOWSTOCK_POSTGRES_URL en el entorno.');
  }

  const parsedUrl = new URL(connectionUrl);
  parsedUrl.searchParams.delete('sslmode');

  const client = new Client({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  });

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM transacciones
        WHERE producto_id IN (SELECT id FROM productos WHERE codigo LIKE 'IT-DEMO-%')`,
    );
    await client.query(
      `DELETE FROM ordenes_proveedor
        WHERE producto_id IN (SELECT id FROM productos WHERE codigo LIKE 'IT-DEMO-%')`,
    );
    await client.query(
      `DELETE FROM existencias
        WHERE producto_id IN (SELECT id FROM productos WHERE codigo LIKE 'IT-DEMO-%')`,
    );
    await client.query(`DELETE FROM productos WHERE codigo LIKE 'IT-DEMO-%'`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const dataService: any = await cargarModulo('@/lib/dataService');
  const { crearProducto, registrarEntrada, cerrarPool } = dataService;

  try {
    await limpiarDemo();

    await crearProducto({
      codigo: 'IT-DEMO-LABIAL',
      nombre: 'Labial Mate Carmesí',
      categoria: 'Cosméticos',
      precio: 25000,
      stockMinimo: 5,
    });
    await registrarEntrada('IT-DEMO-LABIAL', 'A', 2);
    await registrarEntrada('IT-DEMO-LABIAL', 'B', 20);
    await registrarEntrada('IT-DEMO-LABIAL', 'C', 6);

    await crearProducto({
      codigo: 'IT-DEMO-BASE',
      nombre: 'Base Líquida Natural',
      categoria: 'Cosméticos',
      precio: 48000,
      stockMinimo: 5,
    });
    await registrarEntrada('IT-DEMO-BASE', 'A', 10);
    await registrarEntrada('IT-DEMO-BASE', 'B', 12);
    await registrarEntrada('IT-DEMO-BASE', 'C', 8);

    await crearProducto({
      codigo: 'IT-DEMO-SERUM',
      nombre: 'Sérum Facial Reparador',
      categoria: 'Cuidado facial',
      precio: 62000,
      stockMinimo: 5,
    });
    await registrarEntrada('IT-DEMO-SERUM', 'A', 1);
    await registrarEntrada('IT-DEMO-SERUM', 'B', 4);
    await registrarEntrada('IT-DEMO-SERUM', 'C', 2);

    await crearProducto({
      codigo: 'IT-DEMO-MASCARA',
      nombre: 'Máscara de Pestañas Volumen',
      categoria: 'Cosméticos',
      precio: 32000,
      stockMinimo: 5,
    });
    await registrarEntrada('IT-DEMO-MASCARA', 'A', 15);
    await registrarEntrada('IT-DEMO-MASCARA', 'B', 3);
    await registrarEntrada('IT-DEMO-MASCARA', 'C', 18);

    console.log('Datos demo cargados:');
    console.log('- IT-DEMO-LABIAL (Cosméticos): A=2, B=20, C=6 (requiere transferencia desde A en escenarios típicos).');
    console.log('- IT-DEMO-BASE (Cosméticos): A=10, B=12, C=8 (stock equilibrado).');
    console.log('- IT-DEMO-SERUM (Cuidado facial): A=1, B=4, C=2 (estado crítico, total 7).');
    console.log('- IT-DEMO-MASCARA (Cosméticos): A=15, B=3, C=18 (distribución desigual).');
  } finally {
    try {
      if (typeof cerrarPool === 'function') await cerrarPool();
    } catch {
      // ignorar
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
