import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application, Stage } from '@/types';

export interface ApplicationFilters {
  stage?: Stage;
  tag?: string;
  search?: string;
}

const KEY = ['applications'];

/** List applications. Filtering by search/tag is done client-side so drag
 *  reordering stays instant; the server filter is used for the initial fetch. */
export function useApplications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ applications: Application[] }>('/applications')).data.applications,
  });
}

export function useApplicationTags() {
  return useQuery({
    queryKey: ['application-tags'],
    queryFn: async () => (await api.get<{ tags: string[] }>('/applications/tags')).data.tags,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Application>) =>
      (await api.post<{ application: Application }>('/applications', body)).data.application,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['application-tags'] });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Application> & { id: string }) =>
      (await api.patch<{ application: Application }>(`/applications/${id}`, body)).data.application,
    // Optimistically update the cache so drag-and-drop feels instant.
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Application[]>(KEY);
      qc.setQueryData<Application[]>(KEY, (old) =>
        old?.map((a) => (a.id === vars.id ? { ...a, ...vars } : a)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
