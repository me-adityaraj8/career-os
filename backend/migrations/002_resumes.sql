-- 002_resumes.sql
-- Resume versions + link an application to the resume used for it.

CREATE TABLE resumes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,                 -- e.g. "SWE - backend focus"
  original_name TEXT NOT NULL,                 -- uploaded filename
  storage_name  TEXT NOT NULL,                 -- name on disk (uuid.pdf)
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  -- Parsed/declared skills used by the AI job analyzer for match scoring.
  skills        TEXT[] NOT NULL DEFAULT '{}',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX resumes_user_id_idx ON resumes (user_id);

CREATE TRIGGER resumes_set_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Which resume was used for a given application. SET NULL so deleting a resume
-- doesn't delete the application.
ALTER TABLE applications
  ADD COLUMN resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

CREATE INDEX applications_resume_id_idx ON applications (resume_id);
