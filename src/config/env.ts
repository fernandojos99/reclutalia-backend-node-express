/**
 * Configuración leída de variables de entorno, con valores por defecto seguros para desarrollo.
 * Sin dependencias externas: se lee `process.env` directamente (KISS).
 */
const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * URL base con la que las TOOLS del agente llaman de vuelta a ESTE backend.
 * Orden de resolución:
 *   1. AGENT_API_BASE explícita (override manual).
 *   2. En Vercel, VERCEL_URL (inyectada automáticamente) → https://<deploy>/api.
 *   3. Local: el puerto propio.
 */
const resolveAgentApiBase = (): string => {
  if (process.env.AGENT_API_BASE) return process.env.AGENT_API_BASE;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api`;
  return `http://127.0.0.1:${toInt(process.env.PORT, 4000)}/api`;
};

export const env = {
  port: toInt(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  bodyLimit: process.env.BODY_LIMIT ?? "1mb",
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 120),
  isProduction: process.env.NODE_ENV === "production",

  // ── Agente LLM (DeepSeek, API compatible con OpenAI) ──
  // La API key se lee SOLO de entorno; nunca se hardcodea ni se expone al frontend.
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  // URL base con la que las TOOLS del agente llaman de vuelta a este mismo backend.
  agentApiBase: resolveAgentApiBase(),
} as const;
