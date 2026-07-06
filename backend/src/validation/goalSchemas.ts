import { z } from 'zod';

export const goalMetricEnum = z.enum(['applications', 'interviews', 'offers']);
export const goalPeriodEnum = z.enum(['week', 'month', 'all_time']);

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  metric: goalMetricEnum,
  target: z.number().int().positive().max(100000),
  period: goalPeriodEnum,
});

export const updateGoalSchema = createGoalSchema.partial();
