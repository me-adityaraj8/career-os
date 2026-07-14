import { env } from '../../../config/env';
import { postJson } from './http';
import { ProviderError, type AiProvider, type CompletionRequest, type CompletionResult } from './types';

/**
 * Google Gemini via the Generative Language REST API. Default provider —
 * generous free tier, fast, and reliable. gemini-2.5-flash by default.
 */
export const gemini: AiProvider = {
  id: 'gemini',
  label: 'Google Gemini',
  get model() {
    return env.ai.gemini.model;
  },
  isConfigured() {
    return env.ai.gemini.apiKey.trim().length > 0;
  },
  async complete(req: CompletionRequest, timeoutMs: number): Promise<CompletionResult> {
    const model = env.ai.gemini.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${env.ai.gemini.apiKey}`;
    const data = await postJson(
      'gemini',
      url,
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 2048,
          ...(req.json ? { responseMimeType: 'application/json' } : {}),
        },
      },
      {},
      timeoutMs,
    );

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: any) => p?.text ?? '').join('').trim();
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason;
      throw new ProviderError('gemini', `empty response${reason ? ` (${reason})` : ''}`, false);
    }
    return { text, model };
  },
};
