-- 003_interviews_contacts.sql
-- Interview rounds (per application) + networking CRM contacts.

CREATE TABLE interview_rounds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type           TEXT NOT NULL
                   CHECK (type IN ('coding','behavioral','system_design','online_assessment','phone_screen','other')),
  scheduled_at   TIMESTAMPTZ,
  notes          TEXT,
  outcome        TEXT NOT NULL DEFAULT 'pending'
                   CHECK (outcome IN ('pending','passed','failed','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX interview_rounds_application_idx ON interview_rounds (application_id);
CREATE INDEX interview_rounds_user_idx ON interview_rounds (user_id);

CREATE TRIGGER interview_rounds_set_updated_at
  BEFORE UPDATE ON interview_rounds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  company           TEXT,
  role              TEXT,
  relationship      TEXT NOT NULL DEFAULT 'other'
                      CHECK (relationship IN ('recruiter','alumni','referral','mentor','colleague','other')),
  email             TEXT,
  last_contact_date DATE,
  notes             TEXT,
  follow_up         BOOLEAN NOT NULL DEFAULT false,
  follow_up_date    DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contacts_user_idx ON contacts (user_id);

CREATE TRIGGER contacts_set_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
