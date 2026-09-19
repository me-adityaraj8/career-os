/**
 * Vercel entrypoint.
 *
 * Exports a ready-to-serve Express app instead of starting a listener: on
 * Vercel the platform owns the server lifecycle, so `index.ts`'s `listen()`
 * and graceful-shutdown handling don't apply. Everything else — routes,
 * middleware, storage driver — is the same app the container deploy runs.
 *
 * Uses `export =` so the bundled CommonJS module's `module.exports` *is* the
 * request handler, with no `.default` wrapper for the platform to unwrap.
 */
import { createApp } from './app';

const app = createApp();

export = app;
