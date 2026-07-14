import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * Everything that reads process.env should go through this module so config is
 * inspectable in one place and we fail fast on missing required values.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'dev_jwt_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',

  // ---- AI gateway (provider-agnostic) ----
  // Keys are all optional; when none are set, AI features run in mock mode.
  // Providers are tried in `aiProviderOrder`, falling through on failure.
  ai: {
    order: (process.env.AI_PROVIDER_ORDER ?? 'gemini,groq,openrouter')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '30000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES ?? '2', 10),
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? '',
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
      model: process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash',
    },
  },
} as const;

/** True when at least one AI provider key is configured; drives mock vs. live. */
export const isAiLive =
  env.ai.gemini.apiKey.trim().length > 0 ||
  env.ai.groq.apiKey.trim().length > 0 ||
  env.ai.openrouter.apiKey.trim().length > 0;

export const isProduction = env.nodeEnv === 'production';
