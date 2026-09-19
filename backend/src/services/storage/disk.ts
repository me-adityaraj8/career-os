import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import type { StorageDriver, StoredFile } from './types';

/** Local-filesystem driver — used for Docker, Render, and local dev. */
export function createDiskDriver(): StorageDriver {
  const root = path.resolve(process.cwd(), env.uploadDir);
  fsSync.mkdirSync(root, { recursive: true });

  // Keys are random uuids so a hostile original filename can never escape the
  // upload directory or collide with another user's file.
  const resolve = (storageName: string) => path.join(root, path.basename(storageName));

  return {
    id: 'disk',
    async put(buffer): Promise<StoredFile> {
      const storageName = `${randomUUID()}.pdf`;
      await fs.writeFile(resolve(storageName), buffer);
      return { storageName };
    },
    get(storageName) {
      return fs.readFile(resolve(storageName));
    },
    async remove(storageName) {
      try {
        await fs.unlink(resolve(storageName));
      } catch {
        // Already gone — the DB row is the source of truth.
      }
    },
  };
}

export const diskRoot = path.resolve(process.cwd(), env.uploadDir);
