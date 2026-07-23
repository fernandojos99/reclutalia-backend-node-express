/**
 * Chat directo persona↔persona. El acceso se controla por participación: solo los dos participantes
 * de una conversación pueden leer sus mensajes. Al enviar, el autor es la identidad del emisor, así
 * que la conversación SIEMPRE lo incluye (no puede escribir en conversaciones ajenas).
 */
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { directChatRepository, convIdDe, esParticipante } from "../db/directChatRepository";

const rolEnum = z.enum(["candidato", "formador", "admin"]);
const partSchema = z.object({ tipo: rolEnum, id: z.string().min(1).max(50) });
const identidadQuery = z.object({ rol: rolEnum, id: z.string().min(1).max(50) });
const enviarSchema = z.object({
  vacId: z.string().min(1).max(50),
  rol: rolEnum,
  id: z.string().min(1).max(50),
  para: partSchema,
  contenido: z.string().min(1).max(4000),
}).strict();

export const directChatController = {
  async conversaciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = identidadQuery.safeParse(req.query);
      if (!q.success) { res.status(400).json({ message: "Identidad inválida" }); return; }
      res.json(await directChatRepository.listarPorParticipante({ tipo: q.data.rol, id: q.data.id }));
    } catch (err) { next(err); }
  },

  async mensajes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = identidadQuery.safeParse(req.query);
      if (!q.success) { res.status(400).json({ message: "Identidad inválida" }); return; }
      const conv = await directChatRepository.obtener(req.params.convId);
      if (conv && !esParticipante(conv, { tipo: q.data.rol, id: q.data.id })) {
        res.status(403).json({ message: "Sin acceso a esta conversación" });
        return;
      }
      res.json(await directChatRepository.getMensajes(req.params.convId));
    } catch (err) { next(err); }
  },

  async enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = enviarSchema.safeParse(req.body);
      if (!b.success) { res.status(400).json({ message: "Datos inválidos", details: b.error.format() }); return; }
      const autor = { tipo: b.data.rol, id: b.data.id };
      const convId = convIdDe(b.data.vacId, autor, b.data.para);
      await directChatRepository.asegurar(convId, b.data.vacId, autor, b.data.para);
      await directChatRepository.agregarMensaje(convId, autor, b.data.contenido);
      res.status(201).json({ ok: true, convId });
    } catch (err) { next(err); }
  },
};
