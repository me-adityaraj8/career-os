/**
 * Vercel serverless entry point.
 *
 * Vercel does not run a long-lived process, so instead of `app.listen()` we
 * export the Express app as the request handler. `createApp()` was already
 * listen-free (it was split out for tests), so the same app object serves
 * both the container deploy and this one.
 *
 * The app is built once per warm instance and reused across invocations.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../backend/src/app';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  (app as unknown as (r: IncomingMessage, s: ServerResponse) => void)(req, res);
}
