/**
 * Catálogo de TOOLS del agente. Cada tool describe:
 *   - su schema JSON (lo que ve el LLM),
 *   - los roles que pueden usarla (gating por perfil),
 *   - cómo se ejecuta contra el backend.
 *
 * Las tools llaman a los SERVICIOS del backend directamente EN PROCESO (los mismos que usan
 * los controllers), sin salir por HTTP. Esto es lo correcto en serverless (Vercel): evita que
 * la función se autollame por la red (frágil, sujeto a deployment protection) y no necesita
 * ninguna variable AGENT_API_BASE.
 */
import { vacanteService } from "../services/vacanteService";
import { pipelineService } from "../services/pipelineService";
import { candidatoService } from "../services/candidatoService";
import { poolService } from "../services/poolService";
import { notificacionService } from "../services/notificacionService";
import { formadorRepository } from "../repositories/formadorRepository";
import * as catalogs from "../constants/catalogs";
import type { RolNotificacion } from "../types/domain";

export type Rol = "admin" | "formador" | "candidato";

/** Contexto de identidad del usuario dueño de la sesión (lo envía el front). */
export interface AgentContext {
  rol: Rol;
  formadorId?: string;
  candId?: number;
}

interface ToolDef {
  name: string;
  description: string;
  roles: Rol[];
  parameters: Record<string, unknown>;
  /** Ejecuta la tool contra los servicios del backend (en proceso). Puede lanzar; runTool captura. */
  run: (args: Record<string, any>, ctx: AgentContext) => unknown;
}

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

/** Objeto de catálogos (mismo shape que expone el endpoint /catalogos). */
const catalogosPayload = () => ({
  areas: catalogs.AREAS,
  niveles: catalogs.NIVELES,
  educacion: catalogs.EDUCACION,
  ciudades: catalogs.CIUDADES,
  modalidades: catalogs.MODALIDADES,
  tiposSede: catalogs.TIPOS_SEDE,
  sedes: catalogs.SEDES,
  tiposVacante: catalogs.TIPOS_VACANTE,
  especialidades: catalogs.ESPECIALIDADES,
  hardSkills: catalogs.HARD_SKILLS,
  softSkills: catalogs.SOFT_SKILLS,
  fases: catalogs.FASES,
  pipe: catalogs.PIPE,
});

