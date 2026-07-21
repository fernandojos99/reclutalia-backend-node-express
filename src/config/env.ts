/**
 * Configuración leída de variables de entorno, con valores por defecto seguros para desarrollo.
 * Sin dependencias externas: se lee `process.env` directamente (KISS).
 */
const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toInt(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // Subida de archivos (base64 en el JSON): se sube el límite para que quepan.
  bodyLimit: process.env.BODY_LIMIT ?? "6mb",
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 120),
  isProduction: process.env.NODE_ENV === "production",

  // ── Agente LLM (DeepSeek, API compatible con OpenAI) ──
  // La API key se lee SOLO de entorno; nunca se hardcodea ni se expone al frontend.
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",

  // ── Base de datos (Supabase Postgres vía pooler) ──
  // Cadena de conexión completa (postgresql://...). Si está vacía, el backend funciona
  // con la semilla en memoria (sin persistencia), útil para desarrollo sin BD.
  dbUrl: process.env.DATABASE_URL ?? "",
} as const;
