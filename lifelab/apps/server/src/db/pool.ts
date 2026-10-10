import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

/**
 * Serverless-friendly pool: tái dùng qua global để tránh tạo pool mới mỗi cold start,
 * giới hạn connection (managed Postgres như Neon có giới hạn), bật SSL khi cần.
 */
const g = globalThis as unknown as { __lifelabPool?: pg.Pool };

function makePool(): pg.Pool {
  const needSsl = /\bsslmode=require\b/.test(config.databaseUrl) || process.env.PGSSL === 'true';
  return new Pool({
    connectionString: config.databaseUrl,
    max: Number(process.env.PG_POOL_MAX ?? (config.nodeEnv === 'production' ? 3 : 10)),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: needSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool: pg.Pool = g.__lifelabPool ?? (g.__lifelabPool = makePool());

export type Querier = pg.PoolClient | pg.Pool;

/** Chạy fn trong một transaction; rollback nếu lỗi (Transaction boundaries, Phần 5). */
export async function withTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
