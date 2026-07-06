import { query, withTransaction } from '../db/pool';
import type { Resume } from '../types';

interface ResumeRow {
  id: string;
  label: string;
  original_name: string;
  storage_name: string;
  mime_type: string;
  size_bytes: number;
  tags: string[];
  skills: string[];
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    label: row.label,
    originalName: row.original_name,
    storageName: row.storage_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    tags: row.tags,
    skills: row.skills,
    isDefault: row.is_default,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function list(userId: string): Promise<Resume[]> {
  const { rows } = await query<ResumeRow>(
    'SELECT * FROM resumes WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId],
  );
  return rows.map(mapResume);
}

export async function getById(userId: string, id: string): Promise<Resume | null> {
  const { rows } = await query<ResumeRow>(
    'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  return rows.length ? mapResume(rows[0]) : null;
}

export interface CreateInput {
  label: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  tags: string[];
  skills: string[];
}

export async function create(userId: string, input: CreateInput): Promise<Resume> {
  return withTransaction(async (client) => {
    // First resume for a user becomes the default automatically.
    const { rows: countRows } = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM resumes WHERE user_id = $1',
      [userId],
    );
    const isFirst = Number(countRows[0].count) === 0;

    const { rows } = await client.query<ResumeRow>(
      `INSERT INTO resumes
         (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
        input.label,
        input.originalName,
        input.storageName,
        input.mimeType,
        input.sizeBytes,
        input.tags,
        input.skills,
        isFirst,
      ],
    );
    return mapResume(rows[0]);
  });
}

export async function update(
  userId: string,
  id: string,
  patch: { label?: string; tags?: string[]; skills?: string[] },
): Promise<Resume | null> {
  const { rows } = await query<ResumeRow>(
    `UPDATE resumes
        SET label = COALESCE($3, label),
            tags = COALESCE($4, tags),
            skills = COALESCE($5, skills)
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [id, userId, patch.label ?? null, patch.tags ?? null, patch.skills ?? null],
  );
  return rows.length ? mapResume(rows[0]) : null;
}

/** Make one resume the default, clearing the flag on all the user's others. */
export async function setDefault(userId: string, id: string): Promise<Resume | null> {
  return withTransaction(async (client) => {
    const { rowCount } = await client.query(
      'UPDATE resumes SET is_default = false WHERE user_id = $1',
      [userId],
    );
    if (rowCount === 0) return null;
    const { rows } = await client.query<ResumeRow>(
      'UPDATE resumes SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId],
    );
    return rows.length ? mapResume(rows[0]) : null;
  });
}

export async function remove(userId: string, id: string): Promise<Resume | null> {
  // Return the removed row so the service can delete the file from disk.
  const { rows } = await query<ResumeRow>(
    'DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId],
  );
  return rows.length ? mapResume(rows[0]) : null;
}

/** Count applications linked to each resume — powers the "most-used resume" stat. */
export async function usageCounts(userId: string): Promise<Record<string, number>> {
  const { rows } = await query<{ resume_id: string; count: string }>(
    `SELECT resume_id, COUNT(*)::text AS count
       FROM applications
      WHERE user_id = $1 AND resume_id IS NOT NULL
      GROUP BY resume_id`,
    [userId],
  );
  return Object.fromEntries(rows.map((r) => [r.resume_id, Number(r.count)]));
}
