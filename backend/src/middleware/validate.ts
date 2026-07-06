import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, z } from 'zod';

/**
 * Builds middleware that validates and *replaces* parts of the request with the
 * parsed (and thus typed + defaulted) values. Throwing ZodErrors are caught by
 * the central error handler.
 *
 * Usage: router.post('/', validate({ body: createSchema }), controller.create)
 */
export function validate(schemas: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        // req.query is a getter in Express 4; assign parsed values onto it.
        Object.assign(req.query, schemas.query.parse(req.query));
      }
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Reusable UUID path-param schema. */
export const idParamSchema = z.object({ id: z.string().uuid() });
