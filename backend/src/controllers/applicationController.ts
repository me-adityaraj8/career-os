import { Response } from 'express';
import * as applicationService from '../services/applicationService';
import { AuthedRequest, getUserId } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const { stage, tag, search } = req.query as { stage?: never; tag?: string; search?: string };
  const items = await applicationService.list(getUserId(req), { stage, tag, search });
  res.json({ applications: items });
}

export async function tags(req: AuthedRequest, res: Response): Promise<void> {
  res.json({ tags: await applicationService.tags(getUserId(req)) });
}

export async function get(req: AuthedRequest, res: Response): Promise<void> {
  const app = await applicationService.get(getUserId(req), req.params.id);
  res.json({ application: app });
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const app = await applicationService.create(getUserId(req), req.body);
  res.status(201).json({ application: app });
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const app = await applicationService.update(getUserId(req), req.params.id, req.body);
  res.json({ application: app });
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await applicationService.remove(getUserId(req), req.params.id);
  res.status(204).send();
}
