/** A single text-generation request, provider-agnostic. */
export interface CompletionRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  /** Ask the provider to return a JSON object (native JSON mode where available). */
  json?: boolean;
}

export interface CompletionResult {
  text: string;
  /** The concrete model that produced the text (e.g. "gemini-2.5-flash"). */
  model: string;
}

/**
 * A pluggable AI provider. Adding a new provider = implement this interface
 * and register it in the gateway's registry — no other code changes.
 */
export interface AiProvider {
  id: string;
  label: string;
  model: string;
  /** True when this provider has the credentials it needs. */
  isConfigured(): boolean;
  /** Generate a completion or throw a ProviderError. */
  complete(req: CompletionRequest, timeoutMs: number): Promise<CompletionResult>;
}

/**
 * Normalized provider failure. `retryable` distinguishes transient issues
 * (timeouts, 429s, 5xx) — which the gateway retries then falls through — from
 * configuration errors (401/400) where retrying the same provider is pointless.
 */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
