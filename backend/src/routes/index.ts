import { Router } from 'express';
import { isAiLive, env } from '../config/env';
import { authRouter } from './authRoutes';
import { applicationRouter } from './applicationRoutes';
import { resumeRouter } from './resumeRoutes';
import { interviewRouter } from './interviewRoutes';
import { contactRouter } from './contactRoutes';
import { aiRouter } from './aiRoutes';
import { analyticsRouter } from './analyticsRoutes';
import { goalRouter } from './goalRoutes';
import { missionRouter } from './missionRoutes';

/**
 * API v1 router. Feature routers are mounted here as each phase is built.
 */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiMode: isAiLive ? 'live' : 'mock',
    model: env.anthropicModel,
    time: new Date().toISOString(),
  });
});

// Feature routers (added per phase):
apiRouter.use('/auth', authRouter);
apiRouter.use('/applications', applicationRouter);
apiRouter.use('/resumes', resumeRouter);
apiRouter.use('/interviews', interviewRouter);
apiRouter.use('/contacts', contactRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/goals', goalRouter);
apiRouter.use('/missions', missionRouter);
