import * as applicationsData from '../data/applications';
import { ApiError } from '../utils/ApiError';
import type { Application } from '../types';

/**
 * Application business logic. Thin over the data layer today, but the seam where
 * cross-entity rules live (e.g. validating resume ownership when linking one).
 */
export function list(
  userId: string,
  filters: applicationsData.ListFilters,
): Promise<Application[]> {
  return applicationsData.list(userId, filters);
}

export async function get(userId: string, id: string): Promise<Application> {
  const app = await applicationsData.getById(userId, id);
  if (!app) throw ApiError.notFound('Application not found');
  return app;
}

export function create(
  userId: string,
  input: applicationsData.CreateInput,
): Promise<Application> {
  return applicationsData.create(userId, input);
}

export async function update(
  userId: string,
  id: string,
  patch: applicationsData.UpdateInput,
): Promise<Application> {
  const updated = await applicationsData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Application not found');
  return updated;
}

export async function remove(userId: string, id: string): Promise<void> {
  const ok = await applicationsData.remove(userId, id);
  if (!ok) throw ApiError.notFound('Application not found');
}

export async function reorder(
  userId: string,
  items: applicationsData.ReorderItem[],
): Promise<Application[]> {
  try {
    return await applicationsData.reorder(userId, items);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Application not found')) {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }
}

export function tags(userId: string): Promise<string[]> {
  return applicationsData.allTags(userId);
}
