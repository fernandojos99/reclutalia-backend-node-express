/**
 * Orquestador del agente: bucle de tool-calling contra DeepSeek.
 * Emite eventos de progreso mediante un `emit` (los mapeará la capa SSE) y devuelve
 * la respuesta final en texto. La memoria se muta en la sesión recibida.
 */
import { chatCompletion, type ChatMessage } from "./deepseek";
import { runTool, toolsForRole, type AgentContext } from "./tools";

export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "token"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

/** Nº máximo de rondas de tools para evitar bucles infinitos. */
const MAX_ROUNDS = 6;

interface Session {
  ctx: AgentContext;
  messages: ChatMessage[];
}

export async function runAgent(
  session: Session,
  userMessage: string,
  emit: (e: AgentEvent) => void,
): Promise<void> {
  session.messages.push({ role: "user", content: userMessage });
  const tools = toolsForRole(session.ctx.rol);

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let assistant: ChatMessage;
    try {
      assistant = await chatCompletion(session.messages, tools);
    } catch (e) {
      emit({ type: "error", text: (e as Error).message });
      return;
    }

    session.messages.push(assistant);

    const calls = assistant.tool_calls ?? [];
    if (calls.length === 0) {
      // Respuesta final del modelo.
      emit({ type: "token", text: assistant.content ?? "" });
      emit({ type: "done" });
      return;
    }

    // Ejecutar cada tool solicitada y devolver el resultado al modelo.
    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        /* argumentos no-JSON: se pasan vacíos */
      }
      emit({ type: "tool", name: call.function.name, args });

      const result = await runTool(call.function.name, args, session.ctx);
      // Si la tool devolvió un error, lo emitimos como status para poder diagnosticarlo
      // desde el cliente (el modelo tiende a ocultarlo tras un mensaje genérico).
      if (result && typeof result === "object" && "error" in (result as Record<string, unknown>)) {
        emit({ type: "status", text: `tool ${call.function.name}: ${JSON.stringify(result)}` });
      }
      session.messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  emit({ type: "error", text: "El agente alcanzó el máximo de pasos sin concluir." });
}
