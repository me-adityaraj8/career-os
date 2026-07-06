import { z } from 'zod';

export const relationshipEnum = z.enum([
  'recruiter',
  'alumni',
  'referral',
  'mentor',
  'colleague',
  'other',
]);

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').nullable();

export const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).nullable().optional(),
  role: z.string().max(200).nullable().optional(),
  relationship: relationshipEnum.optional(),
  email: z.string().email().max(255).nullable().optional(),
  lastContactDate: dateString.optional(),
  notes: z.string().max(5000).nullable().optional(),
  followUp: z.boolean().optional(),
  followUpDate: dateString.optional(),
});

export const updateContactSchema = createContactSchema.partial();
