import { Router } from 'express';
import * as controller from '../controllers/interviewController';
import { requireAuth } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createInterviewSchema,
  updateInterviewSchema,
  listInterviewsQuerySchema,
} from '../validation/interviewSchemas';

export const interviewRouter = Router();

interviewRouter.use(requireAuth);

interviewRouter.get('/', validate({ query: listInterviewsQuerySchema }), asyncHandler(controller.list));
interviewRouter.post('/', validate({ body: createInterviewSchema }), asyncHandler(controller.create));
interviewRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateInterviewSchema }),
  asyncHandler(controller.update),
);
interviewRouter.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.remove));
