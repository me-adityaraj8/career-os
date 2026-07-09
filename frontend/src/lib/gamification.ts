import type { Application, Goal } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// ── Daily Activity Map ───────────────────────────────────────────────

export function buildDailyActivity(applications: Application[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const app of applications) {
    const date = app.appliedDate ?? app.createdAt;
    if (!date) continue;
    const key = toDateKey(new Date(date));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

// ── Heatmap (GitHub-style, 20 weeks) ─────────────────────────────────

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapCellDetail extends HeatmapCell {
  applications: number;
  interviews: number;
  offers: number;
  saved: number;
  xp: number;
  isStreak: boolean;
}

export function buildDetailedDailyActivity(
  applications: Application[],
): Map<string, { total: number; applications: number; interviews: number; offers: number; saved: number; xp: number }> {
  const map = new Map<string, { total: number; applications: number; interviews: number; offers: number; saved: number; xp: number }>();

  const XP: Record<string, number> = { saved: 5, applied: 10, online_assessment: 20, interview: 30, offer: 100 };

  for (const app of applications) {
    const date = app.appliedDate ?? app.createdAt;
    if (!date) continue;
    const key = toDateKey(new Date(date));
    const entry = map.get(key) ?? { total: 0, applications: 0, interviews: 0, offers: 0, saved: 0, xp: 0 };
    entry.total++;
    entry.xp += XP[app.stage] ?? 5;
    if (app.stage === 'saved') entry.saved++;
    else if (app.stage === 'interview' || app.stage === 'online_assessment') entry.interviews++;
    else if (app.stage === 'offer') entry.offers++;
    else entry.applications++;
    map.set(key, entry);
  }
  return map;
}

export function buildHeatmap(daily: Map<string, number>, weeks = 20): HeatmapCell[][] {
  const today = new Date();
  const end = startOfDay(today);
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const weekStart = startOfWeek(start);

  const grid: HeatmapCell[][] = [];
  const cursor = new Date(weekStart);

  const max = Math.max(1, ...daily.values());
  const thresholds = [0, Math.ceil(max * 0.25), Math.ceil(max * 0.5), Math.ceil(max * 0.75)];

  function level(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    if (count <= thresholds[1]) return 1;
    if (count <= thresholds[2]) return 2;
    if (count <= thresholds[3]) return 3;
    return 4;
  }

  while (cursor <= end) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor);
      const count = daily.get(key) ?? 0;
      week.push({ date: key, count, level: level(count) });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  return grid;
}

export function buildDetailedHeatmap(
  detailed: Map<string, { total: number; applications: number; interviews: number; offers: number; saved: number; xp: number }>,
  streakDays: Set<string>,
  weeks = 20,
): HeatmapCellDetail[][] {
  const today = new Date();
  const end = startOfDay(today);
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const weekStart = startOfWeek(start);

  const totals = [...detailed.values()].map((d) => d.total);
  const max = Math.max(1, ...totals);
  const thresholds = [0, Math.ceil(max * 0.25), Math.ceil(max * 0.5), Math.ceil(max * 0.75)];

  function level(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    if (count <= thresholds[1]) return 1;
    if (count <= thresholds[2]) return 2;
    if (count <= thresholds[3]) return 3;
    return 4;
  }

  const grid: HeatmapCellDetail[][] = [];
  const cursor = new Date(weekStart);

  while (cursor <= end) {
    const week: HeatmapCellDetail[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor);
      const data = detailed.get(key);
      const count = data?.total ?? 0;
      week.push({
        date: key,
        count,
        level: level(count),
        applications: data?.applications ?? 0,
        interviews: data?.interviews ?? 0,
        offers: data?.offers ?? 0,
        saved: data?.saved ?? 0,
        xp: data?.xp ?? 0,
        isStreak: streakDays.has(key),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  return grid;
}

// ── Streaks ──────────────────────────────────────────────────────────

export interface StreakInfo {
  current: number;
  longest: number;
  todayActive: boolean;
}

export function computeStreaks(daily: Map<string, number>): StreakInfo {
  if (daily.size === 0) return { current: 0, longest: 0, todayActive: false };

  const sorted = [...daily.keys()].sort();
  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(new Date(Date.now() - 86_400_000));
  const todayActive = daily.has(todayKey);

  let longest = 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    if (daysBetween(prev, curr) === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  let current = 0;
  if (daily.has(todayKey) || daily.has(yesterdayKey)) {
    const anchor = daily.has(todayKey) ? todayKey : yesterdayKey;
    current = 1;
    let cursor = new Date(anchor);
    while (true) {
      cursor = new Date(cursor.getTime() - 86_400_000);
      if (daily.has(toDateKey(cursor))) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest, todayActive };
}

// ── Career XP ────────────────────────────────────────────────────────

export interface XPInfo {
  total: number;
  level: number;
  levelName: string;
  progress: number; // 0-100 within current level
  nextLevel: number;
}

const XP_PER_ACTION: Record<string, number> = {
  saved: 5,
  applied: 10,
  online_assessment: 20,
  interview: 30,
  offer: 100,
};

const LEVELS = [
  { threshold: 0, name: 'Newcomer' },
  { threshold: 50, name: 'Explorer' },
  { threshold: 150, name: 'Applicant' },
  { threshold: 400, name: 'Contender' },
  { threshold: 800, name: 'Competitor' },
  { threshold: 1500, name: 'Specialist' },
  { threshold: 3000, name: 'Expert' },
  { threshold: 5000, name: 'Master' },
  { threshold: 10000, name: 'Legend' },
];

export function computeXP(applications: Application[]): XPInfo {
  let total = 0;
  for (const app of applications) {
    total += XP_PER_ACTION[app.stage] ?? 5;
  }

  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (total >= LEVELS[i].threshold) {
      level = i;
      break;
    }
  }

  const current = LEVELS[level];
  const next = LEVELS[level + 1] ?? { threshold: current.threshold + 1000 };
  const range = next.threshold - current.threshold;
  const progress = Math.min(100, Math.round(((total - current.threshold) / range) * 100));

  return {
    total,
    level,
    levelName: current.name,
    progress,
    nextLevel: next.threshold,
  };
}

// ── Goal Health & ETA ────────────────────────────────────────────────

export type GoalHealth = 'completed' | 'on_track' | 'at_risk' | 'behind';

export interface GoalWithHealth extends Goal {
  health: GoalHealth;
  eta: string | null;
  pacePerDay: number;
  requiredPerDay: number;
  daysRemaining: number | null;
}

export function enrichGoals(goals: Goal[]): GoalWithHealth[] {
  const now = new Date();

  return goals.map((g) => {
    if (g.progress >= g.target) {
      return { ...g, health: 'completed' as const, eta: null, pacePerDay: 0, requiredPerDay: 0, daysRemaining: null };
    }

    const created = new Date(g.createdAt);
    const daysElapsed = Math.max(1, daysBetween(created, now));
    const pacePerDay = g.progress / daysElapsed;
    const remaining = g.target - g.progress;

    let totalDays: number | null = null;
    let daysRemaining: number | null = null;

    if (g.period === 'week') {
      const dayOfWeek = now.getDay();
      daysRemaining = Math.max(1, 7 - dayOfWeek);
      totalDays = 7;
    } else if (g.period === 'month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      daysRemaining = Math.max(1, daysBetween(now, endOfMonth));
      totalDays = endOfMonth.getDate();
    }

    const requiredPerDay = daysRemaining ? remaining / daysRemaining : 0;

    let health: GoalHealth;
    if (daysRemaining === null) {
      health = pacePerDay > 0 ? 'on_track' : 'at_risk';
    } else {
      const ratio = pacePerDay / (g.target / (totalDays ?? 30));
      if (ratio >= 0.85) health = 'on_track';
      else if (ratio >= 0.5) health = 'at_risk';
      else health = 'behind';
    }

    let eta: string | null = null;
    if (pacePerDay > 0) {
      const daysToFinish = Math.ceil(remaining / pacePerDay);
      const etaDate = new Date(now);
      etaDate.setDate(etaDate.getDate() + daysToFinish);
      eta = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return { ...g, health, eta, pacePerDay, requiredPerDay, daysRemaining };
  });
}

// ── Today's Mission ──────────────────────────────────────────────────

export interface Mission {
  id: string;
  label: string;
  progress: number;
  target: number;
  done: boolean;
  metric: string;
}

export function buildMissions(goals: Goal[]): Mission[] {
  const missions: Mission[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay();

  for (const g of goals) {
    if (g.progress >= g.target) continue;

    const remaining = g.target - g.progress;
    let dailyTarget: number;

    if (g.period === 'week') {
      const daysLeft = Math.max(1, 7 - dayOfWeek);
      dailyTarget = Math.ceil(remaining / daysLeft);
    } else if (g.period === 'month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysLeft = Math.max(1, daysBetween(now, endOfMonth));
      dailyTarget = Math.ceil(remaining / daysLeft);
    } else {
      dailyTarget = Math.max(1, Math.ceil(remaining / 30));
    }

    dailyTarget = Math.min(dailyTarget, 10);

    const metricLabel = g.metric === 'applications' ? 'applications' :
                        g.metric === 'interviews' ? 'interview prep sessions' : 'offer negotiations';

    missions.push({
      id: g.id,
      label: `${dailyTarget} ${metricLabel}`,
      progress: 0,
      target: dailyTarget,
      done: false,
      metric: g.metric,
    });
  }

  if (missions.length === 0) {
    missions.push(
      { id: 'default-apply', label: '3 applications', progress: 0, target: 3, done: false, metric: 'applications' },
      { id: 'default-network', label: '1 networking outreach', progress: 0, target: 1, done: false, metric: 'networking' },
    );
  }

  return missions.slice(0, 5);
}

// ── AI Coach Suggestions ─────────────────────────────────────────────

export interface CoachTip {
  type: 'warning' | 'success' | 'suggestion';
  message: string;
}

export function generateCoachTips(
  goals: GoalWithHealth[],
  streaks: StreakInfo,
  _xp: XPInfo,
  applications: Application[],
): CoachTip[] {
  const tips: CoachTip[] = [];

  const behind = goals.filter((g) => g.health === 'behind');
  if (behind.length > 0) {
    tips.push({
      type: 'warning',
      message: `You're falling behind on "${behind[0].title}". Try to increase your daily pace to ${Math.ceil(behind[0].requiredPerDay)} per day.`,
    });
  }

  const atRisk = goals.filter((g) => g.health === 'at_risk');
  if (atRisk.length > 0 && behind.length === 0) {
    tips.push({
      type: 'warning',
      message: `"${atRisk[0].title}" is at risk. Pick up the pace to stay on track.`,
    });
  }

  if (streaks.current >= 7) {
    tips.push({ type: 'success', message: `Amazing ${streaks.current}-day streak! Consistency is your superpower.` });
  } else if (streaks.current >= 3) {
    tips.push({ type: 'success', message: `${streaks.current}-day streak going strong. Keep the momentum!` });
  } else if (!streaks.todayActive && streaks.current > 0) {
    tips.push({ type: 'suggestion', message: "You haven't logged activity today. A small step keeps your streak alive." });
  }

  const interviewCount = applications.filter((a) => a.stage === 'interview').length;
  const appCount = applications.length;
  if (appCount > 10 && interviewCount === 0) {
    tips.push({ type: 'suggestion', message: 'No interviews yet — consider tailoring your resume or trying the AI job analyzer.' });
  }

  if (appCount > 0 && appCount < 5) {
    tips.push({ type: 'suggestion', message: 'Great start! Aim for at least 10 applications to build momentum.' });
  }

  const completed = goals.filter((g) => g.health === 'completed');
  if (completed.length > 0) {
    tips.push({ type: 'success', message: `You've completed "${completed[0].title}"! Consider setting a more ambitious target.` });
  }

  return tips.slice(0, 3);
}

// ── Week-over-Week Insights ──────────────────────────────────────────

export interface WeekInsight {
  metric: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
  trend: 'up' | 'down' | 'flat';
}

export function computeWeeklyInsights(applications: Application[]): WeekInsight[] {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  function countInRange(start: Date, end: Date, filter?: (a: Application) => boolean) {
    return applications.filter((a) => {
      const d = new Date(a.appliedDate ?? a.createdAt);
      return d >= start && d < end && (!filter || filter(a));
    }).length;
  }

  const metrics: { metric: string; filter?: (a: Application) => boolean }[] = [
    { metric: 'Applications' },
    { metric: 'Interviews', filter: (a) => a.stage === 'interview' || a.stage === 'offer' },
    { metric: 'Networking', filter: (a) => a.tags.some((t) => t.toLowerCase().includes('referral')) },
  ];

  return metrics.map(({ metric, filter }) => {
    const thisWeek = countInRange(thisWeekStart, now, filter);
    const lastWeek = countInRange(lastWeekStart, thisWeekStart, filter);
    const change = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'flat';
    return { metric, thisWeek, lastWeek, change, trend };
  });
}

// ── Goal Templates ───────────────────────────────────────────────────

export interface GoalTemplate {
  name: string;
  description: string;
  goals: { title: string; metric: 'applications' | 'interviews' | 'offers'; period: 'week' | 'month' | 'all_time'; target: number }[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    name: 'New Grad',
    description: 'Steady pace for recent graduates',
    goals: [
      { title: 'Apply to 15 roles this month', metric: 'applications', period: 'month', target: 15 },
      { title: 'Land 3 interviews this month', metric: 'interviews', period: 'month', target: 3 },
      { title: 'Get 1 offer', metric: 'offers', period: 'all_time', target: 1 },
    ],
  },
  {
    name: 'Internship',
    description: 'Focused sprint for internship season',
    goals: [
      { title: 'Apply to 10 internships per week', metric: 'applications', period: 'week', target: 10 },
      { title: 'Get 5 interviews this month', metric: 'interviews', period: 'month', target: 5 },
    ],
  },
  {
    name: 'FAANG Prep',
    description: 'High-volume targeting for top companies',
    goals: [
      { title: '25 applications this month', metric: 'applications', period: 'month', target: 25 },
      { title: '8 interviews this month', metric: 'interviews', period: 'month', target: 8 },
      { title: 'Land 2 offers', metric: 'offers', period: 'all_time', target: 2 },
    ],
  },
  {
    name: 'Career Switch',
    description: 'Strategic approach for industry changers',
    goals: [
      { title: '20 applications this month', metric: 'applications', period: 'month', target: 20 },
      { title: '4 interviews this month', metric: 'interviews', period: 'month', target: 4 },
      { title: 'Get first offer', metric: 'offers', period: 'all_time', target: 1 },
    ],
  },
];

// ── Opportunity Score ────────────────────────────────────────────────

export interface OpportunityScore {
  score: number;
  label: string;
  color: string;
  breakdown: { stage: number; priority: number; recency: number; completeness: number; tags: number };
}

const STAGE_SCORE: Record<string, number> = {
  saved: 10, applied: 25, online_assessment: 45, interview: 70, offer: 95, rejected: 5,
};

export function computeOpportunityScore(app: Application): OpportunityScore {
  const stageScore = STAGE_SCORE[app.stage] ?? 10;
  const priorityScore = app.priority === 'high' ? 20 : app.priority === 'medium' ? 12 : 5;

  const now = Date.now();
  const applied = app.appliedDate ? new Date(app.appliedDate).getTime() : new Date(app.createdAt).getTime();
  const daysSince = Math.max(0, (now - applied) / 86_400_000);
  const recencyScore = Math.max(0, 20 - Math.floor(daysSince / 3));

  let completeness = 0;
  if (app.location) completeness += 5;
  if (app.salary) completeness += 5;
  if (app.notes) completeness += 5;
  if (app.jobUrl) completeness += 3;
  if (app.resumeId) completeness += 2;

  const tagScore = Math.min(15, app.tags.length * 3 + (app.tags.some(t => t.includes('dream')) ? 5 : 0));

  const raw = stageScore + priorityScore + recencyScore + completeness + tagScore;
  const score = Math.min(100, Math.max(0, raw));

  let label: string;
  let color: string;
  if (score >= 80) { label = 'Hot'; color = 'text-emerald-500'; }
  else if (score >= 60) { label = 'Warm'; color = 'text-blue-500'; }
  else if (score >= 35) { label = 'Cool'; color = 'text-amber-500'; }
  else { label = 'Cold'; color = 'text-muted-foreground'; }

  return { score, label, color, breakdown: { stage: stageScore, priority: priorityScore, recency: recencyScore, completeness, tags: tagScore } };
}

// ── Career Timeline Events ──────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'applied' | 'interview' | 'offer' | 'rejected' | 'saved';
  company: string;
  role: string;
  detail?: string;
}

export function buildTimeline(applications: Application[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const app of applications) {
    const date = app.appliedDate ?? app.createdAt.split('T')[0];
    let type: TimelineEvent['type'];
    if (app.stage === 'offer') type = 'offer';
    else if (app.stage === 'interview' || app.stage === 'online_assessment') type = 'interview';
    else if (app.stage === 'rejected') type = 'rejected';
    else if (app.stage === 'saved') type = 'saved';
    else type = 'applied';

    events.push({ id: app.id, date, type, company: app.company, role: app.role });
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export const HEALTH_CONFIG: Record<GoalHealth, { label: string; color: string; bg: string }> = {
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  on_track: { label: 'On Track', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  at_risk: { label: 'At Risk', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  behind: { label: 'Behind', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
};
