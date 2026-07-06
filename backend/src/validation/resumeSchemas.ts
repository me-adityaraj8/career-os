import { z } from 'zod';

// Multipart text fields arrive as strings; tags/skills come as comma-separated.
export const createResumeSchema = z.object({
  label: z.string().min(1).max(200),
  tags: z.string().optional(),
  skills: z.string().optional(),
});

export const updateResumeSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  tags: z.array(z.string().min(1).max(50)).max(30).optional(),
  skills: z.array(z.string().min(1).max(50)).max(60).optional(),
});

/** Split a comma-separated field into a clean string array. */
export function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
