import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

/**
 * Express request augmented with the authenticated user's id/email.
 * Populated by requireAuth and read by controllers to scope queries per-user.
 */
export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Gate a route behind a valid Bearer JWT. On success attaches userId/userEmail
 * to the request; otherwise throws 401.
 */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

/** Helper: get the authenticated user id or throw (keeps controllers terse). */
export function getUserId(req: AuthedRequest): string {
  if (!req.userId) throw ApiError.unauthorized();
  return req.userId;
}
