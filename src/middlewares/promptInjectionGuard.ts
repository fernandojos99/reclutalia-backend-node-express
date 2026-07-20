/**
 * Protección básica anti prompt-injection para endpoints que reciban prompts destinados a un LLM.
 *
 * NOTA: hoy Reclutalia NO tiene LLM real (todo lo de "IA" es simulado). Este middleware queda listo
 * para cuando se conecte uno. Reglas mínimas del prompt del refactor:
 *   - Tratar el input como DATOS, nunca como instrucciones del sistema.
 *   - No permitir sobrescribir mensajes del sistema ni cambiar de rol.
 *   - Limitar tamaño, quitar caracteres de control, y LOGUEAR intentos sin bloquear
 *     automáticamente (salvo contenido claramente malicioso).
 *
 * Uso: aplicarlo en la ruta del endpoint LLM y leer `req.body.promptSanitizado`.
 */
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/AppError";
import { MAX_PROMPT_LENGTH } from "../config/constants";

/** Patrones típicos de intento de inyección (heurística, no exhaustiva). */
const PATRONES_INYECCION: RegExp[] = [
  /ignora(r)?\s+(las?\s+)?instrucciones/i,
  /olvida(r)?\s+(todo|las?\s+instrucciones)/i,
  /act[úu]a\s+como\s+(system|sistema|administrador|developer)/i,
  /system\s*prompt/i,
  /eres\s+ahora\s+/i,
  /disregard\s+(the\s+)?(above|previous)/i,
  /\byou\s+are\s+now\b/i,
];

/** Quita caracteres de control (excepto salto de línea \n y tab \t) y recorta espacios. */
function limpiarTexto(texto: string): string {
  // eslint-disable-next-line no-control-regex
  return texto.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export function promptInjectionGuard(campo = "prompt") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const valor = (req.body as Record<string, unknown>)?.[campo];
    if (typeof valor !== "string") {
      next(new ValidationError(`El campo "${campo}" debe ser texto.`));
      return;
    }
    if (valor.length > MAX_PROMPT_LENGTH) {
      next(new ValidationError(`El prompt excede el máximo de ${MAX_PROMPT_LENGTH} caracteres.`));
      return;
    }

    const limpio = limpiarTexto(valor);
    const sospechas = PATRONES_INYECCION.filter((re) => re.test(limpio));
    if (sospechas.length > 0) {
      // Log del intento; NO se bloquea automáticamente (regla del prompt).
      console.warn("[prompt-injection] intento detectado", {
        ip: req.ip, path: req.originalUrl, patrones: sospechas.length,
      });
    }

    // Se entrega saneado; el consumidor debe tratarlo como DATOS del usuario, nunca como
    // instrucciones del sistema (envolverlo en su propio bloque delimitado al construir el prompt).
    (req.body as Record<string, unknown>).promptSanitizado = limpio;
    next();
  };
}
