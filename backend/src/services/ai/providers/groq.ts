import { env } from '../../../config/env';
import { openAiCompatible } from './openai-compatible';

/** Groq — very fast OpenAI-compatible inference. First fallback after Gemini. */
export const groq = openAiCompatible({
  id: 'groq',
  label: 'Groq',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  getApiKey: () => env.ai.groq.apiKey,
  getModel: () => env.ai.groq.model,
});
