import { Response } from 'express';
import * as contactService from '../services/contactService';
import { AuthedRequest, getUserId } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  res.json({ contacts: await contactService.list(getUserId(req)) });
}

export async function create(req: AuthedRequest, res: Response): Promise<void> {
  const contact = await contactService.create(getUserId(req), req.body);
  res.status(201).json({ contact });
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const contact = await contactService.update(getUserId(req), req.params.id, req.body);
  res.json({ contact });
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await contactService.remove(getUserId(req), req.params.id);
  res.status(204).send();
}
