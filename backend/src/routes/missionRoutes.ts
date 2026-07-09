import { Router } from 'express';
import * as missionService from '../services/missionService';
import { requireAuth, AuthedRequest, getUserId } from '../middleware/auth';
import { demoGuard } from '../middleware/demoGuard';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createMissionSchema,
  updateMissionSchema,
  reorderMissionsSchema,
} from '../validation/missionSchemas';

export const missionRouter = Router();

missionRouter.use(requireAuth);
missionRouter.use(demoGuard);

missionRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = getUserId(req);
    const [missions, streak] = await Promise.all([
      missionService.listToday(userId),
      missionService.getStreakInfo(userId),
    ]);
    res.json({ missions, streak });
  }),
);

missionRouter.post(
  '/',
  validate({ body: createMissionSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json({
      mission: await missionService.create(getUserId(req), req.body),
    });
  }),
);

missionRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateMissionSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      mission: await missionService.update(getUserId(req), req.params.id, req.body),
    });
  }),
);

missionRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    await missionService.remove(getUserId(req), req.params.id);
    res.status(204).send();
  }),
);

missionRouter.put(
  '/reorder',
  validate({ body: reorderMissionsSchema }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const missions = await missionService.reorder(getUserId(req), req.body.ids);
    res.json({ missions });
  }),
);

missionRouter.get(
  '/streak',
  asyncHandler(async (req: AuthedRequest, res) => {
    const [streak, history] = await Promise.all([
      missionService.getStreakInfo(getUserId(req)),
      missionService.getStreakHistory(getUserId(req)),
    ]);
    res.json({ streak, history });
  }),
);
