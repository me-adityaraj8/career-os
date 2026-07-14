import { postJson } from './http';
import { ProviderError, type AiProvider, type CompletionRequest, type CompletionResult } from './types';

interface OpenAiCompatibleConfig {
  id: string;
  label: string;
  endpoint: string;
  /** Read the API key at call time (so env changes/tests are respected). */
  getApiKey: () => string;
  getModel: () => string;
  /** Extra headers (e.g. OpenRouter's attribution headers). */
  extraHeaders?: Record<string, string>;
}

/**
 * Factory for any provider that speaks the OpenAI /chat/completions dialect.
 * Groq and OpenRouter are both instances of this; adding another (Together,
 * Fireworks, a local vLLM…) is a one-line registration.
 */
export function openAiCompatible(config: OpenAiCompatibleConfig): AiProvider {
  return {
    id: config.id,
    label: config.label,
    get model() {
      return config.getModel();
    },
    isConfigured() {
      return config.getApiKey().trim().length > 0;
    },
    async complete(req: CompletionRequest, timeoutMs: number): Promise<CompletionResult> {
      const model = config.getModel();
      const data = await postJson(
        config.id,
        config.endpoint,
        {
          model,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.prompt },
          ],
          max_tokens: req.maxTokens ?? 2048,
          ...(req.json ? { response_format: { type: 'json_object' } } : {}),
        },
        { Authorization: `Bearer ${config.getApiKey()}`, ...config.extraHeaders },
        timeoutMs,
      );

      const text = (data?.choices?.[0]?.message?.content ?? '').trim();
      if (!text) {
        const reason = data?.choices?.[0]?.finish_reason;
        throw new ProviderError(config.id, `empty response${reason ? ` (${reason})` : ''}`, false);
      }
      return { text, model };
    },
  };
}
