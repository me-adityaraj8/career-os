import { Router } from 'express';
import * as controller from '../controllers/applicationController';
import { requireAuth } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createApplicationSchema,
  updateApplicationSchema,
  listApplicationsQuerySchema,
} from '../validation/applicationSchemas';

export const applicationRouter = Router();

// All application routes require authentication.
applicationRouter.use(requireAuth);

applicationRouter.get(
  '/',
  validate({ query: listApplicationsQuerySchema }),
  asyncHandler(controller.list),
);
applicationRouter.get('/tags', asyncHandler(controller.tags));
applicationRouter.post('/', validate({ body: createApplicationSchema }), asyncHandler(controller.create));
applicationRouter.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.get));
applicationRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateApplicationSchema }),
  asyncHandler(controller.update),
);
applicationRouter.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.remove));
