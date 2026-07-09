import { Router } from 'express';
import * as controller from '../controllers/resumeController';
import { requireAuth } from '../middleware/auth';
import { demoGuard } from '../middleware/demoGuard';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadResume } from '../middleware/upload';
import { updateResumeSchema } from '../validation/resumeSchemas';

export const resumeRouter = Router();

resumeRouter.use(requireAuth);
resumeRouter.use(demoGuard);

resumeRouter.get('/', asyncHandler(controller.list));
// Multer parses the multipart body before the controller validates text fields.
resumeRouter.post('/', uploadResume, asyncHandler(controller.create));
resumeRouter.get('/:id/download', validate({ params: idParamSchema }), asyncHandler(controller.download));
resumeRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateResumeSchema }),
  asyncHandler(controller.update),
);
resumeRouter.post('/:id/default', validate({ params: idParamSchema }), asyncHandler(controller.setDefault));
resumeRouter.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.remove));
