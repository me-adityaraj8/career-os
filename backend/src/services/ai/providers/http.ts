import { ProviderError } from './types';

/**
 * POST JSON to a provider endpoint with a hard timeout, returning the parsed
 * response. Classifies failures into retryable (network/timeout/429/5xx) vs.
 * non-retryable (4xx config errors) via ProviderError.
 */
export async function postJson(
  provider: string,
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ProviderError(provider, aborted ? `timed out after ${timeoutMs}ms` : 'network error', true);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    // 429 (rate limit) and 5xx are transient; retry then fall through.
    const retryable = res.status === 429 || res.status >= 500;
    throw new ProviderError(provider, `HTTP ${res.status}${detail ? `: ${detail}` : ''}`, retryable, res.status);
  }

  return res.json();
}
