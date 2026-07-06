import { createApp } from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Career OS API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown: stop accepting connections, then drain the DB pool.
async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
