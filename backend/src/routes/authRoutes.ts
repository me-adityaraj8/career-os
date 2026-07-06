import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { loginSchema, registerSchema, updateProfileSchema } from '../validation/authSchemas';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(authController.register));
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  asyncHandler(authController.updateProfile),
);
