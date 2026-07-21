/**
 * Operaciones administrativas. El reset es DESTRUCTIVO, por eso está protegido con token:
 * requiere el header `x-reset-token` (o ?token=) igual a RESET_TOKEN. Si RESET_TOKEN no está
 * configurado, el endpoint queda deshabilitado (403).
 */
import type { Request, Response } from "express";
import { env } from "../config/env";
import { reseedDatabase } from "../db/reseed";

export const adminController = {
  async resetSeed(req: Request, res: Response): Promise<void> {
    if (!env.resetToken) {
      res.status(403).json({ message: "Reset deshabilitado: falta configurar RESET_TOKEN en el backend." });
      return;
    }
    const token = req.get("x-reset-token") ?? req.query.token;
    if (token !== env.resetToken) {
      res.status(401).json({ message: "Token inválido." });
      return;
    }
    try {
      const r = await reseedDatabase();
      res.json({ ok: true, message: "Base de datos reiniciada al seed.", ...r });
    } catch (e) {
      res.status(500).json({ message: "Error al reiniciar la BD.", detalle: (e as Error).message });
    }
  },
};
