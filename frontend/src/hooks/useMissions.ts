import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Mission, MissionStreak } from '@/types';

const KEY = ['missions'];

interface MissionsResponse {
  missions: Mission[];
  streak: MissionStreak;
}

export function useMissions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<MissionsResponse>('/missions')).data,
  });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { label: string; target?: number; metric?: string }) =>
      (await api.post<{ mission: Mission }>('/missions', body)).data.mission,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      label?: string;
      target?: number;
      completed?: boolean;
      progress?: number;
    }) => (await api.patch<{ mission: Mission }>(`/missions/${id}`, body)).data.mission,
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<MissionsResponse>(KEY);
      if (prev) {
        qc.setQueryData<MissionsResponse>(KEY, {
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === variables.id
              ? {
                  ...m,
                  ...(variables.completed !== undefined && { completed: variables.completed }),
                  ...(variables.progress !== undefined && { progress: variables.progress }),
                  ...(variables.label !== undefined && { label: variables.label }),
                  ...(variables.target !== undefined && { target: variables.target }),
                }
              : m,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/missions/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<MissionsResponse>(KEY);
      if (prev) {
        qc.setQueryData<MissionsResponse>(KEY, {
          ...prev,
          missions: prev.missions.filter((m) => m.id !== id),
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderMissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) =>
      (await api.put<{ missions: Mission[] }>('/missions/reorder', { ids })).data.missions,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
