import { z } from 'zod';

export const interviewTypeEnum = z.enum([
  'coding',
  'behavioral',
  'system_design',
  'online_assessment',
  'phone_screen',
  'other',
]);

export const interviewOutcomeEnum = z.enum(['pending', 'passed', 'failed', 'cancelled']);

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  type: interviewTypeEnum,
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  outcome: interviewOutcomeEnum.optional(),
});

export const updateInterviewSchema = z.object({
  type: interviewTypeEnum.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  outcome: interviewOutcomeEnum.optional(),
});

export const listInterviewsQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
});
