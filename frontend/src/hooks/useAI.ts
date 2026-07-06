import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JobAnalysis, CoverLetter, InterviewQuestionSet } from '@/types';

/** Whether the backend has a live API key or is running mock AI. */
export function useAIStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => (await api.get<{ mode: 'live' | 'mock'; model: string }>('/ai/status')).data,
    staleTime: Infinity,
  });
}

export function useAnalyzeJob() {
  return useMutation({
    mutationFn: async (body: {
      jobDescription: string;
      applicationId?: string | null;
      resumeId?: string | null;
    }) => (await api.post<{ analysis: JobAnalysis }>('/ai/analyze-job', body)).data.analysis,
  });
}

export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: async (body: {
      jobDescription: string;
      company?: string;
      role?: string;
      applicationId?: string | null;
      resumeId?: string | null;
    }) => (await api.post<{ coverLetter: CoverLetter }>('/ai/cover-letter', body)).data.coverLetter,
  });
}

export function useUpdateCoverLetter() {
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) =>
      (await api.patch<{ coverLetter: CoverLetter }>(`/ai/cover-letters/${id}`, { content })).data
        .coverLetter,
  });
}

export function useGenerateInterviewQuestions() {
  return useMutation({
    mutationFn: async (body: {
      company: string;
      role: string;
      jobDescription?: string | null;
      applicationId?: string | null;
    }) =>
      (await api.post<{ questionSet: InterviewQuestionSet }>('/ai/interview-questions', body)).data
        .questionSet,
  });
}
