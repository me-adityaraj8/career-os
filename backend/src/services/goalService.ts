import * as goalsData from '../data/goals';
import { ApiError } from '../utils/ApiError';
import type { Goal, GoalMetric, GoalPeriod } from '../types';

/** Attach computed progress (count toward target) to a goal. */
async function withProgress(
  userId: string,
  goal: Omit<Goal, 'progress'>,
): Promise<Goal> {
  const progress = await goalsData.countForGoal(userId, goal.metric, goal.period);
  return { ...goal, progress };
}

export async function list(userId: string): Promise<Goal[]> {
  const goals = await goalsData.list(userId);
  return Promise.all(goals.map((g) => withProgress(userId, g)));
}

export async function create(
  userId: string,
  input: { title: string; metric: GoalMetric; target: number; period: GoalPeriod },
): Promise<Goal> {
  return withProgress(userId, await goalsData.create(userId, input));
}

export async function update(
  userId: string,
  id: string,
  patch: { title?: string; metric?: GoalMetric; target?: number; period?: GoalPeriod },
): Promise<Goal> {
  const updated = await goalsData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Goal not found');
  return withProgress(userId, updated);
}

export async function remove(userId: string, id: string): Promise<void> {
  const ok = await goalsData.remove(userId, id);
  if (!ok) throw ApiError.notFound('Goal not found');
}
