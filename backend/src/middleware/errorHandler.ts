import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

/**
 * Central error handler. Must be registered LAST (after all routes).
 * Normalizes ApiError, Zod validation errors, and unknown errors into a
 * consistent JSON envelope: { error: { code, message, details? } }.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognize this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof MulterError) {
    // e.g. file too large (LIMIT_FILE_SIZE) — surface a clean 400.
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message;
    res.status(400).json({ error: { code: 'upload_error', message } });
    return;
  }

  if (err instanceof ZodError) {
    // A single failing field is almost always the whole story, and the schema's
    // own message is written for a human — surface it instead of a generic
    // line the UI can only render as "something was wrong somewhere".
    const single = err.issues.length === 1 ? err.issues[0]?.message : undefined;
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: single ?? 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  // Unknown / unexpected error — log server-side, hide details from clients in prod.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: isProduction ? 'Something went wrong' : String((err as Error)?.message ?? err),
    },
  });
}

/** 404 fallback for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
}
