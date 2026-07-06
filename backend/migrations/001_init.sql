-- 001_init.sql
-- Core schema: users + applications, and a shared updated_at trigger helper.
-- gen_random_uuid() is built into Postgres 13+ core (no extension needed).

-- Shared trigger function: bumps updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- users ----
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  dark_mode     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on email (store as-is, compare lowercased).
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---- applications ----
-- stage/priority are constrained via CHECK rather than native enums so the set
-- of allowed values can evolve in later migrations without ALTER TYPE friction.
CREATE TABLE applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  job_url      TEXT,
  location     TEXT,
  salary       TEXT,
  notes        TEXT,
  stage        TEXT NOT NULL DEFAULT 'saved'
                 CHECK (stage IN ('saved','applied','online_assessment','interview','offer','rejected')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high')),
  tags         TEXT[] NOT NULL DEFAULT '{}',
  applied_date DATE,
  -- position within a kanban column; lower = higher on the board.
  position     DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_user_id_idx ON applications (user_id);
CREATE INDEX applications_user_stage_idx ON applications (user_id, stage);

CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
