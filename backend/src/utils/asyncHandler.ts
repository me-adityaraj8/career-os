import { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to Express's
 * error middleware instead of crashing the process. Lets controllers use
 * `async/await` and `throw` freely.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
