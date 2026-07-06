-- 004_ai.sql
-- Stored outputs of the AI features: job analyses, cover letters, interview questions.
-- is_mock records whether the row was produced by the mock fallback (no API key)
-- so the UI can label it honestly.

CREATE TABLE job_analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  resume_id       UUID REFERENCES resumes(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  summary         TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  ats_keywords    TEXT[] NOT NULL DEFAULT '{}',
  match_score     INTEGER,                       -- 0-100, null if no resume compared
  model           TEXT NOT NULL,
  is_mock         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX job_analyses_user_idx ON job_analyses (user_id);
CREATE INDEX job_analyses_application_idx ON job_analyses (application_id);

CREATE TABLE cover_letters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  model          TEXT NOT NULL,
  is_mock        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cover_letters_user_idx ON cover_letters (user_id);
CREATE INDEX cover_letters_application_idx ON cover_letters (application_id);

CREATE TRIGGER cover_letters_set_updated_at
  BEFORE UPDATE ON cover_letters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE interview_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  company        TEXT NOT NULL,
  role           TEXT NOT NULL,
  -- Array of { category: 'technical'|'behavioral'|'company', question: string }
  questions      JSONB NOT NULL DEFAULT '[]',
  model          TEXT NOT NULL,
  is_mock        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX interview_questions_user_idx ON interview_questions (user_id);
CREATE INDEX interview_questions_application_idx ON interview_questions (application_id);
