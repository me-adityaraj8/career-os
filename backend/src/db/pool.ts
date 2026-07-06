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
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
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
