import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Builds the Express application (no listen() — kept separate from index.ts so
 * tests can import the app without binding a port).
 */
export function createApp(): Application {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Serve uploaded resume PDFs statically (auth-checked download route also exists).
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
