/** Middleware para rutas no encontradas. */
import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../errors/AppError";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}
