import { z } from 'zod';

export const analyzeJobSchema = z.object({
  jobDescription: z.string().min(20, 'Job description is too short').max(20000),
  applicationId: z.string().uuid().nullable().optional(),
  resumeId: z.string().uuid().nullable().optional(),
});

export const coverLetterSchema = z.object({
  jobDescription: z.string().min(20).max(20000),
  applicationId: z.string().uuid().nullable().optional(),
  resumeId: z.string().uuid().nullable().optional(),
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
});

export const updateCoverLetterSchema = z.object({
  content: z.string().min(1).max(20000),
});

export const interviewQuestionsSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  jobDescription: z.string().max(20000).nullable().optional(),
  applicationId: z.string().uuid().nullable().optional(),
});

export const aiListQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
});
