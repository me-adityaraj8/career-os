import { Router } from 'express';
import * as controller from '../controllers/aiController';
import { requireAuth } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  analyzeJobSchema,
  coverLetterSchema,
  updateCoverLetterSchema,
  interviewQuestionsSchema,
  aiListQuerySchema,
} from '../validation/aiSchemas';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get('/status', asyncHandler(controller.status));

// Job analyzer
aiRouter.post('/analyze-job', validate({ body: analyzeJobSchema }), asyncHandler(controller.analyzeJob));
aiRouter.get('/analyses', validate({ query: aiListQuerySchema }), asyncHandler(controller.listAnalyses));

// Cover letter generator
aiRouter.post('/cover-letter', validate({ body: coverLetterSchema }), asyncHandler(controller.coverLetter));
aiRouter.get('/cover-letters', validate({ query: aiListQuerySchema }), asyncHandler(controller.listCoverLetters));
aiRouter.patch(
  '/cover-letters/:id',
  validate({ params: idParamSchema, body: updateCoverLetterSchema }),
  asyncHandler(controller.updateCoverLetter),
);

// Interview coach
aiRouter.post(
  '/interview-questions',
  validate({ body: interviewQuestionsSchema }),
  asyncHandler(controller.interviewQuestions),
);
aiRouter.get(
  '/interview-questions',
  validate({ query: aiListQuerySchema }),
  asyncHandler(controller.listQuestions),
);
