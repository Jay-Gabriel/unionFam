/** Config từ biến môi trường. Không hardcode secret (SEC02, D04). */
export interface SafetyResourceCfg {
  label: string;
  value: string;
  kind: 'HOTLINE' | 'EMERGENCY' | 'TEXT' | 'INFO';
}

function parseSafetyResources(): SafetyResourceCfg[] {
  const raw = process.env.SAFETY_RESOURCES_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/lifelab',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  // AI provider
  aiProvider: (process.env.AI_PROVIDER ?? 'mock') as 'mock' | 'gemini' | 'openai',
  aiApiKey: process.env.AI_API_KEY ?? '',
  aiModel: process.env.AI_MODEL ?? 'gemini-flash-latest',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 12000),

  // Safety resources theo thị trường — KHÔNG bịa số. Nếu rỗng → fallback hướng dẫn chung.
  safetyResources: parseSafetyResources(),
  safetyMarket: process.env.SAFETY_MARKET ?? 'generic',

  // Entitlement / limits (chưa bật thu tiền thật)
  freeTurnLimitPerSession: Number(process.env.FREE_TURN_LIMIT ?? 60),
  billingEnabled: process.env.BILLING_ENABLED === 'true',

  promptVersion: '8.7.1',
};

export type Config = typeof config;
