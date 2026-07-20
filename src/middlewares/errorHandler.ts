/** Middleware global de manejo de errores: traduce la jerarquía AppError a respuestas HTTP. */
import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../errors/AppError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: err.name, message: err.message };
    if (err instanceof ValidationError && err.details) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }
  // Error no controlado: no filtrar detalles internos.
  console.error("[error]", err);
  res.status(500).json({ error: "InternalError", message: "Error interno del servidor" });
}
