import { env } from '../../config/env';
import { createDiskDriver } from './disk';
import { createSupabaseDriver } from './supabase';
import type { StorageDriver } from './types';

export type { StorageDriver } from './types';

/**
 * Pick the storage driver once per process.
 *
 * Explicit STORAGE_DRIVER wins; otherwise we infer: if Supabase Storage
 * credentials are present we use them, else fall back to local disk. That
 * keeps Docker/Render working with zero config while letting a serverless
 * deploy switch over just by setting the env vars.
 */
function select(): StorageDriver {
  const { driver, supabase } = env.storage;
  const configured = Boolean(supabase.url && supabase.serviceKey);

  if (driver === 'supabase' || (driver === 'auto' && configured)) {
    if (!configured) {
      throw new Error(
        'STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }
    return createSupabaseDriver();
  }
  return createDiskDriver();
}

export const storage: StorageDriver = select();
