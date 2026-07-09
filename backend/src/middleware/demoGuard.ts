import { Response, NextFunction } from 'express';
import type { AuthedRequest } from './auth';
import { ApiError } from '../utils/ApiError';

const DEMO_EMAIL = 'demo@rys.app';
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function demoGuard(req: AuthedRequest, _res: Response, next: NextFunction): void {
  if (req.userEmail === DEMO_EMAIL && !READ_METHODS.has(req.method)) {
    throw new ApiError(403, 'Demo account is read-only. Sign up for a free account to start tracking.', 'demo_readonly');
  }
  next();
}
