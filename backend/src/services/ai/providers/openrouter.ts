import { env } from '../../../config/env';
import { openAiCompatible } from './openai-compatible';

/** OpenRouter — unified access to many models. Final fallback in the chain. */
export const openrouter = openAiCompatible({
  id: 'openrouter',
  label: 'OpenRouter',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  getApiKey: () => env.ai.openrouter.apiKey,
  getModel: () => env.ai.openrouter.model,
  // Optional attribution headers OpenRouter uses for its dashboards.
  extraHeaders: {
    'HTTP-Referer': 'https://rys.app',
    'X-Title': 'Rys',
  },
});
