/**
 * Catálogo de TOOLS del agente. Cada tool describe:
 *   - su schema JSON (lo que ve el LLM),
 *   - los roles que pueden usarla (gating por perfil),
 *   - cómo se traduce a una llamada HTTP a ESTE backend.
 *
 * Regla clave: las tools NO tocan servicios/repos directamente; se comunican con el
 * backend por HTTP (env.agentApiBase), tal como lo haría cualquier cliente externo.
 */
import { env } from "../config/env";

export type Rol = "admin" | "formador" | "candidato";

/** Contexto de identidad del usuario dueño de la sesión (lo envía el front). */
export interface AgentContext {
  rol: Rol;
  formadorId?: string;
  candId?: number;
}

interface HttpCall {
  method: "GET" | "POST" | "PATCH" | "PUT";
  path: string;
  body?: unknown;
}

interface ToolDef {
  name: string;
  description: string;
  roles: Rol[];
  parameters: Record<string, unknown>;
  /** Traduce los argumentos del LLM (+ contexto) a una llamada HTTP. */
  toRequest: (args: Record<string, any>, ctx: AgentContext) => HttpCall;
}

const q = (v: unknown) => encodeURIComponent(String(v));

/** Helpers de schema para no repetir. */
const obj = (props: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties: props,
  required,
  additionalProperties: false,
});
const str = (description: string) => ({ type: "string", description });
const int = (description: string) => ({ type: "integer", description });
const bool = (description: string) => ({ type: "boolean", description });

