import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { env, isProduction } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Builds the Express application (no listen() — kept separate from index.ts so
 * tests can import the app without binding a port).
 */
export function createApp(): Application {
  const app = express();

  // In dev, dev-server tooling (e.g. preview autoPort) can bind the frontend to
  // any localhost port, so reflect any localhost origin instead of a fixed one.
  // Production stays locked to the configured CORS_ORIGIN.
  const corsOrigin = isProduction
    ? env.corsOrigin
    : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
        cb(null, false);
      };

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Serve uploaded resume PDFs statically (auth-checked download route also exists).
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.use('/api/v1', apiRouter);

  // In production, serve the frontend's static build from ../frontend/dist.
  // All non-API routes fall through to index.html for client-side routing.
  if (isProduction) {
    const clientDir = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(clientDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
