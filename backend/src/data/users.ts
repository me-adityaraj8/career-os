import { query } from '../db/pool';
import type { User } from '../types';

/**
 * Data-access layer for users. All SQL touching the users table lives here.
 * Row shape has snake_case columns; `mapUser` converts to the camelCase DTO.
 */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  dark_mode: boolean;
  created_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    darkMode: row.dark_mode,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findByEmail(
  email: string,
): Promise<(User & { passwordHash: string }) | null> {
  const { rows } = await query<UserRow>(
    'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );
  if (rows.length === 0) return null;
  return { ...mapUser(rows[0]), passwordHash: rows[0].password_hash };
}

export async function findById(id: string): Promise<User | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows.length ? mapUser(rows[0]) : null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> {
  const { rows } = await query<UserRow>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3) RETURNING *`,
    [input.email, input.passwordHash, input.name],
  );
  return mapUser(rows[0]);
}

/** Update mutable profile fields (name and/or dark mode). Returns updated user. */
export async function updateUser(
  id: string,
  patch: { name?: string; darkMode?: boolean },
): Promise<User | null> {
  const { rows } = await query<UserRow>(
    `UPDATE users
        SET name = COALESCE($2, name),
            dark_mode = COALESCE($3, dark_mode)
      WHERE id = $1
      RETURNING *`,
    [id, patch.name ?? null, patch.darkMode ?? null],
  );
  return rows.length ? mapUser(rows[0]) : null;
}
