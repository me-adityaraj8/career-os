import type { Application, Contact, InterviewRound } from '@/types';

/**
 * The attention engine: turns raw pipeline data into a prioritized list of
 * things that need action today. One computation feeds both the header bell
 * and the dashboard "Needs attention" panel so the two never disagree.
 */

export type AttentionType = 'follow_up_app' | 'pending_stage' | 'contact_due' | 'interview_soon' | 'offer_open';
export type Urgency = 'high' | 'medium' | 'low';

export interface AttentionItem {
  id: string;
  type: AttentionType;
  urgency: Urgency;
  title: string;
  detail: string;
  /** Route with deep link — opens the exact record, not just a page. */
  route: string;
}

const DAY = 86_400_000;
const URGENCY_ORDER: Record<Urgency, number> = { high: 0, medium: 1, low: 2 };

export function buildAttentionItems(
  apps: Application[] = [],
  contacts: Contact[] = [],
  interviews: InterviewRound[] = [],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = Date.now();

  for (const a of apps) {
    const daysSince = Math.floor((now - new Date(a.updatedAt ?? a.createdAt).getTime()) / DAY);

    // An open offer is the single most important thing in a pipeline.
    if (a.stage === 'offer') {
      items.push({
        id: `offer-${a.id}`,
        type: 'offer_open',
        urgency: 'high',
        title: `Offer from ${a.company}`,
        detail: `${a.role} — respond or negotiate before it goes stale (${daysSince}d old).`,
        route: `/applications?open=${a.id}`,
      });
      continue;
    }
    if (a.stage === 'rejected') continue;

    if (a.stage === 'applied' && daysSince >= 14) {
      items.push({
        id: `stale-${a.id}`,
        type: 'follow_up_app',
        urgency: daysSince >= 30 ? 'high' : 'medium',
        title: `Follow up with ${a.company}`,
        detail: `${a.role} — no movement in ${daysSince} days.`,
        route: `/applications?open=${a.id}`,
      });
    }

    if ((a.stage === 'interview' || a.stage === 'online_assessment') && daysSince >= 7) {
      items.push({
        id: `pending-${a.id}`,
        type: 'pending_stage',
        urgency: 'medium',
        title: `${a.company} — pending ${daysSince}d`,
        detail: `${a.role} is sitting in ${a.stage.replace('_', ' ')}. Nudge the recruiter.`,
        route: `/applications?open=${a.id}`,
      });
    }
  }

  for (const c of contacts) {
    if (!c.followUp) continue;
    if (c.followUpDate) {
      const daysUntil = Math.floor((new Date(c.followUpDate + 'T12:00:00').getTime() - now) / DAY);
      if (daysUntil <= 2) {
        items.push({
          id: `contact-${c.id}`,
          type: 'contact_due',
          urgency: daysUntil <= 0 ? 'high' : 'medium',
          title: `Follow up with ${c.name}`,
          detail:
            daysUntil < 0
              ? `Overdue by ${-daysUntil} day${daysUntil === -1 ? '' : 's'}${c.company ? ` · ${c.company}` : ''}`
              : daysUntil === 0
                ? `Due today${c.company ? ` · ${c.company}` : ''}`
                : `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}${c.company ? ` · ${c.company}` : ''}`,
          route: '/network',
        });
      }
    } else {
      items.push({
        id: `contact-${c.id}`,
        type: 'contact_due',
        urgency: 'low',
        title: `Follow up with ${c.name}`,
        detail: c.company ? `${c.role ? `${c.role} · ` : ''}${c.company}` : 'No date set',
        route: '/network',
      });
    }
  }

  for (const r of interviews) {
    if (r.outcome !== 'pending' || !r.scheduledAt) continue;
    const hoursUntil = (new Date(r.scheduledAt).getTime() - now) / 3_600_000;
    if (hoursUntil > 0 && hoursUntil <= 48) {
      items.push({
        id: `interview-${r.id}`,
        type: 'interview_soon',
        urgency: hoursUntil <= 12 ? 'high' : 'medium',
        title: `Interview in ${hoursUntil < 24 ? `${Math.round(hoursUntil)}h` : `${Math.round(hoursUntil / 24)}d`}`,
        detail: `${r.type.replace(/_/g, ' ')} round — time to prep.`,
        route: `/applications?open=${r.applicationId}`,
      });
    }
  }

  return items.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}

/* ------------------------------------------------------------------ */
/* Snooze — client-side, per item, until end of day.                   */
/* ------------------------------------------------------------------ */

const SNOOZE_KEY = 'rys-snoozed-attention';

function readSnoozes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** Fired after a snooze so every attention surface (bell, panel) re-filters. */
export const ATTENTION_CHANGED_EVENT = 'rys:attention-changed';

/** Hide an item until tomorrow. Purely local — it re-surfaces if still relevant. */
export function snoozeAttentionItem(id: string): void {
  const snoozes = readSnoozes();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  snoozes[id] = tomorrow.getTime();
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
  window.dispatchEvent(new Event(ATTENTION_CHANGED_EVENT));
}

/** Drop snoozed items and garbage-collect expired snoozes. */
export function filterSnoozed(items: AttentionItem[]): AttentionItem[] {
  const snoozes = readSnoozes();
  const now = Date.now();
  let dirty = false;
  for (const [id, until] of Object.entries(snoozes)) {
    if (until <= now) {
      delete snoozes[id];
      dirty = true;
    }
  }
  if (dirty) localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
  return items.filter((i) => !snoozes[i.id]);
}
