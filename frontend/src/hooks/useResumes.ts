import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Resume } from '@/types';

const KEY = ['resumes'];

export function useResumes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ resumes: Resume[] }>('/resumes')).data.resumes,
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; label: string; tags: string; skills: string }) => {
      const form = new FormData();
      form.append('file', input.file);
      form.append('label', input.label);
      form.append('tags', input.tags);
      form.append('skills', input.skills);
      return (await api.post<{ resume: Resume }>('/resumes', form)).data.resume;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; label?: string; tags?: string[]; skills?: string[] }) =>
      (await api.patch<{ resume: Resume }>(`/resumes/${id}`, patch)).data.resume,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetDefaultResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.post(`/resumes/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Download a resume PDF via an authenticated blob request and open it. */
export async function downloadResume(resume: Resume): Promise<void> {
  const res = await api.get(`/resumes/${resume.id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resume.originalName;
  a.click();
  URL.revokeObjectURL(url);
}
