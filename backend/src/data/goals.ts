import { query } from '../db/pool';
import type { Goal, GoalMetric, GoalPeriod } from '../types';

interface GoalRow {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  created_at: Date;
  updated_at: Date;
}

/** Map a row to a Goal DTO. Progress is filled in by the service layer. */
function mapGoal(row: GoalRow): Omit<Goal, 'progress'> {
  return {
    id: row.id,
    title: row.title,
    metric: row.metric,
    target: row.target,
    period: row.period,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function list(userId: string): Promise<Array<Omit<Goal, 'progress'>>> {
  const { rows } = await query<GoalRow>(
    'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return rows.map(mapGoal);
}

export async function create(
  userId: string,
  input: { title: string; metric: GoalMetric; target: number; period: GoalPeriod },
): Promise<Omit<Goal, 'progress'>> {
  const { rows } = await query<GoalRow>(
    `INSERT INTO goals (user_id, title, metric, target, period)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, input.title, input.metric, input.target, input.period],
  );
  return mapGoal(rows[0]);
}

export async function update(
  userId: string,
  id: string,
  patch: { title?: string; metric?: GoalMetric; target?: number; period?: GoalPeriod },
): Promise<Omit<Goal, 'progress'> | null> {
  const { rows } = await query<GoalRow>(
    `UPDATE goals
        SET title = COALESCE($3, title),
            metric = COALESCE($4, metric),
            target = COALESCE($5, target),
            period = COALESCE($6, period)
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [id, userId, patch.title ?? null, patch.metric ?? null, patch.target ?? null, patch.period ?? null],
  );
  return rows.length ? mapGoal(rows[0]) : null;
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
  return (rowCount ?? 0) > 0;
}

/**
 * Count the current progress toward a goal from live application data.
 *
 * - applications: applications actually applied to (stage past "saved")
 * - interviews:   applications that reached interview/offer
 * - offers:       applications with an offer
 *
 * The period filters by applied_date: 'week'/'month' use the start of the
 * current calendar week/month; 'all_time' applies no date filter.
 */
export async function countForGoal(
  userId: string,
  metric: GoalMetric,
  period: GoalPeriod,
): Promise<number> {
  const stageCondition =
    metric === 'applications'
      ? `stage <> 'saved'`
      : metric === 'interviews'
        ? `stage IN ('interview','offer')`
        : `stage = 'offer'`;

  // Only apply a date window for week/month goals.
  const dateCondition =
    period === 'all_time'
      ? ''
      : `AND applied_date >= date_trunc('${period}', CURRENT_DATE)`;

  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM applications
      WHERE user_id = $1 AND ${stageCondition} ${dateCondition}`,
    [userId],
  );
  return Number(rows[0].count);
}
