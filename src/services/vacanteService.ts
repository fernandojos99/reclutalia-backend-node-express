/**
 * Lógica de negocio de la vacante (parte del antiguo objeto `ACT`).
 * SLICE VERTICAL DE REFERENCIA: crear, solicitar cambios, editar (reenvío del admin) y aprobar.
 * Las acciones de pipeline/pool/candidato se portan en sus propios services siguiendo este patrón
 * (ver REFACTOR-PLAN.md §6). Regla: aquí va la lógica; los repositorios solo obtienen/guardan datos.
 */
import { vacanteRepository } from "../repositories/vacanteRepository";
import { candidatoRepository } from "../repositories/candidatoRepository";
import { formadorRepository } from "../repositories/formadorRepository";
import { notificacionService } from "./notificacionService";
import { buildPool } from "./matchService";
import { NotFoundError } from "../errors/AppError";
import { CAMPOS_DESC } from "../constants/catalogs";
import { uid, hoy } from "../utils/format";
import type { Cambios, Requisito, Vacante } from "../types/domain";

function obtenerVacante(vacId: string): Vacante {
  const v = vacanteRepository.findById(vacId);
  if (!v) throw new NotFoundError(`Vacante ${vacId} no encontrada`);
  return v;
}

const aArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);

/**
 * Coacciona los campos de lista del Requisito a arrays (el path HTTP ya valida con zod `.strict()`;
 * esto protege el path del agente, que llama al servicio directamente).
 */
function coercionarReq(req: Requisito): Requisito {
  req.espRequeridas = aArray(req.espRequeridas) as string[];
  req.espOpcionales = aArray(req.espOpcionales) as string[];
  req.hardSkills = aArray(req.hardSkills) as string[];
  req.softSkills = aArray(req.softSkills) as string[];
  req.aptitudes = aArray(req.aptitudes) as string[];
  req.dias = aArray(req.dias) as string[];
  req.killer = aArray(req.killer).map((q) => (typeof q === "string" ? { q } : q)) as { q: string }[];
  return req;
}

