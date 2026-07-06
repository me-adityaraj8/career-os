import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AnalyticsSummary } from '@/types';

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get<{ summary: AnalyticsSummary }>('/analytics/summary')).data.summary,
  });
}
