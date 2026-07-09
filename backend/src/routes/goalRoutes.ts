import { Router } from 'express';
import * as goalService from '../services/goalService';
import { requireAuth, AuthedRequest, getUserId } from '../middleware/auth';
import { demoGuard } from '../middleware/demoGuard';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createGoalSchema, updateGoalSchema } from '../validation/goalSchemas';

export const goalRouter = Router();

goalRouter.use(requireAuth);
goalRouter.use(demoGuard);

goalRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ goals: await goalService.list(getUserId(req)) });
  }),
);

goalRouter.post(
  '/',
  validate({ body: createGoalSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json({ goal: await goalService.create(getUserId(req), req.body) });
  }),
);

goalRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateGoalSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ goal: await goalService.update(getUserId(req), req.params.id, req.body) });
  }),
);

goalRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    await goalService.remove(getUserId(req), req.params.id);
    res.status(204).send();
  }),
);
