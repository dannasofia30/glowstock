import pg from 'pg';

const { Client } = pg;

const connectionUrl =
  process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING || process.env.GLOWSTOCK_POSTGRES_URL;

if (!connectionUrl) {
  console.error('Falta GLOWSTOCK_POSTGRES_URL_NON_POOLING o GLOWSTOCK_POSTGRES_URL en el entorno.');
  process.exit(1);
}

const parsedUrl = new URL(connectionUrl);
parsedUrl.searchParams.delete('sslmode');

const client = new Client({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

export async function limpiarCodigos(codigosLike = ['IT-TEST-%', 'IT-DEMO-%']) {
  const externo = arguments.length === 0 ? null : client;
  const usarExterno = externo !== null;
  // no-op: signature helper not used; keep simple below
}

async function main() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM transacciones
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE 'IT-TEST-%' OR codigo LIKE 'IT-DEMO-%'
        )`,
    );
    await client.query(
      `DELETE FROM ordenes_proveedor
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE 'IT-TEST-%' OR codigo LIKE 'IT-DEMO-%'
        )`,
    );
    await client.query(
      `DELETE FROM existencias
        WHERE producto_id IN (
          SELECT id FROM productos WHERE codigo LIKE 'IT-TEST-%' OR codigo LIKE 'IT-DEMO-%'
        )`,
    );
    await client.query(
      `DELETE FROM productos
        WHERE codigo LIKE 'IT-TEST-%' OR codigo LIKE 'IT-DEMO-%'`,
    );
    await client.query('COMMIT');
    console.log('Limpieza de datos de prueba/demo completada.');
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
