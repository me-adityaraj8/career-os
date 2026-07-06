import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Contact } from '@/types';

const KEY = ['contacts'];

export function useContacts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ contacts: Contact[] }>('/contacts')).data.contacts,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Contact>) =>
      (await api.post<{ contact: Contact }>('/contacts', body)).data.contact,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Contact> & { id: string }) =>
      (await api.patch<{ contact: Contact }>(`/contacts/${id}`, body)).data.contact,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
