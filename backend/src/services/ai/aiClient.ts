import { complete } from './gateway';
import { ApiError } from '../../utils/ApiError';

/**
 * Thin task-shaped wrapper over the provider-agnostic gateway.
 *
 * - `callText` returns free-form text (e.g. a cover letter).
 * - `callJson` requests JSON mode and robustly parses the first JSON object
 *   from the response (providers occasionally wrap JSON in prose or fences).
 *
 * Both return the concrete model that produced the text so callers can record it.
 */

/** Pull a JSON object out of a model response, tolerating fences/prose. */
function parseJsonLoose<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Strip ```json fences, then grab the outermost { … } span.
    const unfenced = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1)) as T;
    }
    throw new Error('AI response was not valid JSON');
  }
}

/** Map a total-provider-failure into a clean, user-facing 503. */
function unavailable(err: unknown): never {
  throw new ApiError(
    503,
    'AI is temporarily unavailable — all providers failed. Please try again shortly.',
    'ai_unavailable',
    err instanceof Error ? err.message : undefined,
  );
}

export async function callJson<T>(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ data: T; model: string; provider: string }> {
  let result;
  try {
    result = await complete({
      system: `${params.system}\n\nRespond with ONLY a single valid JSON object — no prose, no markdown fences.`,
      prompt: params.prompt,
      maxTokens: params.maxTokens ?? 2048,
      json: true,
    });
  } catch (err) {
    unavailable(err);
  }
  try {
    return { data: parseJsonLoose<T>(result.text), model: result.model, provider: result.provider };
  } catch {
    throw new ApiError(502, 'The AI returned an unexpected response. Please try again.', 'ai_bad_response');
  }
}

export async function callText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string; model: string; provider: string }> {
  try {
    const { text, model, provider } = await complete({
      system: params.system,
      prompt: params.prompt,
      maxTokens: params.maxTokens ?? 1500,
    });
    return { text: text.trim(), model, provider };
  } catch (err) {
    unavailable(err);
  }
}
