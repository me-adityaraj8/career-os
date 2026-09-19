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

  const resume = await resumeService.createFromUpload(
    getUserId(req),
    {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
    { label: fields.label, tags: parseCsv(fields.tags), skills: parseCsv(fields.skills) },
  );
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
  const { buffer, downloadName, mimeType } = await resumeService.fileContents(
    getUserId(req),
    req.params.id,
  );
  // Stream from the driver rather than the filesystem so this works on hosts
  // where the uploaded file never touches local disk.
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.send(buffer);
}
