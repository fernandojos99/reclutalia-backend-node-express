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
  bodyLimit: process.env.BODY_LIMIT ?? "1mb",
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 120),
  isProduction: process.env.NODE_ENV === "production",
} as const;
