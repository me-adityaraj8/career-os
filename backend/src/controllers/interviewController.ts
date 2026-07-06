import { Response } from 'express';
import * as interviewService from '../services/interviewService';
import { AuthedRequest, getUserId } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const { applicationId } = req.query as { applicationId?: string };
  res.json({ interviews: await interviewService.list(getUserId(req), applicationId) });
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const round = await interviewService.create(getUserId(req), req.body);
  res.status(201).json({ interview: round });
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const round = await interviewService.update(getUserId(req), req.params.id, req.body);
  res.json({ interview: round });
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await interviewService.remove(getUserId(req), req.params.id);
  res.status(204).send();
}
