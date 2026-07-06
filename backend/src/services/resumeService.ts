import fs from 'fs/promises';
import path from 'path';
import * as resumesData from '../data/resumes';
import { ApiError } from '../utils/ApiError';
import { uploadPath } from '../middleware/upload';
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

/** Delete a resume record and best-effort remove its file from disk. */
export async function remove(userId: string, id: string): Promise<void> {
  const removed = await resumesData.remove(userId, id);
  if (!removed) throw ApiError.notFound('Resume not found');
  try {
    await fs.unlink(path.join(uploadPath, removed.storageName));
  } catch {
    // File may already be gone; the DB row is what matters.
  }
}

/** Resolve the absolute path of a resume file for download, checking ownership. */
export async function filePath(
  userId: string,
  id: string,
): Promise<{ absPath: string; downloadName: string }> {
  const resume = await get(userId, id);
  return {
    absPath: path.join(uploadPath, resume.storageName),
    downloadName: resume.originalName,
  };
}
