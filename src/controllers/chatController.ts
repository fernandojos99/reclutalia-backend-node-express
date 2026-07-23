/**
 * CRUD de sesiones de chat del agente (persistentes en BD). El "usuario" es la identidad de demo
 * (rol + formadorId/candId); las sesiones se listan/crean por ese dueño.
 */
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { chatRepository } from "../db/chatRepository";
import { ownerDe } from "../agent/owner";

const identidadSchema = z.object({
  rol: z.enum(["admin", "formador", "candidato"]),
  formadorId: z.string().max(50).optional(),
  candId: z.coerce.number().int().optional(),
});

const crearSchema = identidadSchema.extend({
  titulo: z.string().max(120).optional(),
}).strict();

const renombrarSchema = z.object({ titulo: z.string().min(1).max(120) }).strict();

/** Convierte los ChatMessage persistidos a los mensajes que muestra la UI ({de, t}). */
function aMensajesUI(historial: { role: string; content: string | null }[]): { de: "yo" | "bot"; t: string }[] {
  const out: { de: "yo" | "bot"; t: string }[] = [];
  for (const m of historial) {
    const t = (m.content ?? "").trim();
    if (m.role === "user") out.push({ de: "yo", t });
    else if (m.role === "assistant" && t) out.push({ de: "bot", t });
    // Los mensajes 'tool' y los 'assistant' vacíos (solo tool_calls) no se muestran.
  }
  return out;
}

export const chatController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = identidadSchema.safeParse(req.query);
      if (!parsed.success) { res.status(400).json({ message: "Identidad inválida" }); return; }
      const { rol, formadorId, candId } = parsed.data;
      res.json(await chatRepository.listar(ownerDe(rol, formadorId, candId)));
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ message: "Datos inválidos", details: parsed.error.format() }); return; }
      const { rol, formadorId, candId, titulo } = parsed.data;
      const id = `sess_${Date.now()}_${randomUUID().slice(0, 8)}`;
      res.status(201).json(await chatRepository.crear(id, ownerDe(rol, formadorId, candId), titulo ?? ""));
    } catch (err) { next(err); }
  },

  async renombrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = renombrarSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ message: "Título inválido" }); return; }
      await chatRepository.renombrar(req.params.id, parsed.data.titulo);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await chatRepository.eliminar(req.params.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  async mensajes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const historial = await chatRepository.getMensajes(req.params.id);
      res.json(aMensajesUI(historial));
    } catch (err) { next(err); }
  },
};