export const vacanteService = {
  listar(): Vacante[] {
    return vacanteRepository.findAll();
  },

  listarPorFormador(formadorId: string): Vacante[] {
    return vacanteRepository.findByFormador(formadorId);
  },

  obtener(vacId: string): Vacante {
    return obtenerVacante(vacId);
  },

  /** Admin crea la vacante y la asigna a un formador (equiv. `ACT.crearVacante`). */
  crear(req: Requisito, formadorId: string): Vacante {
    const formador = formadorRepository.findById(formadorId);
    if (!formador) throw new NotFoundError(`Formador ${formadorId} no encontrado`);

    const vacante: Vacante = {
      id: uid("V-2"), estado: "asignada", formadorId, creada: hoy(), req: coercionarReq(req),
      pipeline: {}, historial: [`Creada por el administrador el ${hoy()}`], cambios: null, archivados: [],
    };
    vacanteRepository.insert(vacante);
    notificacionService.emitir(
      { tipo: "formador", id: formadorId },
      "Se te liberó una nueva vacante",
      `La vacante ${vacante.id} · "${req.titulo}" fue asignada a ti. Revisa el descriptivo, solicita cambios o apruébala para iniciar la búsqueda.`,
      vacante.id,
    );
    return vacante;
  },

  /** El formador solicita cambios por campo (equiv. `ACT.solicitarCambios`). */
  solicitarCambios(vacId: string, cambios: Cambios): Vacante {
    const v = obtenerVacante(vacId);
    v.estado = "cambios";
    v.cambios = cambios;
    const porCampo = cambios !== null && typeof cambios === "object";
    const resumen = porCampo
      ? Object.entries(cambios).map(([k, a]) => `${CAMPOS_DESC[k] ?? k}: ${a}`).join(" · ")
      : String(cambios);
    v.historial.push(
      `El formador solicitó cambios${porCampo ? ` en ${Object.keys(cambios).length} campo(s)` : ""} · ${hoy()}`,
    );
    notificacionService.emitir(
      { tipo: "admin", id: "A1" },
      `Cambios solicitados en ${vacId}`,
      `El formador solicitó ajustes al descriptivo de "${v.req.titulo}": ${resumen}`,
      v.id,
    );
    return v;
  },

  /** Admin reenvía con cambios aplicados/rechazados + nota opcional (equiv. `ACT.editarVacante`). */
  editar(vacId: string, req: Requisito, rechazados: string[] = [], nota = ""): Vacante {
    const v = obtenerVacante(vacId);
    const prev = v.cambios;
    v.req = coercionarReq(req);
    const eraCambios = v.estado === "cambios";
    const nombreCampos = (ks: string[]): string => ks.map((k) => CAMPOS_DESC[k] ?? k).join(", ");

    if (eraCambios) {
      v.estado = "asignada";
      v.cambios = null;
      let detalle: string;
      if (prev && typeof prev === "object") {
        const solicitados = Object.keys(prev);
        const rech = rechazados.filter((k) => solicitados.includes(k));
        const aplicados = solicitados.filter((k) => !rech.includes(k));
        detalle =
          (aplicados.length ? `Cambios aplicados: ${nombreCampos(aplicados)}` : "Sin cambios aplicados") +
          (rech.length ? ` · Rechazados: ${nombreCampos(rech)}` : "");
      } else {
        detalle = "El administrador aplicó los cambios solicitados";
      }
      v.historial.push(`${detalle} · ${hoy()}`);
      if (nota) v.historial.push(`Nota del administrador: "${nota}" · ${hoy()}`);
      notificacionService.emitir(
        { tipo: "formador", id: v.formadorId },
        "Vacante actualizada",
        `El descriptivo de ${v.id} · "${req.titulo}" fue actualizado. ${detalle}.${nota ? ` Nota del administrador: "${nota}".` : ""} Revísalo y apruébalo para iniciar la búsqueda.`,
        v.id,
      );
    } else if (nota) {
      v.historial.push(`Nota del administrador: "${nota}" · ${hoy()}`);
    }
    return v;
  },

  /** El formador aprueba el descriptivo; la IA arma el pool (equiv. `ACT.aprobarVacante`). */
  aprobar(vacId: string): Vacante {
    const v = obtenerVacante(vacId);
    v.estado = "abierta";
    v.historial.push(`Descriptivo aprobado por el formador · ${hoy()}`);
    v.pool = buildPool(candidatoRepository.findAll(), v.req);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Tu pool de talento está listo",
      `La IA analizó el marketplace y encontró ${v.pool.length} candidatos compatibles para ${v.id} · "${v.req.titulo}", ordenados por porcentaje de match.`,
      v.id,
    );
    return v;
  },

  /** El formador pide más candidatos a reclutamiento (equiv. `ACT.solicitarMasCandidatos`). */
  solicitarMasCandidatos(vacId: string, multiposting: boolean): Vacante {
    const v = obtenerVacante(vacId);
    v.historial.push(
      `Se solicitó a reclutamiento la búsqueda de más candidatos (5–10 días hábiles)${multiposting ? " · Multiposting habilitado" : ""} · ${hoy()}`,
    );
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Solicitud de más candidatos registrada",
      `Un grupo de reclutadores iniciará la búsqueda de talento para "${v.req.titulo}". Recibirás candidatos viables adicionales en un plazo de 5 a 10 días hábiles.${multiposting ? " Además, la vacante se publicó automáticamente en plataformas de terceros (Multiposting · simulado)." : ""}`,
      v.id,
    );
    return v;
  },

  /** Elimina una vacante y la quita de los favoritos de los candidatos (cascade ligero). */
  eliminar(vacId: string): { ok: true } {
    obtenerVacante(vacId); // lanza si no existe
    for (const c of candidatoRepository.findAll()) {
      if (c.favoritos) c.favoritos = c.favoritos.filter((x) => x !== vacId);
    }
    vacanteRepository.remove(vacId);
    return { ok: true };
  },
};
