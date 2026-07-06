-- 005_goals.sql
-- Simple goals. Progress is COMPUTED from application data at read time, not stored,
-- so it never drifts out of sync with the underlying applications.

CREATE TABLE goals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  -- what we count toward the goal
  metric     TEXT NOT NULL
               CHECK (metric IN ('applications','interviews','offers')),
  target     INTEGER NOT NULL CHECK (target > 0),
  -- window the count is measured over
  period     TEXT NOT NULL DEFAULT 'month'
               CHECK (period IN ('week','month','all_time')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX goals_user_idx ON goals (user_id);

CREATE TRIGGER goals_set_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
