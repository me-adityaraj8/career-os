import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { env, isProduction } from './config/env';
import { apiRouter } from './routes';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { storage } from './services/storage';

/**
 * Builds the Express application (no listen() — kept separate from index.ts so
 * tests can import the app without binding a port).
 */
export function createApp(): Application {
  const app = express();

  // Behind Railway's proxy in production, trust the first hop so req.ip is the
  // real client IP — required for per-client rate limiting to work correctly.
  if (isProduction) app.set('trust proxy', 1);

  // Security headers. CSP is left to the edge (it would need to enumerate the
  // served SPA's assets, Google Fonts, and an optional Umami host), but every
  // other protection — HSTS, no-sniff, frameguard, referrer policy — is on.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      // Allow the frontend origin (dev: different port) to load /uploads assets.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // gzip responses (JSON payloads, the served SPA bundle).
  app.use(compression());

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

  // Only the local-disk driver has a directory to serve. Object-storage
  // deploys go through the auth-checked /resumes/:id/download route instead,
  // which is the safer path anyway (it verifies ownership).
  if (storage.id === 'disk') {
    app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
  }

  app.use('/api/v1', generalLimiter, apiRouter);

  // In production, serve the frontend's static build from ../frontend/dist.
  // All non-API routes fall through to index.html for client-side routing.
  //
  // Skipped on Vercel: there the static build is served by the platform's CDN
  // and only /api/* is routed into this function, so there is no bundled
  // frontend/dist for the process to read.
  if (isProduction && !process.env.VERCEL) {
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
