import { Pool, type PoolClient, types } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(1184, (valor) => valor);
types.setTypeParser(20, (valor) => parseInt(valor, 10));

const globalParaPool = globalThis as unknown as { poolIntertiendas?: Pool };

const cadenaConexion = process.env.GLOWSTOCK_POSTGRES_URL;

export const pool =
  globalParaPool.poolIntertiendas ??
  new Pool({
    connectionString: cadenaConexion,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalParaPool.poolIntertiendas = pool;
}

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> {
  const resultado = await pool.query(sql, valores);
  return resultado.rows as T[];
}

export async function conTransaccion<T>(
  trabajo: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
