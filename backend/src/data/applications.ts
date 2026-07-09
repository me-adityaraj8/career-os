import { query, withTransaction } from '../db/pool';
import type { Application, Priority, Stage } from '../types';

/**
 * Data-access layer for applications. Every query is scoped by user_id so users
 * can only ever touch their own rows.
 */
interface ApplicationRow {
  id: string;
  company: string;
  role: string;
  job_url: string | null;
  location: string | null;
  salary: string | null;
  notes: string | null;
  stage: Stage;
  priority: Priority;
  tags: string[];
  applied_date: string | null; // DATE parsed as 'YYYY-MM-DD' (see pool.ts)
  resume_id: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jobUrl: row.job_url,
    location: row.location,
    salary: row.salary,
    notes: row.notes,
    stage: row.stage,
    priority: row.priority,
    tags: row.tags,
    appliedDate: row.applied_date,
    resumeId: row.resume_id,
    position: Number(row.position),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export interface ListFilters {
  stage?: Stage;
  tag?: string;
  search?: string;
}

export async function list(userId: string, filters: ListFilters = {}): Promise<Application[]> {
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];

  if (filters.stage) {
    params.push(filters.stage);
    conditions.push(`stage = $${params.length}`);
  }
  if (filters.tag) {
    params.push(filters.tag);
    conditions.push(`$${params.length} = ANY(tags)`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(company ILIKE $${params.length} OR role ILIKE $${params.length})`);
  }

  const { rows } = await query<ApplicationRow>(
    `SELECT * FROM applications
      WHERE ${conditions.join(' AND ')}
      ORDER BY stage, position ASC, created_at DESC`,
    params,
  );
  return rows.map(mapApplication);
}

export async function getById(userId: string, id: string): Promise<Application | null> {
  const { rows } = await query<ApplicationRow>(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  return rows.length ? mapApplication(rows[0]) : null;
}

export interface CreateInput {
  company: string;
  role: string;
  jobUrl?: string | null;
  location?: string | null;
  salary?: string | null;
  notes?: string | null;
  stage?: Stage;
  priority?: Priority;
  tags?: string[];
  appliedDate?: string | null;
  resumeId?: string | null;
}

export async function create(userId: string, input: CreateInput): Promise<Application> {
  const stage = input.stage ?? 'saved';
  // Place the new card at the bottom of its stage column.
  const { rows: posRows } = await query<{ next: number }>(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM applications WHERE user_id = $1 AND stage = $2',
    [userId, stage],
  );

  const { rows } = await query<ApplicationRow>(
    `INSERT INTO applications
       (user_id, company, role, job_url, location, salary, notes, stage, priority, tags, applied_date, resume_id, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      userId,
      input.company,
      input.role,
      input.jobUrl ?? null,
      input.location ?? null,
      input.salary ?? null,
      input.notes ?? null,
      stage,
      input.priority ?? 'medium',
      input.tags ?? [],
      input.appliedDate ?? null,
      input.resumeId ?? null,
      posRows[0].next,
    ],
  );
  return mapApplication(rows[0]);
}

export type UpdateInput = Partial<CreateInput> & { position?: number };

// Whitelist of updatable columns mapped from DTO keys to SQL columns.
const UPDATABLE: Record<string, string> = {
  company: 'company',
  role: 'role',
  jobUrl: 'job_url',
  location: 'location',
  salary: 'salary',
  notes: 'notes',
  stage: 'stage',
  priority: 'priority',
  tags: 'tags',
  appliedDate: 'applied_date',
  resumeId: 'resume_id',
  position: 'position',
};

export async function update(
  userId: string,
  id: string,
  patch: UpdateInput,
): Promise<Application | null> {
  const sets: string[] = [];
  const params: unknown[] = [id, userId];

  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (key in patch) {
      params.push((patch as Record<string, unknown>)[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) return getById(userId, id);

  const { rows } = await query<ApplicationRow>(
    `UPDATE applications SET ${sets.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    params,
  );
  return rows.length ? mapApplication(rows[0]) : null;
}

export interface ReorderItem {
  id: string;
  stage: Stage;
  position: number;
}

/**
 * Atomically apply a drag-and-drop reorder. Every affected card's new stage and
 * position is written in a single transaction, so the board never observes a
 * half-applied move or two cards sharing a position. Returns the full updated
 * list for the user so the client can resync in one round-trip.
 *
 * Rows are locked FOR UPDATE up front to serialize concurrent reorders, and any
 * id not owned by the user is rejected (the whole transaction rolls back).
 */
export async function reorder(userId: string, items: ReorderItem[]): Promise<Application[]> {
  return withTransaction(async (client) => {
    const ids = items.map((i) => i.id);

    // Lock the target rows and confirm ownership before mutating anything.
    const { rows: owned } = await client.query<{ id: string }>(
      'SELECT id FROM applications WHERE user_id = $1 AND id = ANY($2::uuid[]) FOR UPDATE',
      [userId, ids],
    );
    if (owned.length !== ids.length) {
      const ownedSet = new Set(owned.map((r) => r.id));
      const missing = ids.find((id) => !ownedSet.has(id));
      throw new Error(`Application not found: ${missing}`);
    }

    // Apply every move. UPDATE ... FROM (VALUES ...) is one statement, but we
    // keep it explicit per row for clarity and to bound the parameter count.
    for (const item of items) {
      await client.query(
        'UPDATE applications SET stage = $1, position = $2 WHERE id = $3 AND user_id = $4',
        [item.stage, item.position, item.id, userId],
      );
    }

    const { rows } = await client.query<ApplicationRow>(
      `SELECT * FROM applications WHERE user_id = $1
        ORDER BY stage, position ASC, created_at DESC`,
      [userId],
    );
    return rows.map(mapApplication);
  });
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query('DELETE FROM applications WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return (rowCount ?? 0) > 0;
}

/** Distinct tags across a user's applications (for filter dropdowns). */
export async function allTags(userId: string): Promise<string[]> {
  const { rows } = await query<{ tag: string }>(
    `SELECT DISTINCT unnest(tags) AS tag FROM applications WHERE user_id = $1 ORDER BY tag`,
    [userId],
  );
  return rows.map((r) => r.tag);
}
