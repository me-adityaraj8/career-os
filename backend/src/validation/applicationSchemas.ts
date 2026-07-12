import { z } from 'zod';

export const stageEnum = z.enum([
  'saved',
  'applied',
  'online_assessment',
  'interview',
  'offer',
  'rejected',
]);

export const priorityEnum = z.enum(['low', 'medium', 'high']);

// Accept YYYY-MM-DD (or null to clear).
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .nullable();

export const createApplicationSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  jobUrl: z.string().url().max(1000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  salary: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  stage: stageEnum.optional(),
  priority: priorityEnum.optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  appliedDate: dateString.optional(),
  resumeId: z.string().uuid().nullable().optional(),
});

// All fields optional on update, plus a numeric position for drag ordering.
export const updateApplicationSchema = createApplicationSchema
  .partial()
  .extend({ position: z.number().optional() });

// Atomic drag-and-drop reorder: the client sends the full new (stage, position)
// for every card in the affected column(s), applied in one transaction so the
// board can never land in an inconsistent, position-colliding state.
export const reorderApplicationsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        stage: stageEnum,
        position: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

export const listApplicationsQuerySchema = z.object({
  stage: stageEnum.optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

// Job-board import: the posting URL to parse into pre-filled fields.
export const importPreviewQuerySchema = z.object({
  url: z.string().url().max(1000),
});
