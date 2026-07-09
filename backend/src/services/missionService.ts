import * as missionsData from '../data/missions';
import { ApiError } from '../utils/ApiError';

const XP_PER_MISSION = 15;
const XP_ALL_COMPLETE_BONUS = 50;

export async function listToday(userId: string) {
  return missionsData.listToday(userId);
}

export async function create(
  userId: string,
  input: { label: string; target: number; metric: string },
) {
  const mission = await missionsData.create(userId, input);
  await syncStreakRecord(userId);
  return mission;
}

export async function update(
  userId: string,
  id: string,
  patch: { label?: string; target?: number; completed?: boolean; progress?: number },
) {
  const updated = await missionsData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Mission not found');
  await syncStreakRecord(userId);
  return updated;
}

export async function remove(userId: string, id: string) {
  const ok = await missionsData.remove(userId, id);
  if (!ok) throw ApiError.notFound('Mission not found');
  await syncStreakRecord(userId);
}

export async function reorder(userId: string, ids: string[]) {
  return missionsData.reorder(userId, ids);
}

export async function getStreakInfo(userId: string) {
  return missionsData.getMissionStreak(userId);
}

export async function getStreakHistory(userId: string) {
  return missionsData.getStreakHistory(userId);
}

async function syncStreakRecord(userId: string) {
  const missions = await missionsData.listToday(userId);
  if (missions.length === 0) return;

  const total = missions.length;
  const done = missions.filter((m) => m.completed).length;
  const allCompleted = done === total && total > 0;
  const xp = done * XP_PER_MISSION + (allCompleted ? XP_ALL_COMPLETE_BONUS : 0);

  const today = new Date().toISOString().slice(0, 10);
  await missionsData.upsertStreakRecord(userId, today, total, done, allCompleted, xp);
}
