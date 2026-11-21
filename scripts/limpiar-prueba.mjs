import pg from 'pg';

const { Client } = pg;

const connectionUrl =
  process.env.GLOWSTOCK_POSTGRES_URL || process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING;

if (!connectionUrl) {
  console.error('Falta GLOWSTOCK_POSTGRES_URL o GLOWSTOCK_POSTGRES_URL_NON_POOLING en el entorno.');
  process.exit(1);
}

const parsedUrl = new URL(connectionUrl);
parsedUrl.searchParams.delete('sslmode');

const argumentos = new Set(process.argv.slice(2));
const soloPrueba = argumentos.has('--prueba');
const soloDemo = argumentos.has('--demo');

const patrones = soloPrueba
  ? ['IT-TEST-%']
  : soloDemo
    ? ['IT-DEMO-%']
    : ['IT-TEST-%', 'IT-DEMO-%'];

const client = new Client({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

async function main() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM transacciones
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE ANY($1::text[])
        )`,
      [patrones],
    );
    await client.query(
      `DELETE FROM ordenes_proveedor
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE ANY($1::text[])
        )`,
      [patrones],
    );
    await client.query(
      `DELETE FROM existencias
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE ANY($1::text[])
        )`,
      [patrones],
    );
    await client.query(
      `DELETE FROM productos
        WHERE codigo LIKE ANY($1::text[])`,
      [patrones],
    );
    await client.query('COMMIT');
    const alcance = soloPrueba ? 'de prueba' : soloDemo ? 'demo' : 'de prueba/demo';
    console.log(`Limpieza de datos ${alcance} completada.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
