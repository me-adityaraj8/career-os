import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { StorageDriver, StoredFile } from './types';

/**
 * Supabase Storage driver — used on serverless hosts (Vercel), where the
 * filesystem is ephemeral.
 *
 * Talks to the Storage REST API directly with `fetch` rather than pulling in
 * `@supabase/supabase-js`: we need exactly three verbs, and keeping the
 * dependency out means a smaller serverless bundle and a faster cold start.
 *
 * Uses the service-role key, so the bucket can (and should) stay private —
 * downloads are proxied through the authenticated /resumes/:id/download route,
 * which already checks ownership.
 */
export function createSupabaseDriver(): StorageDriver {
  const { url, serviceKey, bucket } = env.storage.supabase;
  const base = `${url.replace(/\/$/, '')}/storage/v1/object`;
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };

  return {
    id: 'supabase',

    async put(buffer, contentType): Promise<StoredFile> {
      const storageName = `${randomUUID()}.pdf`;
      const res = await fetch(`${base}/${bucket}/${storageName}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': contentType, 'cache-control': '3600' },
        body: new Uint8Array(buffer),
      });
      if (!res.ok) {
        // Log the upstream detail server-side; return a generic message so a
        // storage misconfiguration never leaks internals to the client.
        // eslint-disable-next-line no-console
        console.error('Supabase Storage upload failed', res.status, await res.text());
        throw new ApiError(502, 'Could not store the file. Please try again.', 'storage_error');
      }
      return { storageName };
    },

    async get(storageName): Promise<Buffer> {
      const res = await fetch(`${base}/${bucket}/${encodeURIComponent(storageName)}`, { headers });
      if (res.status === 404) throw ApiError.notFound('Resume file not found');
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('Supabase Storage download failed', res.status);
        throw new ApiError(502, 'Could not read the file. Please try again.', 'storage_error');
      }
      return Buffer.from(await res.arrayBuffer());
    },

    async remove(storageName): Promise<void> {
      // Best-effort: a missing object must not block deleting the DB row.
      try {
        await fetch(`${base}/${bucket}/${encodeURIComponent(storageName)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        /* ignore */
      }
    },
  };
}
