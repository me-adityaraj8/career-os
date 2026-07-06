import { query } from '../db/pool';
import type { InterviewOutcome, InterviewRound, InterviewType } from '../types';

interface InterviewRow {
  id: string;
  application_id: string;
  type: InterviewType;
  scheduled_at: Date | null;
  notes: string | null;
  outcome: InterviewOutcome;
  created_at: Date;
  updated_at: Date;
}

function mapRound(row: InterviewRow): InterviewRound {
  return {
    id: row.id,
    applicationId: row.application_id,
    type: row.type,
    scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : null,
    notes: row.notes,
    outcome: row.outcome,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** List rounds, optionally scoped to one application. Always scoped to the user. */
export async function list(userId: string, applicationId?: string): Promise<InterviewRound[]> {
  const params: unknown[] = [userId];
  let where = 'user_id = $1';
  if (applicationId) {
    params.push(applicationId);
    where += ` AND application_id = $2`;
  }
  const { rows } = await query<InterviewRow>(
    `SELECT * FROM interview_rounds WHERE ${where} ORDER BY scheduled_at NULLS LAST, created_at DESC`,
    params,
  );
  return rows.map(mapRound);
}

export interface CreateInput {
  applicationId: string;
  type: InterviewType;
  scheduledAt?: string | null;
  notes?: string | null;
  outcome?: InterviewOutcome;
}

export async function create(userId: string, input: CreateInput): Promise<InterviewRound> {
  const { rows } = await query<InterviewRow>(
    `INSERT INTO interview_rounds (user_id, application_id, type, scheduled_at, notes, outcome)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      userId,
      input.applicationId,
      input.type,
      input.scheduledAt ?? null,
      input.notes ?? null,
      input.outcome ?? 'pending',
    ],
  );
  return mapRound(rows[0]);
}

export type UpdateInput = Partial<Omit<CreateInput, 'applicationId'>>;

export async function update(
  userId: string,
  id: string,
  patch: UpdateInput,
): Promise<InterviewRound | null> {
  const { rows } = await query<InterviewRow>(
    `UPDATE interview_rounds
        SET type = COALESCE($3, type),
            scheduled_at = COALESCE($4, scheduled_at),
            notes = COALESCE($5, notes),
            outcome = COALESCE($6, outcome)
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [id, userId, patch.type ?? null, patch.scheduledAt ?? null, patch.notes ?? null, patch.outcome ?? null],
  );
  return rows.length ? mapRound(rows[0]) : null;
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query('DELETE FROM interview_rounds WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return (rowCount ?? 0) > 0;
}
