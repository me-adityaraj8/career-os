import { fetchAnalyticsInput } from '../../data/analytics';
import { computeAnalytics, AnalyticsSummary } from './computeAnalytics';

/** Fetch a user's application data and compute their analytics summary. */
export async function getSummary(userId: string): Promise<AnalyticsSummary> {
  const input = await fetchAnalyticsInput(userId);
  return computeAnalytics(input);
}
