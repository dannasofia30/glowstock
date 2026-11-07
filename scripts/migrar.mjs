import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const connectionUrl = process.env.GLOWSTOCK_POSTGRES_URL_NON_POOLING;

if (!connectionUrl) {
  console.error('Falta GLOWSTOCK_POSTGRES_URL_NON_POOLING en el entorno.');
  process.exit(1);
}

const parsedUrl = new URL(connectionUrl);
parsedUrl.searchParams.delete('sslmode');

const migrationDir = path.resolve(process.cwd(), 'supabase/migrations');
const files = (await fs.readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();

// Ajuste para ejecución local por restricción de red; no copiar al código de la aplicación.
const client = new Client({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

async function ensureMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function applyMigrations() {
  await client.connect();
  await ensureMigrationsTable();

  for (const file of files) {
    const query = await client.query('SELECT 1 FROM public._migrations WHERE name = $1', [file]);
    if (query.rowCount > 0) {
      console.log(`Omitida: ${file}`);
      continue;
    }

    const fullPath = path.join(migrationDir, file);
    const sql = await fs.readFile(fullPath, 'utf8');

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Aplicada: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error al aplicar ${file}`);
      throw error;
    }
  }
}

try {
  await applyMigrations();
  console.log('Migraciones ejecutadas correctamente.');
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
} finally {
  await client.end();
}