export const TOOLS: ToolDef[] = [
  // ─────────────── Lectura (todos los roles) ───────────────
  {
    name: "listar_vacantes",
    description:
      "Lista vacantes. Si el usuario es formador, por defecto se filtra por su formadorId. " +
      "Para ver TODAS pasa formadorId vacío explícitamente.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ formadorId: str("ID del formador para filtrar (ej. 'F1'). Omite para usar el del usuario actual.") }),
    run: (a, ctx) => {
      const fid = a.formadorId ?? (ctx.rol === "formador" ? ctx.formadorId : undefined);
      return fid ? vacanteService.listarPorFormador(fid) : vacanteService.listar();
    },
  },
  {
    name: "obtener_vacante",
    description: "Devuelve el detalle completo de una vacante, incluido su pipeline de candidatos.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ vacId: str("ID de la vacante") }, ["vacId"]),
    run: (a) => vacanteService.obtener(String(a.vacId)),
  },
  {
    name: "listar_candidatos",
    description: "Lista todos los candidatos del pool de talento.",
    roles: ["admin", "formador"],
    parameters: obj({}),
    run: () => candidatoService.listar(),
  },
  {
    name: "obtener_candidato",
    description: "Devuelve el perfil de un candidato por su id numérico.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: int("ID numérico del candidato") }, ["id"]),
    run: (a) => candidatoService.obtener(Number(a.id)),
  },
  {
    name: "listar_formadores",
    description: "Lista los formadores de equipo registrados.",
    roles: ["admin", "formador"],
    parameters: obj({}),
    run: () => formadorRepository.findAll(),
  },
  {
    name: "listar_notificaciones",
    description: "Lista notificaciones. Puede filtrar por tipo ('formador'|'candidato') e id del destinatario.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ tipo: str("'formador' o 'candidato'"), id: str("ID del destinatario") }),
    run: (a, ctx) => {
      const tipo = a.tipo ?? (ctx.rol === "candidato" ? "candidato" : ctx.rol === "formador" ? "formador" : undefined);
      const id = a.id ?? (tipo === "formador" ? ctx.formadorId : tipo === "candidato" ? ctx.candId : undefined);
      return tipo && id != null
        ? notificacionService.listar(tipo as RolNotificacion, id)
        : notificacionService.listarTodas();
    },
  },
  {
    name: "listar_catalogos",
    description: "Devuelve los catálogos de dominio (áreas, niveles, ciudades, fases del pipeline, etc.).",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({}),
    run: () => catalogosPayload(),
  },

  // ─────────────── Vacantes (ciclo de vida) ───────────────
  {
    name: "aprobar_vacante",
    description: "Aprueba una vacante para que la IA empiece a buscar y ranquear candidatos.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID de la vacante") }, ["vacId"]),
    run: (a) => vacanteService.aprobar(String(a.vacId)),
  },
  {
    name: "solicitar_mas_candidatos",
    description: "Pide a la IA más candidatos para una vacante; multiposting=true amplía a fuentes externas.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID de la vacante"), multiposting: bool("Ampliar a fuentes externas") }, ["vacId"]),
    run: (a) => vacanteService.solicitarMasCandidatos(String(a.vacId), !!a.multiposting),
  },

  // ─────────────── Pipeline por candidato ───────────────
  {
    name: "invitar_candidato",
    description: "Invita a un candidato al proceso de una vacante con un mensaje.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), mensaje: str("Mensaje de invitación") }, ["vacId", "cid", "mensaje"]),
    run: (a) => pipelineService.invitar(String(a.vacId), Number(a.cid), String(a.mensaje)),
  },
  {
    name: "rechazar_candidato",
    description: "Rechaza a un candidato del pipeline de una vacante indicando el motivo.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), motivo: str("Motivo del rechazo") }, ["vacId", "cid", "motivo"]),
    run: (a) => pipelineService.rechazarInvitacion(String(a.vacId), Number(a.cid), String(a.motivo)),
  },
  {
    name: "seleccionar_candidato",
    description: "Marca a un candidato como seleccionado tras la entrevista.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.seleccionar(String(a.vacId), Number(a.cid)),
  },
  {
    name: "enviar_oferta",
    description: "Envía una oferta económica a un candidato (monto mensual, fecha de ingreso y ubicación/sede).",
    roles: ["admin", "formador"],
    parameters: obj(
      { vacId: str("ID vacante"), cid: int("ID candidato"), monto: int("Sueldo mensual en MXN"), fecha: str("Fecha de ingreso YYYY-MM-DD"), ubicacion: str("Sede/ubicación") },
      ["vacId", "cid", "monto", "fecha", "ubicacion"],
    ),
    run: (a) => pipelineService.enviarOferta(String(a.vacId), Number(a.cid), Number(a.monto), String(a.fecha), a.ubicacion ? String(a.ubicacion) : undefined),
  },

  // ─────────────── Acciones del candidato ───────────────
  {
    name: "postular_directo",
    description: "Postula directamente al candidato actual a una vacante (sin invitación previa).",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante"), killersOk: bool("¿Cumple las preguntas killer?"), mensaje: str("Mensaje de postulación") }, ["vacId"]),
    run: (a, ctx) => pipelineService.postularDirecto(String(a.vacId), Number(ctx.candId), a.killersOk ?? true, String(a.mensaje ?? "")),
  },
  {
    name: "aceptar_oferta",
    description: "El candidato actual acepta la oferta recibida en una vacante.",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante") }, ["vacId"]),
    run: (a, ctx) => pipelineService.aceptarOferta(String(a.vacId), Number(ctx.candId)),
  },
  {
    name: "confirmar_slot",
    description: "El candidato actual confirma uno de los horarios de entrevista propuestos.",
    roles: ["candidato", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato (para formador)"), slot: str("Horario elegido") }, ["vacId", "slot"]),
    run: (a, ctx) => pipelineService.confirmarSlot(String(a.vacId), Number(a.cid ?? ctx.candId), String(a.slot)),
  },
  {
    name: "toggle_favorito_vacante",
    description: "Marca o desmarca una vacante como favorita para el candidato actual.",
    roles: ["candidato"],
    parameters: obj({ vacId: str("ID vacante") }, ["vacId"]),
    run: (a, ctx) => candidatoService.toggleFavVacante(Number(ctx.candId), String(a.vacId)),
  },

  // ─────────────── Pool del formador ───────────────
  {
    name: "archivar_candidato",
    description: "Archiva a un candidato en el pool de una vacante.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => poolService.archivarCand(String(a.vacId), Number(a.cid)),
  },

  // ─────────────── Notificaciones ───────────────
  {
    name: "marcar_notificacion_leida",
    description: "Marca una notificación como leída por su id.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: str("ID de la notificación") }, ["id"]),
    run: (a) => {
      notificacionService.marcarLeida(String(a.id));
      return { ok: true };
    },
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
 * Ejecuta una tool: valida rol, corre la lógica del servicio y devuelve el resultado
 * (o un objeto de error legible para el modelo, nunca lanza).
 */
export async function runTool(name: string, args: Record<string, any>, ctx: AgentContext): Promise<unknown> {
  const def = TOOLS.find((t) => t.name === name);
  if (!def) return { error: `Tool desconocida: ${name}` };
  if (!def.roles.includes(ctx.rol)) return { error: `El rol '${ctx.rol}' no tiene permiso para '${name}'.` };

  try {
    return await def.run(args ?? {}, ctx);
  } catch (e) {
    return { error: (e as Error).message ?? "Error ejecutando la herramienta." };
  }
}
