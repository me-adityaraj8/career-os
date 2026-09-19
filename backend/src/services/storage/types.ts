/**
 * Storage driver contract.
 *
 * Resume PDFs need a home that survives the request that created them. On a
 * long-lived container (Docker / Render) the local disk is fine; on a
 * serverless host (Vercel) the filesystem is ephemeral, so the bytes have to
 * go to object storage instead. Both cases implement this interface, and the
 * rest of the app never learns which one it is talking to.
 */
export interface StoredFile {
  /** Opaque key persisted in `resumes.storage_name`. */
  storageName: string;
}

export interface StorageDriver {
  /** Human-readable id, surfaced in /health for debugging a deploy. */
  readonly id: 'disk' | 'supabase';
  /** Persist the bytes and return the key to store in the DB. */
  put(buffer: Buffer, contentType: string): Promise<StoredFile>;
  /** Read the bytes back. Throws if the object is missing. */
  get(storageName: string): Promise<Buffer>;
  /** Best-effort delete; a missing object is not an error. */
  remove(storageName: string): Promise<void>;
}
