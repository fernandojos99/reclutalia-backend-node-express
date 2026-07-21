/**
 * Controlador del agente. Expone el chat por SSE (Server-Sent Events), NO websockets.
 * El front envía el mensaje + identidad por POST y lee la respuesta como stream SSE.
 */
import type { Request, Response } from "express";
import { z } from "zod";
import { getSession } from "../agent/sessions";
import { runAgent, type AgentEvent } from "../agent/runner";
import type { AgentContext } from "../agent/tools";
import { env } from "../config/env";

const chatSchema = z
  .object({
    sessionId: z.string().min(1).max(200),
    mensaje: z.string().min(1).max(4000),
    rol: z.enum(["admin", "formador", "candidato"]),
    formadorId: z.string().max(50).optional(),
    candId: z.number().int().optional(),
  })
  .strict();

/** Serializa un evento del agente al formato SSE (`event:` + `data:`). */
function sseSend(res: Response, event: AgentEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const agentController = {
  /**
   * Diagnóstico: confirma que el agente está bien configurado. Las tools corren en proceso
   * (no por HTTP), así que aquí solo verificamos que exista la API key y el modelo. No la expone.
   */
  diag(_req: Request, res: Response): void {
    res.json({
      tieneDeepseekKey: env.deepseekApiKey.length > 0,
      modelo: env.deepseekModel,
      toolsEnProceso: true,
    });
  },

  async chat(req: Request, res: Response): Promise<void> {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos", details: parsed.error.format() });
      return;
    }
    const { sessionId, mensaje, rol, formadorId, candId } = parsed.data;
    const ctx: AgentContext = { rol, formadorId, candId };

    // Cabeceras SSE.
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // evita buffering en proxies (nginx/vercel)
    res.flushHeaders?.();

    const session = getSession(sessionId, ctx);

    try {
      await runAgent(session, mensaje, (e) => sseSend(res, e));
    } catch (e) {
      sseSend(res, { type: "error", text: (e as Error).message });
    } finally {
      res.end();
    }
  },
};
