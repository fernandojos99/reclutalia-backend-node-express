/**
 * Cliente mínimo de DeepSeek (API compatible con OpenAI Chat Completions).
 * Sin SDK ni framework: solo `fetch`. Se usa en modo NO streaming; el streaming
 * hacia el cliente lo hace nuestra propia capa SSE (ver agentController).
 */
import { env } from "../config/env";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatChoice {
  message: ChatMessage;
  finish_reason: string;
}

interface ChatResponse {
  choices: ChatChoice[];
}

export async function chatCompletion(
  messages: ChatMessage[],
  tools: unknown[],
): Promise<ChatMessage> {
  if (!env.deepseekApiKey) {
    throw new Error("Falta DEEPSEEK_API_KEY en el entorno del backend.");
  }

  const res = await fetch(`${env.deepseekBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: env.deepseekModel,
      messages,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? "auto" : undefined,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`DeepSeek HTTP ${res.status}: ${detalle.slice(0, 500)}`);
  }

  const data = (await res.json()) as ChatResponse;
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error("Respuesta de DeepSeek sin choices.");
  return msg;
}
