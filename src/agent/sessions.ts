/**
 * Memoria de conversación HARDCODEADA en un Map en RAM (a propósito, es una prueba).
 * No sobrevive a reinicios ni se comparte entre instancias serverless; para producción
 * habría que mover esto a Redis/DB. La sesión guarda el historial de mensajes por sessionId.
 */
import type { ChatMessage } from "./deepseek";
import type { AgentContext, Rol } from "./tools";
import { systemPromptFor } from "./systemPrompt";

interface Session {
  ctx: AgentContext;
  messages: ChatMessage[];
}

const SESSIONS = new Map<string, Session>();

/** Máximo de mensajes a retener por sesión (evita crecer sin límite). */
const MAX_MESSAGES = 40;

/** Obtiene (o crea) la sesión y sincroniza el contexto/identidad enviado por el front. */
export function getSession(sessionId: string, ctx: AgentContext): Session {
  let s = SESSIONS.get(sessionId);
  if (!s) {
    s = { ctx, messages: [{ role: "system", content: systemPromptFor(ctx) }] };
    SESSIONS.set(sessionId, s);
    return s;
  }
  // Si cambió el rol/identidad (el usuario cambió de perfil en el front), refrescamos el system.
  const cambio = s.ctx.rol !== ctx.rol || s.ctx.formadorId !== ctx.formadorId || s.ctx.candId !== ctx.candId;
  s.ctx = ctx;
  if (cambio) s.messages[0] = { role: "system", content: systemPromptFor(ctx) };
  return s;
}

/** Recorta el historial dejando siempre el system inicial. */
export function trimHistory(s: Session): void {
  if (s.messages.length <= MAX_MESSAGES) return;
  const system = s.messages[0];
  s.messages = [system, ...s.messages.slice(s.messages.length - (MAX_MESSAGES - 1))];
}

export function resetSession(sessionId: string): void {
  SESSIONS.delete(sessionId);
}

export type { Rol };
