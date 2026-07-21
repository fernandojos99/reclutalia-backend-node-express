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
import { formadorService } from "../services/formadorService";
import { formadorRepository } from "../repositories/formadorRepository";
import * as catalogs from "../constants/catalogs";
import type { RolNotificacion, Requisito, Candidato } from "../types/domain";

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
const arr = (item: "string" | "integer", description: string) => ({ type: "array", items: { type: item }, description });
const anyObj = (description: string) => ({ type: "object", description, additionalProperties: true });

/** Quita claves undefined de un objeto de "campos a cambiar". */
const limpio = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

/** Requisito con valores por defecto; se le hace merge de los campos provistos por el LLM. */
const defaultRequisito = (over: Record<string, unknown>): Requisito =>
  ({
    titulo: "Nueva vacante", area: "Operaciones", descripcion: "",
    nivelPuesto: "Junior", anosExp: 0, educacion: "Licenciatura",
    espRequeridas: [], areasConocimiento: [], hardSkills: [], softSkills: [], aptitudes: [],
    turno: "Turno Mixto", ubicacionTrabajo: "CDMX", modalidad: "Presencial", ubicacionCandidato: "CDMX",
    radioKm: 25, salarioMin: 10000, salarioMax: 15000, horario: "Tiempo completo", dias: [],
    numVacantes: 1, examenMedico: false, tipoSede: "Corporativo", sede: "", unidadNegocio: "",
    tipoVacante: "Estándar", puedeSerSuperior: false, ubicacionNoRelevante: false,
    expNoRelevante: false, edadMin: 18, edadMax: 65, edadNoRelevante: true,
    ...limpio(over),
  }) as Requisito;

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
  profesiones: catalogs.PROFESIONES,
  turnos: catalogs.TURNOS,
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
    parameters: obj({ vacId: str("ID vacante"), mensaje: str("Mensaje de postulación") }, ["vacId"]),
    run: (a, ctx) => pipelineService.postularDirecto(String(a.vacId), Number(ctx.candId), String(a.mensaje ?? "")),
  },
  {
    name: "firmar_contrato",
    description: "El formador firma el contrato de un candidato con oferta aceptada: genera nº de empleado, correo corporativo y accesos Okta, y cierra la vacante.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.firmarContrato(String(a.vacId), Number(a.cid)),
  },
  {
    name: "aceptar_oferta",
    description: "El candidato actual acepta la oferta recibida en una vacante (pasa a apertura de cuenta; el formador firma después).",
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

  // ─────────────── Vacantes: crear / editar / cambios ───────────────
  {
    name: "crear_vacante",
    description: "Crea una vacante y la asigna a un formador. Provee al menos formadorId, titulo y area; el resto toma valores por defecto que luego se pueden editar.",
    roles: ["admin"],
    parameters: obj({
      formadorId: str("ID del formador al que se asigna (ej. 'F1')"),
      titulo: str("Título del puesto"), area: str("Área"), descripcion: str("Descripción"),
      nivelPuesto: str("Nivel (Junior, Semi-Senior, Senior…)"), anosExp: int("Años de experiencia"),
      salarioMin: int("Sueldo mínimo mensual MXN"), salarioMax: int("Sueldo máximo mensual MXN"),
      ubicacionTrabajo: str("Ciudad"), modalidad: str("Presencial | Híbrido | Remoto"), numVacantes: int("Nº de plazas"),
    }, ["formadorId", "titulo", "area"]),
    run: (a) => {
      const { formadorId, ...campos } = a;
      return vacanteService.crear(defaultRequisito(campos), String(formadorId));
    },
  },
  {
    name: "editar_vacante",
    description: "Edita el descriptivo de una vacante (merge de los campos indicados sobre el requisito actual).",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), campos: anyObj("Campos del requisito a modificar (titulo, area, salarioMin, etc.)"), nota: str("Nota opcional") }, ["vacId", "campos"]),
    run: (a) => {
      const actual = vacanteService.obtener(String(a.vacId));
      const req = { ...actual.req, ...limpio(a.campos as Record<string, unknown>) } as Requisito;
      return vacanteService.editar(String(a.vacId), req, [], a.nota ? String(a.nota) : "");
    },
  },
  {
    name: "solicitar_cambios",
    description: "El formador solicita cambios en el descriptivo de una vacante.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cambios: str("Descripción de los cambios solicitados") }, ["vacId", "cambios"]),
    run: (a) => vacanteService.solicitarCambios(String(a.vacId), String(a.cambios)),
  },

  // ─────────────── Candidato: perfil ───────────────
  {
    name: "guardar_candidato",
    description: "Actualiza el perfil de un candidato (merge de los campos indicados). El candidato solo puede editar el suyo.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: int("ID candidato (admin/formador; el candidato usa el suyo)"), campos: anyObj("Campos a modificar (nombre, puesto, resumen, email, tel, etc.)") }, ["campos"]),
    run: (a, ctx) => {
      const id = ctx.rol === "candidato" ? Number(ctx.candId) : Number(a.id);
      const actual = candidatoService.obtener(id);
      const merged = { ...actual, ...limpio(a.campos as Record<string, unknown>), id } as Candidato;
      return candidatoService.guardar(merged);
    },
  },
  {
    name: "completar_psicometrico",
    description: "Marca como completado el examen psicométrico de un candidato.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: int("ID candidato (admin/formador; el candidato usa el suyo)") }),
    run: (a, ctx) => candidatoService.completarPsicometrico(ctx.rol === "candidato" ? Number(ctx.candId) : Number(a.id)),
  },

  // ─────────────── Pool del formador: favoritos y categorías ───────────────
  {
    name: "fav_candidato_pool",
    description: "Marca/desmarca un candidato como favorito del formador (pool global).",
    roles: ["admin", "formador"],
    parameters: obj({ formadorId: str("ID formador (por defecto el actual)"), cid: int("ID candidato") }, ["cid"]),
    run: (a, ctx) => poolService.toggleFavCand(String(a.formadorId ?? ctx.formadorId), Number(a.cid)),
  },
  {
    name: "crear_categoria",
    description: "Crea una categoría en el pool del formador.",
    roles: ["admin", "formador"],
    parameters: obj({ formadorId: str("ID formador (por defecto el actual)"), nombre: str("Nombre de la categoría") }, ["nombre"]),
    run: (a, ctx) => poolService.crearCategoria(String(a.formadorId ?? ctx.formadorId), String(a.nombre)),
  },
  {
    name: "toggle_categoria",
    description: "Agrega o quita un candidato de una categoría del pool del formador.",
    roles: ["admin", "formador"],
    parameters: obj({ formadorId: str("ID formador (por defecto el actual)"), nombre: str("Categoría"), cid: int("ID candidato") }, ["nombre", "cid"]),
    run: (a, ctx) => poolService.toggleCategoria(String(a.formadorId ?? ctx.formadorId), String(a.nombre), Number(a.cid)),
  },

  // ─────────────── Pipeline: pasos restantes ───────────────
  {
    name: "aplicar_candidato",
    description: "Registra que el candidato acepta la invitación y se postula.",
    roles: ["candidato", "formador", "admin"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato (formador/admin)") }, ["vacId"]),
    run: (a, ctx) => pipelineService.aplicar(String(a.vacId), Number(a.cid ?? ctx.candId)),
  },
  {
    name: "enviar_slots",
    description: "Envía horarios de entrevista a uno o varios candidatos de una vacante.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cids: arr("integer", "IDs de candidatos"), slots: arr("string", "Horarios propuestos"), modalidad: str("Presencial | Videollamada") }, ["vacId", "cids", "slots", "modalidad"]),
    run: (a) => pipelineService.enviarSlots(String(a.vacId), (a.cids as number[]).map(Number), (a.slots as string[]).map(String), String(a.modalidad)),
  },
  {
    name: "docs_filtro_listos",
    description: "Marca como listos los documentos de filtro inicial del candidato.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.docsFiltroListos(String(a.vacId), Number(a.cid)),
  },
  {
    name: "video_ia",
    description: "Ejecuta/registra la video-entrevista con IA del candidato.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.videoIA(String(a.vacId), Number(a.cid)),
  },
  {
    name: "registrar_entrevista",
    description: "Registra el resultado de la entrevista del formador con el candidato.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), resumen: str("Resumen"), feedback: str("Feedback"), externa: bool("¿Entrevista externa?"), calificacion: int("Calificación 1-5 (estrellas)") }, ["vacId", "cid", "resumen", "feedback", "externa", "calificacion"]),
    run: (a) => pipelineService.registrarEntrevista(String(a.vacId), Number(a.cid), { resumen: String(a.resumen), feedback: String(a.feedback), externa: !!a.externa, calificacion: Number(a.calificacion) }),
  },
  {
    name: "agendar_medico",
    description: "Agenda el examen médico del candidato (sede y fecha).",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), estado: str("Estado"), ciudad: str("Ciudad"), municipio: str("Municipio"), sucursal: str("Sucursal médica"), fecha: str("Fecha YYYY-MM-DD") }, ["vacId", "cid", "estado", "ciudad", "municipio", "sucursal", "fecha"]),
    run: (a) => pipelineService.agendarMedico(String(a.vacId), Number(a.cid), { estado: String(a.estado), ciudad: String(a.ciudad), municipio: String(a.municipio), sucursal: String(a.sucursal), fecha: String(a.fecha) }),
  },
  {
    name: "validar_medico",
    description: "Marca como validado el examen médico del candidato.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.validarMedico(String(a.vacId), Number(a.cid)),
  },
  {
    name: "recordar_docs",
    description: "Envía al candidato un recordatorio de los documentos pendientes.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.recordarDocs(String(a.vacId), Number(a.cid)),
  },
  {
    name: "set_doc_contrato",
    description: "Registra un documento de contratación del candidato (clave = tipo de doc, valor = referencia/nombre).",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato"), key: str("Tipo de documento (ine, curp, rfc, domicilio, estudios…)"), value: str("Referencia o nombre del archivo") }, ["vacId", "cid", "key", "value"]),
    run: (a) => pipelineService.setDocContrato(String(a.vacId), Number(a.cid), String(a.key), String(a.value)),
  },
  {
    name: "set_cuenta_banco",
    description: "Registra la cuenta bancaria del candidato para nómina.",
    roles: ["candidato", "formador", "admin"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato (formador/admin)"), cuenta: str("Número de cuenta / CLABE") }, ["vacId", "cuenta"]),
    run: (a, ctx) => pipelineService.setCuentaBanco(String(a.vacId), Number(a.cid ?? ctx.candId), String(a.cuenta)),
  },
  {
    name: "docs_contrato_listos",
    description: "Marca como completos los documentos de contratación del candidato.",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.docsContratoListos(String(a.vacId), Number(a.cid)),
  },
  {
    name: "simular_candidato",
    description: "(Demo) Simula la respuesta/avance del candidato en el pipeline para probar el flujo.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato (formador/admin)") }, ["vacId"]),
    run: (a, ctx) => pipelineService.simular(String(a.vacId), Number(a.cid ?? ctx.candId)),
  },

  // ─────────────── CRUD extra: create / delete de recursos ───────────────
  {
    name: "crear_candidato",
    description: "Crea un candidato nuevo en el pool (id autogenerado). Provee los campos que conozcas; el resto toma valores por defecto.",
    roles: ["admin"],
    parameters: obj({ datos: anyObj("Campos del candidato (nombre, area, puesto, nivel, ciudad, esp, hard, email, tel, etc.)") }, ["datos"]),
    run: (a) => candidatoService.crear(limpio(a.datos as Record<string, unknown>)),
  },
  {
    name: "eliminar_candidato",
    description: "Elimina un candidato del pool y limpia sus referencias en vacantes y formadores.",
    roles: ["admin"],
    parameters: obj({ id: int("ID del candidato") }, ["id"]),
    run: (a) => candidatoService.eliminar(Number(a.id)),
  },
  {
    name: "eliminar_vacante",
    description: "Elimina una vacante y la quita de los favoritos de los candidatos.",
    roles: ["admin"],
    parameters: obj({ vacId: str("ID de la vacante") }, ["vacId"]),
    run: (a) => vacanteService.eliminar(String(a.vacId)),
  },
  {
    name: "obtener_formador",
    description: "Devuelve el detalle de un formador por su id.",
    roles: ["admin", "formador"],
    parameters: obj({ id: str("ID del formador (ej. 'F1')") }, ["id"]),
    run: (a, ctx) => formadorService.obtener(String(a.id ?? ctx.formadorId)),
  },
  {
    name: "crear_formador",
    description: "Crea un formador de equipo nuevo (id autogenerado F1, F2…).",
    roles: ["admin"],
    parameters: obj({ nombre: str("Nombre"), puesto: str("Puesto"), area: str("Área") }, ["nombre"]),
    run: (a) => formadorService.crear(limpio({ nombre: a.nombre, puesto: a.puesto, area: a.area })),
  },
  {
    name: "actualizar_formador",
    description: "Actualiza los datos de un formador (merge de los campos indicados).",
    roles: ["admin"],
    parameters: obj({ id: str("ID del formador"), campos: anyObj("Campos a modificar (nombre, puesto, area)") }, ["id", "campos"]),
    run: (a) => formadorService.actualizar(String(a.id), limpio(a.campos as Record<string, unknown>)),
  },
  {
    name: "eliminar_formador",
    description: "Elimina un formador de equipo.",
    roles: ["admin"],
    parameters: obj({ id: str("ID del formador") }, ["id"]),
    run: (a) => formadorService.eliminar(String(a.id)),
  },
  {
    name: "crear_notificacion",
    description: "Crea una notificación dirigida a un destinatario (formador/candidato/admin).",
    roles: ["admin"],
    parameters: obj({
      tipoDest: str("'formador' | 'candidato' | 'admin'"), idDest: str("ID del destinatario"),
      titulo: str("Título"), msg: str("Mensaje"), vacId: str("ID de vacante relacionada (opcional)"),
    }, ["tipoDest", "idDest", "titulo", "msg"]),
    run: (a) => notificacionService.crear({ tipo: a.tipoDest as Rol, id: String(a.idDest) }, String(a.titulo), String(a.msg), String(a.vacId ?? "")),
  },
  {
    name: "eliminar_notificacion",
    description: "Elimina una notificación por id.",
    roles: ["admin", "formador", "candidato"],
    parameters: obj({ id: str("ID de la notificación") }, ["id"]),
    run: (a) => notificacionService.eliminar(String(a.id)),
  },
  {
    name: "eliminar_categoria",
    description: "Elimina una categoría del pool del formador.",
    roles: ["admin", "formador"],
    parameters: obj({ formadorId: str("ID formador (por defecto el actual)"), nombre: str("Categoría a eliminar") }, ["nombre"]),
    run: (a, ctx) => poolService.eliminarCategoria(String(a.formadorId ?? ctx.formadorId), String(a.nombre)),
  },
  {
    name: "quitar_del_pipeline",
    description: "Quita a un candidato del pipeline de una vacante (elimina su entrada).",
    roles: ["admin", "formador"],
    parameters: obj({ vacId: str("ID vacante"), cid: int("ID candidato") }, ["vacId", "cid"]),
    run: (a) => pipelineService.quitarDelPipeline(String(a.vacId), Number(a.cid)),
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
