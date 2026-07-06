import { Router } from 'express';
import * as analyticsService from '../services/analytics/analyticsService';
import { requireAuth, AuthedRequest, getUserId } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get(
  '/summary',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ summary: await analyticsService.getSummary(getUserId(req)) });
  }),
);
