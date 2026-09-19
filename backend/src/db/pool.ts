import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import { env } from '../config/env';

// Return DATE (OID 1082) columns as the raw 'YYYY-MM-DD' string instead of a
// local-midnight JS Date. This avoids an off-by-one where toISOString() shifts
// west-of-UTC dates to the previous day.
types.setTypeParser(1082, (value: string) => value);

/**
 * Single shared connection pool for the whole app.
 * All data-access modules import `query` / `getClient` from here — no module
 * should create its own pool.
 */
// Serverless hosts run many short-lived instances, each with its own pool, so
// a large per-instance pool multiplies into pooler exhaustion. Keep it tiny
// there and let the upstream connection pooler do the multiplexing; a
// long-lived container can afford the usual pool.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 10_000 : 30_000,
  // Fail fast instead of hanging a serverless invocation until its timeout.
  connectionTimeoutMillis: isServerless ? 10_000 : 0,
  // Managed providers (Supabase, Neon, …) require TLS. rejectUnauthorized is
  // false because their pooler presents a cert not in the system CA bundle —
  // the connection is still encrypted; this only skips chain verification.
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // A pooled client encountered an unexpected error while idle.
  // eslint-disable-next-line no-console
  console.error('Unexpected Postgres pool error:', err);
});

/** Thin typed wrapper around pool.query. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

/**
 * Run a set of statements inside a single transaction.
 * The callback receives a dedicated client; commit/rollback is handled here.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
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
