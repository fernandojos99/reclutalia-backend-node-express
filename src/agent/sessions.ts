/**
 * Sesión del agente EN MEMORIA para un request. La memoria persistente vive en la BD
 * (chat_sesiones / chat_mensajes, ver db/chatRepository): en cada mensaje se reconstruye la
 * sesión = system (según identidad) + historial persistido, y al terminar se guardan los mensajes
 * nuevos. Así el historial sobrevive a cold starts, redeploys y reinicios serverless.
 */
import type { ChatMessage } from "./deepseek";
import type { AgentContext, Rol } from "./tools";
import { systemPromptFor } from "./systemPrompt";

export interface Session {
  ctx: AgentContext;
  messages: ChatMessage[];
}

/** Máximo de mensajes a enviar al modelo por turno (evita prompts gigantes). */
const MAX_MESSAGES = 40;

/** Construye la sesión del request: mensaje system (según identidad) + historial persistido. */
export function construirSesion(ctx: AgentContext, historial: ChatMessage[]): Session {
  return { ctx, messages: [{ role: "system", content: systemPromptFor(ctx) }, ...historial] };
}

/** Recorta el historial dejando siempre el system inicial. */
export function trimHistory(s: Session): void {
  if (s.messages.length <= MAX_MESSAGES) return;
  const system = s.messages[0];
  s.messages = [system, ...s.messages.slice(s.messages.length - (MAX_MESSAGES - 1))];
}

export type { Rol };
