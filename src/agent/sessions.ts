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

/**
 * Construye la sesión del request: mensaje system (según identidad) + historial persistido COMPLETO.
 * No se recorta ni comprime el historial: se conservan íntegros los mensajes de usuario y del agente.
 */
export function construirSesion(ctx: AgentContext, historial: ChatMessage[]): Session {
  return { ctx, messages: [{ role: "system", content: systemPromptFor(ctx) }, ...historial] };
}

export type { Rol };
