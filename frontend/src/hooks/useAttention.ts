import { useEffect, useMemo, useState } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { useContacts } from '@/hooks/useContacts';
import { useInterviews } from '@/hooks/useInterviews';
import {
  ATTENTION_CHANGED_EVENT,
  buildAttentionItems,
  filterSnoozed,
  type AttentionItem,
} from '@/lib/attention';

/**
 * Live attention items for the current user — computed from applications,
 * contacts, and interviews, minus snoozed entries. Every surface (header
 * bell, dashboard panel) uses this hook so counts always agree; a snooze
 * anywhere updates everywhere via ATTENTION_CHANGED_EVENT.
 */
export function useAttention(): AttentionItem[] {
  const { data: apps } = useApplications();
  const { data: contacts } = useContacts();
  const { data: interviews } = useInterviews();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(ATTENTION_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ATTENTION_CHANGED_EVENT, bump);
  }, []);

  return useMemo(
    () => filterSnoozed(buildAttentionItems(apps, contacts, interviews)),
    [apps, contacts, interviews, tick],
  );
}
