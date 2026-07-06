import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as usersData from '../data/users';
import { AuthedRequest, getUserId } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.json(result);
}

/** Return the currently authenticated user (used to hydrate the frontend). */
export async function me(req: AuthedRequest, res: Response): Promise<void> {
  const user = await usersData.findById(getUserId(req));
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user });
}

/** Update profile (name / dark mode preference). */
export async function updateProfile(req: AuthedRequest, res: Response): Promise<void> {
  const user = await usersData.updateUser(getUserId(req), req.body);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user });
}
