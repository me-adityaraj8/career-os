import * as contactsData from '../data/contacts';
import { ApiError } from '../utils/ApiError';
import type { Contact } from '../types';

export function list(userId: string): Promise<Contact[]> {
  return contactsData.list(userId);
}

export function create(userId: string, input: contactsData.CreateInput): Promise<Contact> {
  return contactsData.create(userId, input);
}

export async function update(
  userId: string,
  id: string,
  patch: Partial<contactsData.CreateInput>,
): Promise<Contact> {
  const updated = await contactsData.update(userId, id, patch);
  if (!updated) throw ApiError.notFound('Contact not found');
  return updated;
}

export async function remove(userId: string, id: string): Promise<void> {
  const ok = await contactsData.remove(userId, id);
  if (!ok) throw ApiError.notFound('Contact not found');
}
