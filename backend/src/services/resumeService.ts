import * as resumesData from '../data/resumes';
import { ApiError } from '../utils/ApiError';
import { storage } from './storage';
import type { Resume } from '../types';

export function list(userId: string): Promise<Resume[]> {
  return resumesData.list(userId);
}

export async function get(userId: string, id: string): Promise<Resume> {
  const resume = await resumesData.getById(userId, id);
  if (!resume) throw ApiError.notFound('Resume not found');
  return resume;
}

export function create(userId: string, input: resumesData.CreateInput): Promise<Resume> {
  return resumesData.create(userId, input);
}

export async function update(
  userId: string,
  id: string,
  patch: { label?: string; tags?: string[]; skills?: string[] },
): Promise<Resume> {
  const updated = await resumesData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Resume not found');
  return updated;
}

export async function setDefault(userId: string, id: string): Promise<Resume> {
  const updated = await resumesData.setDefault(userId, id);
  if (!updated) throw ApiError.notFound('Resume not found');
  return updated;
}

/** Delete a resume record and best-effort remove its stored file. */
export async function remove(userId: string, id: string): Promise<void> {
  const removed = await resumesData.remove(userId, id);
  if (!removed) throw ApiError.notFound('Resume not found');
  // Driver swallows a missing object; the DB row is what matters.
  await storage.remove(removed.storageName);
}

/** Persist an uploaded PDF and create its DB row. */
export async function createFromUpload(
  userId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  fields: { label: string; tags: string[]; skills: string[] },
): Promise<Resume> {
  const { storageName } = await storage.put(file.buffer, file.mimetype);
  return resumesData.create(userId, {
    label: fields.label,
    originalName: file.originalname,
    storageName,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    tags: fields.tags,
    skills: fields.skills,
  });
}

/** Read a resume's bytes for download, checking ownership first. */
export async function fileContents(
  userId: string,
  id: string,
): Promise<{ buffer: Buffer; downloadName: string; mimeType: string }> {
  const resume = await get(userId, id);
  return {
    buffer: await storage.get(resume.storageName),
    downloadName: resume.originalName,
    mimeType: resume.mimeType,
  };
}
