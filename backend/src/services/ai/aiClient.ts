import Anthropic from '@anthropic-ai/sdk';
import { env, isAiLive } from '../../config/env';

/**
 * Thin wrapper around the Anthropic SDK.
 *
 * - When ANTHROPIC_API_KEY is set (isAiLive), real calls are made.
 * - When it's absent, callers fall back to the mock generators in aiService.
 *
 * Notes on model params: Opus 4.8 / current models reject `temperature`,
 * `top_p`, `top_k`, and `budget_tokens` (400), so we don't send them. For JSON
 * we use structured outputs via `output_config.format`, which guarantees the
 * response parses against our schema.
 */
const client = isAiLive ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

/** Extract the concatenated text from a message response. */
function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/** Call the model and parse a JSON object matching the given JSON Schema. */
export async function callJson<T>(params: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  if (!client) throw new Error('AI is not configured (mock mode)');
  const message = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
    messages: [{ role: 'user', content: params.prompt }],
    // Structured output: constrain the response to our schema.
    output_config: { format: { type: 'json_schema', schema: params.schema } },
  } as Anthropic.MessageCreateParamsNonStreaming);
  return JSON.parse(messageText(message)) as T;
}

/** Call the model for free-form text (e.g. a cover letter). */
export async function callText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!client) throw new Error('AI is not configured (mock mode)');
  const message = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: params.maxTokens ?? 1500,
    system: params.system,
    messages: [{ role: 'user', content: params.prompt }],
  });
  return messageText(message);
}
