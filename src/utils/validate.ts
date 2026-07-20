/** Helper compartido: valida un body con un esquema zod o lanza ValidationError. */
import type { z } from "zod";
import { ValidationError } from "../errors/AppError";

export function parseBody<T>(
  schema: { safeParse: (d: unknown) => z.SafeParseReturnType<unknown, T> },
  body: unknown,
): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError("Datos de entrada inválidos", result.error.format());
  return result.data;
}

/** Parsea un id numérico de params o lanza ValidationError. */
export function parseNumericId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new ValidationError(`Id inválido: ${raw}`);
  return n;
}
