import { Response } from 'express';
import * as resumeService from '../services/resumeService';
import { AuthedRequest, getUserId } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { createResumeSchema, parseCsv } from '../validation/resumeSchemas';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  res.json({ resumes: await resumeService.list(getUserId(req)) });
}

/** Handle a multipart upload: validate the text fields and persist the record. */
export async function create(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.file) throw ApiError.badRequest('A PDF file is required');
  const fields = createResumeSchema.parse(req.body);

  const resume = await resumeService.create(getUserId(req), {
    label: fields.label,
    originalName: req.file.originalname,
    storageName: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    tags: parseCsv(fields.tags),
    skills: parseCsv(fields.skills),
  });
  res.status(201).json({ resume });
}

export async function update(req: AuthedRequest, res: Response): Promise<void> {
  const resume = await resumeService.update(getUserId(req), req.params.id, req.body);
  res.json({ resume });
}

export async function setDefault(req: AuthedRequest, res: Response): Promise<void> {
  const resume = await resumeService.setDefault(getUserId(req), req.params.id);
  res.json({ resume });
}

export async function remove(req: AuthedRequest, res: Response): Promise<void> {
  await resumeService.remove(getUserId(req), req.params.id);
  res.status(204).send();
}

export async function download(req: AuthedRequest, res: Response): Promise<void> {
  const { absPath, downloadName } = await resumeService.filePath(getUserId(req), req.params.id);
  res.download(absPath, downloadName);
}
