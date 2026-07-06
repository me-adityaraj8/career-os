import * as interviewsData from '../data/interviews';
import * as applicationsData from '../data/applications';
import { ApiError } from '../utils/ApiError';
import type { InterviewRound } from '../types';

export function list(userId: string, applicationId?: string): Promise<InterviewRound[]> {
  return interviewsData.list(userId, applicationId);
}

export async function create(
  userId: string,
  input: interviewsData.CreateInput,
): Promise<InterviewRound> {
  // Ensure the target application belongs to the user before attaching a round.
  const app = await applicationsData.getById(userId, input.applicationId);
  if (!app) throw ApiError.badRequest('Application not found');
  return interviewsData.create(userId, input);
}

export async function update(
  userId: string,
  id: string,
  patch: interviewsData.UpdateInput,
): Promise<InterviewRound> {
  const updated = await interviewsData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Interview round not found');
  return updated;
}

export async function remove(userId: string, id: string): Promise<void> {
  const ok = await interviewsData.remove(userId, id);
  if (!ok) throw ApiError.notFound('Interview round not found');
}
