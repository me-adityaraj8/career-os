import { z } from 'zod';

export const missionMetricEnum = z.enum([
  'applications',
  'interviews',
  'offers',
  'networking',
  'custom',
]);

export const createMissionSchema = z.object({
  label: z.string().min(1).max(300),
  target: z.number().int().positive().max(1000).default(1),
  metric: missionMetricEnum.default('custom'),
});

export const updateMissionSchema = z.object({
  label: z.string().min(1).max(300).optional(),
  target: z.number().int().positive().max(1000).optional(),
  completed: z.boolean().optional(),
  progress: z.number().int().min(0).optional(),
});

export const reorderMissionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
