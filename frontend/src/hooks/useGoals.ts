import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Goal } from '@/types';

const KEY = ['goals'];

export function useGoals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ goals: Goal[] }>('/goals')).data.goals,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Goal>) =>
      (await api.post<{ goal: Goal }>('/goals', body)).data.goal,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Goal> & { id: string }) =>
      (await api.patch<{ goal: Goal }>(`/goals/${id}`, body)).data.goal,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
