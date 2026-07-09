-- 006_missions.sql
-- Daily missions with persistence, ordering, completion tracking, streaks, and XP.
-- Missions reset daily but streak/XP history is preserved.

CREATE TABLE daily_missions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  target      INTEGER NOT NULL DEFAULT 1 CHECK (target > 0),
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  completed   BOOLEAN NOT NULL DEFAULT false,
  metric      TEXT NOT NULL DEFAULT 'custom'
                CHECK (metric IN ('applications','interviews','offers','networking','custom')),
  position    REAL NOT NULL DEFAULT 0,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX daily_missions_user_date_idx ON daily_missions (user_id, mission_date);

CREATE TRIGGER daily_missions_set_updated_at
  BEFORE UPDATE ON daily_missions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE mission_streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_date     DATE NOT NULL,
  missions_total  INTEGER NOT NULL DEFAULT 0,
  missions_done   INTEGER NOT NULL DEFAULT 0,
  all_completed   BOOLEAN NOT NULL DEFAULT false,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, streak_date)
);

CREATE INDEX mission_streaks_user_idx ON mission_streaks (user_id, streak_date DESC);
