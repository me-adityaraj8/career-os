import { env } from '../../config/env';
import { gemini } from './providers/gemini';
import { groq } from './providers/groq';
import { openrouter } from './providers/openrouter';
import { ProviderError, type AiProvider, type CompletionRequest, type CompletionResult } from './providers/types';

/**
 * Provider-agnostic AI gateway.
 *
 * Providers are tried in the configured order (AI_PROVIDER_ORDER). Each is
 * retried on transient failures (timeouts, 429s, 5xx); on a config error
 * (401/400) or exhausted retries we fall through to the next provider. If every
 * configured provider fails, the call throws and callers fall back to mock mode.
 *
 * Registering a new provider is a one-line addition to REGISTRY.
 */
const REGISTRY: Record<string, AiProvider> = {
  gemini,
  groq,
  openrouter,
};

function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[ai] ${msg}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Providers that are both known and configured, in the configured order. */
export function configuredProviders(): AiProvider[] {
  return env.ai.order.map((id) => REGISTRY[id]).filter((p): p is AiProvider => Boolean(p?.isConfigured()));
}

/** The provider that would handle the next request, if any. */
export function activeProvider(): AiProvider | null {
  return configuredProviders()[0] ?? null;
}

export interface AiHealth {
  live: boolean;
  active: { id: string; label: string; model: string } | null;
  providers: { id: string; label: string; model: string; configured: boolean; active: boolean }[];
}

/** Snapshot of provider configuration for health checks and the UI banner. */
export function aiHealth(): AiHealth {
  const active = activeProvider();
  const known = env.ai.order
    .map((id) => REGISTRY[id])
    .filter((p): p is AiProvider => Boolean(p));
  return {
    live: Boolean(active),
    active: active ? { id: active.id, label: active.label, model: active.model } : null,
    providers: known.map((p) => ({
      id: p.id,
      label: p.label,
      model: p.model,
      configured: p.isConfigured(),
      active: p.id === active?.id,
    })),
  };
}

/**
 * Run a completion through the fallback chain. Returns the generated text plus
 * the provider/model that produced it. Throws only when every provider fails.
 */
export async function complete(req: CompletionRequest): Promise<CompletionResult & { provider: string }> {
  const providers = configuredProviders();
  if (providers.length === 0) throw new Error('No AI provider is configured');

  const errors: string[] = [];
  for (const provider of providers) {
    for (let attempt = 1; attempt <= env.ai.maxRetries + 1; attempt++) {
      const started = Date.now();
      try {
        const result = await provider.complete(req, env.ai.timeoutMs);
        log(`provider=${provider.id} model=${result.model} attempt=${attempt} status=ok latency=${Date.now() - started}ms`);
        return { ...result, provider: provider.id };
      } catch (err) {
        const pe = err instanceof ProviderError ? err : new ProviderError(provider.id, String(err), false);
        const willRetry = pe.retryable && attempt <= env.ai.maxRetries;
        log(
          `provider=${provider.id} attempt=${attempt} status=error latency=${Date.now() - started}ms ` +
            `retryable=${pe.retryable} next=${willRetry ? 'retry' : 'fallthrough'} msg="${pe.message}"`,
        );
        if (willRetry) {
          await sleep(Math.min(2000, 300 * 2 ** (attempt - 1)) + Math.random() * 150);
          continue;
        }
        errors.push(`${provider.id}: ${pe.message}`);
        break; // move to the next provider
      }
    }
  }
  throw new Error(`All AI providers failed — ${errors.join(' | ')}`);
}
