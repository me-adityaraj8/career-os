import { query } from '../db/pool';
import type { Contact, Relationship } from '../types';

interface ContactRow {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  relationship: Relationship;
  email: string | null;
  last_contact_date: string | null; // DATE parsed as 'YYYY-MM-DD' (see pool.ts)
  notes: string | null;
  follow_up: boolean;
  follow_up_date: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    role: row.role,
    relationship: row.relationship,
    email: row.email,
    lastContactDate: row.last_contact_date,
    notes: row.notes,
    followUp: row.follow_up,
    followUpDate: row.follow_up_date,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function list(userId: string): Promise<Contact[]> {
  const { rows } = await query<ContactRow>(
    // Contacts flagged for follow-up float to the top, soonest first.
    `SELECT * FROM contacts WHERE user_id = $1
      ORDER BY follow_up DESC, follow_up_date NULLS LAST, name ASC`,
    [userId],
  );
  return rows.map(mapContact);
}

export interface CreateInput {
  name: string;
  company?: string | null;
  role?: string | null;
  relationship?: Relationship;
  email?: string | null;
  lastContactDate?: string | null;
  notes?: string | null;
  followUp?: boolean;
  followUpDate?: string | null;
}

export async function create(userId: string, input: CreateInput): Promise<Contact> {
  const { rows } = await query<ContactRow>(
    `INSERT INTO contacts
       (user_id, name, company, role, relationship, email, last_contact_date, notes, follow_up, follow_up_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      input.name,
      input.company ?? null,
      input.role ?? null,
      input.relationship ?? 'other',
      input.email ?? null,
      input.lastContactDate ?? null,
      input.notes ?? null,
      input.followUp ?? false,
      input.followUpDate ?? null,
    ],
  );
  return mapContact(rows[0]);
}

const UPDATABLE: Record<string, string> = {
  name: 'name',
  company: 'company',
  role: 'role',
  relationship: 'relationship',
  email: 'email',
  lastContactDate: 'last_contact_date',
  notes: 'notes',
  followUp: 'follow_up',
  followUpDate: 'follow_up_date',
};

export async function update(
  userId: string,
  id: string,
  patch: Partial<CreateInput>,
): Promise<Contact | null> {
  const sets: string[] = [];
  const params: unknown[] = [id, userId];
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (key in patch) {
      params.push((patch as Record<string, unknown>)[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  if (sets.length === 0) {
    const { rows } = await query<ContactRow>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return rows.length ? mapContact(rows[0]) : null;
  }
  const { rows } = await query<ContactRow>(
    `UPDATE contacts SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
    params,
  );
  return rows.length ? mapContact(rows[0]) : null;
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [id, userId]);
  return (rowCount ?? 0) > 0;
}
