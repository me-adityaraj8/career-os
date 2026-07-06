import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InterviewRound } from '@/types';

const KEY = ['interviews'];

export function useInterviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ interviews: InterviewRound[] }>('/interviews')).data.interviews,
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<InterviewRound> & { applicationId: string }) =>
      (await api.post<{ interview: InterviewRound }>('/interviews', body)).data.interview,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<InterviewRound> & { id: string }) =>
      (await api.patch<{ interview: InterviewRound }>(`/interviews/${id}`, body)).data.interview,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/interviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
