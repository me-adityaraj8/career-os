import { Router } from 'express';
import * as controller from '../controllers/contactController';
import { requireAuth } from '../middleware/auth';
import { demoGuard } from '../middleware/demoGuard';
import { validate, idParamSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createContactSchema, updateContactSchema } from '../validation/contactSchemas';

export const contactRouter = Router();

contactRouter.use(requireAuth);
contactRouter.use(demoGuard);

contactRouter.get('/', asyncHandler(controller.list));
contactRouter.post('/', validate({ body: createContactSchema }), asyncHandler(controller.create));
contactRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateContactSchema }),
  asyncHandler(controller.update),
);
contactRouter.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.remove));