export const TOOLS: ToolDef[] = [
  // ─────────────── Lectura (todos los roles) ───────────────
  {
    name: "listar_vacantes",
    description:
      "Lista vacantes. Si el usuario es formador, por defecto se filtra por su formadorId. " +
      "Para ver TODAS pasa formadorId vacío explícitamente.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ formadorId: str("ID del formador para filtrar (ej. 'F1'). Omite para usar el del usuario actual.") }),
    toRequest: (a, ctx) => {
      const fid = a.formadorId ?? (ctx.rol === "formador" ? ctx.formadorId : undefined);
      return { method: "GET", path: `/vacantes${fid ? `?formadorId=${q(fid)}` : ""}` };
    },
  },
  {
    name: "obtener_vacante",
    description: "Devuelve el detalle completo de una vacante, incluido su pipeline de candidatos.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ vacId: str("ID de la vacante") }, ["vacId"]),
    toRequest: (a) => ({ method: "GET", path: `/vacantes/${q(a.vacId)}` }),
  },
  {
    name: "listar_candidatos",
    description: "Lista todos los candidatos del pool de talento.",
    roles: ["admin", "formador"],
    parameters: obj({}),
    toRequest: () => ({ method: "GET", path: "/candidatos" }),
  },
  {
    name: "obtener_candidato",
    description: "Devuelve el perfil de un candidato por su id numérico.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: int("ID numérico del candidato") }, ["id"]),
    toRequest: (a) => ({ method: "GET", path: `/candidatos/${q(a.id)}` }),
  },
  {
    name: "listar_formadores",
    description: "Lista los formadores de equipo registrados.",
    roles: ["admin", "formador"],
    parameters: obj({}),
    toRequest: () => ({ method: "GET", path: "/formadores" }),
  },
  {
    name: "listar_notificaciones",
    description: "Lista notificaciones. Puede filtrar por tipo ('formador'|'candidato') e id del destinatario.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ tipo: str("'formador' o 'candidato'"), id: str("ID del destinatario") }),
    toRequest: (a, ctx) => {
      const tipo = a.tipo ?? (ctx.rol === "candidato" ? "candidato" : ctx.rol === "formador" ? "formador" : undefined);
      const id = a.id ?? (tipo === "formador" ? ctx.formadorId : tipo === "candidato" ? ctx.candId : undefined);
      const qs = tipo && id != null ? `?tipo=${q(tipo)}&id=${q(id)}` : "";
      return { method: "GET", path: `/notificaciones${qs}` };
    },
  },
  {
    name: "listar_catalogos",
    description: "Devuelve los catálogos de dominio (áreas, niveles, ciudades, fases del pipeline, etc.).",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({}),
    toRequest: () => ({ method: "GET", path: "/catalogos" }),
  },

  // ─────────────── Vacantes (ciclo de vida) ───────────────
  {
    name: "aprobar_vacante",
    description: "Aprueba una vacante para que la IA empiece a buscar y ranquear candidatos.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID de la vacante") }, ["vacId"]),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/aprobar` }),
  },
  {
    name: "solicitar_mas_candidatos",
    description: "Pide a la IA más candidatos para una vacante; multiposting=true amplía a fuentes externas.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID de la vacante"), multiposting: bool("Ampliar a fuentes externas") }, ["vacId"]),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/solicitar-mas`, body: { multiposting: !!a.multiposting } }),
  },

  // ─────────────── Pipeline por candidato ───────────────
  {
    name: "invitar_candidato",
    description: "Invita a un candidato al proceso de una vacante con un mensaje.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), mensaje: str("Mensaje de invitación") }, ["vacId", "cid", "mensaje"]),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(a.cid)}/invitar`, body: { mensaje: a.mensaje } }),
  },
  {
    name: "rechazar_candidato",
    description: "Rechaza a un candidato del pipeline de una vacante indicando el motivo.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), motivo: str("Motivo del rechazo") }, ["vacId", "cid", "motivo"]),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(a.cid)}/rechazar`, body: { motivo: a.motivo } }),
  },
  {
    name: "seleccionar_candidato",
    description: "Marca a un candidato como seleccionado tras la entrevista.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(a.cid)}/seleccionar` }),
  },
  {
    name: "enviar_oferta",
    description: "Envía una oferta económica a un candidato (monto mensual, fecha de ingreso y ubicación/sede).",
    roles: ["admin", "formador"],
    parameters: obj(
      { vacId: str("ID vacante"), cid: int("ID candidato"), monto: int("Sueldo mensual en MXN"), fecha: str("Fecha de ingreso YYYY-MM-DD"), ubicacion: str("Sede/ubicación") },
      ["vacId", "cid", "monto", "fecha", "ubicacion"],
    ),
    toRequest: (a) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(a.cid)}/oferta`, body: { monto: a.monto, fecha: a.fecha, ubicacion: a.ubicacion } }),
  },

  // ─────────────── Acciones del candidato ───────────────
  {
    name: "postular_directo",
    description: "Postula directamente al candidato actual a una vacante (sin invitación previa).",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante"), killersOk: bool("¿Cumple las preguntas killer?"), mensaje: str("Mensaje de postulación") }, ["vacId"]),
    toRequest: (a, ctx) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/postular/${q(ctx.candId)}`, body: { killersOk: a.killersOk ?? true, mensaje: a.mensaje ?? "" } }),
  },
  {
    name: "aceptar_oferta",
    description: "El candidato actual acepta la oferta recibida en una vacante.",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante") }, ["vacId"]),
    toRequest: (a, ctx) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(ctx.candId)}/oferta/aceptar` }),
  },
  {
    name: "confirmar_slot",
    description: "El candidato actual confirma uno de los horarios de entrevista propuestos.",
    roles: ["candidato", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato (para formador)"), slot: str("Horario elegido") }, ["vacId", "slot"]),
    toRequest: (a, ctx) => ({ method: "POST", path: `/vacantes/${q(a.vacId)}/pipeline/${q(a.cid ?? ctx.candId)}/confirmar-slot`, body: { slot: a.slot } }),
  },
  {
    name: "toggle_favorito_vacante",
    description: "Marca o desmarca una vacante como favorita para el candidato actual.",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante") }, ["vacId"]),
    toRequest: (a, ctx) => ({ method: "POST", path: `/candidatos/${q(ctx.candId)}/favoritos/${q(a.vacId)}` }),
  },

  // ─────────────── Notificaciones ───────────────
  {
    name: "marcar_notificacion_leida",
    description: "Marca una notificación como leída por su id.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: str("ID de la notificación") }, ["id"]),
    toRequest: (a) => ({ method: "POST", path: `/notificaciones/${q(a.id)}/leida` }),
  },
];

/** Tools visibles para un rol, en el formato function-calling de la API. */
export function toolsForRole(rol: Rol) {
  return TOOLS.filter((t) => t.roles.includes(rol)).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/**
 * Ejecuta una tool: valida rol, arma la llamada HTTP al backend y devuelve el resultado
 * (o un objeto de error legible para el modelo, nunca lanza).
 */
export async function runTool(name: string, args: Record<string, any>, ctx: AgentContext): Promise<unknown> {
  const def = TOOLS.find((t) => t.name === name);
  if (!def) return { error: `Tool desconocida: ${name}` };
  if (!def.roles.includes(ctx.rol)) return { error: `El rol '${ctx.rol}' no tiene permiso para '${name}'.` };

  let call: HttpCall;
  try {
    call = def.toRequest(args ?? {}, ctx);
  } catch (e) {
    return { error: `Argumentos inválidos para '${name}': ${(e as Error).message}` };
  }

  try {
    const res = await fetch(`${env.agentApiBase}${call.path}`, {
      method: call.method,
      headers: call.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: call.body !== undefined ? JSON.stringify(call.body) : undefined,
    });
    if (res.status === 204) return { ok: true };
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: `HTTP ${res.status}`, detalle: data };
    return data;
  } catch (e) {
    return { error: `No se pudo contactar al backend: ${(e as Error).message}` };
  }
}
