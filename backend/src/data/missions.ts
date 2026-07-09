import { query } from '../db/pool';

export interface MissionRow {
  id: string;
  user_id: string;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  metric: string;
  position: number;
  mission_date: string;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface StreakRow {
  id: string;
  user_id: string;
  streak_date: string;
  missions_total: number;
  missions_done: number;
  all_completed: boolean;
  xp_earned: number;
  created_at: Date;
}

export interface MissionDTO {
  id: string;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  metric: string;
  position: number;
  missionDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StreakDTO {
  date: string;
  missionsTotal: number;
  missionsDone: number;
  allCompleted: boolean;
  xpEarned: number;
}

function mapMission(row: MissionRow): MissionDTO {
  return {
    id: row.id,
    label: row.label,
    target: row.target,
    progress: row.progress,
    completed: row.completed,
    metric: row.metric,
    position: row.position,
    missionDate: row.mission_date,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapStreak(row: StreakRow): StreakDTO {
  return {
    date: row.streak_date,
    missionsTotal: row.missions_total,
    missionsDone: row.missions_done,
    allCompleted: row.all_completed,
    xpEarned: row.xp_earned,
  };
}

export async function listToday(userId: string): Promise<MissionDTO[]> {
  const { rows } = await query<MissionRow>(
    `SELECT * FROM daily_missions
     WHERE user_id = $1 AND mission_date = CURRENT_DATE
     ORDER BY position, created_at`,
    [userId],
  );
  return rows.map(mapMission);
}

export async function create(
  userId: string,
  input: { label: string; target: number; metric: string },
): Promise<MissionDTO> {
  const { rows: posRows } = await query<{ max_pos: number }>(
    `SELECT COALESCE(MAX(position), 0) + 1 AS max_pos
     FROM daily_missions WHERE user_id = $1 AND mission_date = CURRENT_DATE`,
    [userId],
  );
  const position = posRows[0].max_pos;

  const { rows } = await query<MissionRow>(
    `INSERT INTO daily_missions (user_id, label, target, metric, position)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, input.label, input.target, input.metric, position],
  );
  return mapMission(rows[0]);
}

export async function update(
  userId: string,
  id: string,
  patch: { label?: string; target?: number; completed?: boolean; progress?: number },
): Promise<MissionDTO | null> {
  const { rows } = await query<MissionRow>(
    `UPDATE daily_missions
        SET label     = COALESCE($3, label),
            target    = COALESCE($4, target),
            completed = COALESCE($5, completed),
            progress  = COALESCE($6, progress),
            completed_at = CASE
              WHEN $5 = true AND completed_at IS NULL THEN now()
              WHEN $5 = false THEN NULL
              ELSE completed_at
            END
      WHERE id = $1 AND user_id = $2 AND mission_date = CURRENT_DATE
      RETURNING *`,
    [
      id,
      userId,
      patch.label ?? null,
      patch.target ?? null,
      patch.completed ?? null,
      patch.progress ?? null,
    ],
  );
  return rows.length ? mapMission(rows[0]) : null;
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM daily_missions WHERE id = $1 AND user_id = $2 AND mission_date = CURRENT_DATE`,
    [id, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function reorder(userId: string, ids: string[]): Promise<MissionDTO[]> {
  for (let i = 0; i < ids.length; i++) {
    await query(
      `UPDATE daily_missions SET position = $3
       WHERE id = $1 AND user_id = $2 AND mission_date = CURRENT_DATE`,
      [ids[i], userId, i + 1],
    );
  }
  return listToday(userId);
}

export async function upsertStreakRecord(
  userId: string,
  date: string,
  missionsTotal: number,
  missionsDone: number,
  allCompleted: boolean,
  xpEarned: number,
): Promise<void> {
  await query(
    `INSERT INTO mission_streaks (user_id, streak_date, missions_total, missions_done, all_completed, xp_earned)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, streak_date)
     DO UPDATE SET missions_total = $3, missions_done = $4, all_completed = $5, xp_earned = $6`,
    [userId, date, missionsTotal, missionsDone, allCompleted, xpEarned],
  );
}

export async function getStreakHistory(
  userId: string,
  limit = 90,
): Promise<StreakDTO[]> {
  const { rows } = await query<StreakRow>(
    `SELECT * FROM mission_streaks
     WHERE user_id = $1
     ORDER BY streak_date DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(mapStreak);
}

export async function getMissionStreak(userId: string): Promise<{
  current: number;
  longest: number;
  todayCompleted: boolean;
}> {
  const { rows } = await query<StreakRow>(
    `SELECT * FROM mission_streaks
     WHERE user_id = $1 AND all_completed = true
     ORDER BY streak_date DESC
     LIMIT 90`,
    [userId],
  );

  if (rows.length === 0) return { current: 0, longest: 0, todayCompleted: false };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const todayCompleted = rows.some((r) => r.streak_date === today);

  const dates = rows.map((r) => r.streak_date).sort().reverse();

  let current = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86_400_000;
      if (Math.round(diff) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  let longest = 0;
  let streak = 1;
  const sorted = [...dates].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  return { current, longest, todayCompleted };
}
