/**
 * Lógica del pipeline del candidato dentro de una vacante (parte del antiguo objeto `ACT`).
 * Portado 1:1 desde `App.jsx`. Cada acción muta el estado y emite notificaciones vía
 * notificacionService. La lógica vive aquí; los repositorios solo obtienen/guardan datos.
 */
import { vacanteRepository } from "../repositories/vacanteRepository";
import { candidatoRepository } from "../repositories/candidatoRepository";
import { formadorRepository } from "../repositories/formadorRepository";
import { notificacionService } from "./notificacionService";
import { matchScore } from "./matchService";
import { candidatoService } from "./candidatoService";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { hoy, money, proximosDias } from "../utils/format";
import { numEmpleado, slotTomado } from "../utils/deterministic";
import { DIRECCION_CORP, SUCURSALES_MEDICAS } from "../constants/catalogs";
import type { Candidato, Entrevista, PipelineEntry, Vacante } from "../types/domain";

function obtenerVacante(vacId: string): Vacante {
  const v = vacanteRepository.findById(vacId);
  if (!v) throw new NotFoundError(`Vacante ${vacId} no encontrada`);
  return v;
}

function obtenerCandidato(cid: number): Candidato {
  const c = candidatoRepository.findById(cid);
  if (!c) throw new NotFoundError(`Candidato ${cid} no encontrado`);
  return c;
}

function obtenerPipeline(v: Vacante, cid: number): PipelineEntry {
  const p = v.pipeline[cid];
  if (!p) throw new NotFoundError(`El candidato ${cid} no está en el pipeline de ${v.id}`);
  return p;
}

const nombreFormador = (v: Vacante): string =>
  formadorRepository.findById(v.formadorId)?.nombre ?? "El formador";

/** Estados en los que el candidato ya NO participa activamente (proceso terminado). */
const ESTADOS_TERMINALES = ["descartado", "filtrado", "rechazado", "contratado"];

/** True si el candidato tiene un proceso ACTIVO (no terminal) en otra vacante distinta a `exceptoVacId`. */
function tieneProcesoActivo(cid: number, exceptoVacId?: string): boolean {
  return vacanteRepository.findAll().some((v) => {
    const p = v.pipeline[cid];
    return v.id !== exceptoVacId && p && !ESTADOS_TERMINALES.includes(p.estado);
  });
}

export const pipelineService = {
  /** El formador invita a un candidato del pool a postularse. */
  invitar(vacId: string, cid: number, mensaje: string): Vacante {
    const v = obtenerVacante(vacId);
    const c = obtenerCandidato(cid);
    if (tieneProcesoActivo(cid, vacId)) {
      throw new ValidationError(`${c.nombre} ya está en un proceso de selección activo en otra vacante.`);
    }
    const m = (v.pool?.find((p) => p.cid === cid)?.match) ?? 50;
    v.pipeline[cid] = {
      estado: "invitado", match: m, mensaje, docsFiltro: {}, docsContrato: {},
      historial: [`Invitado a postularse · ${hoy()}`],
    };
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Te invitaron a postularte",
      `${nombreFormador(v)} te invitó a la vacante "${v.req.titulo}" (${v.req.modalidad}, ${v.req.ubicacionTrabajo}). Mensaje: "${mensaje}"`,
      v.id,
    );
    void c;
    return v;
  },

  /** El candidato acepta la invitación y se postula (la postulación siempre procede). */
  aplicar(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "postulado";
    p.historial.push(`Se postuló a la vacante · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Nuevo candidato postulado",
      `${c.nombre} aceptó tu invitación y se postuló a ${v.id} · "${v.req.titulo}".`,
      v.id,
    );
    return v;
  },

  /** El candidato rechaza la invitación del formador. */
  rechazarInvitacion(vacId: string, cid: number, motivo: string): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "rechazado";
    p.motivoRechazo = motivo || "";
    p.historial.push(`El candidato rechazó la invitación${motivo ? `: "${motivo}"` : ""} · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "El candidato rechazó tu invitación",
      `${c.nombre} declinó tu invitación a "${v.req.titulo}".${motivo ? ` Motivo: "${motivo}".` : ""} Puedes invitar a otros candidatos desde tu Marketplace de talento.`,
      v.id,
    );
    return v;
  },

  /** El candidato aplica por su cuenta desde "Buscar vacantes" (sin invitación previa). */
  postularDirecto(vacId: string, cid: number, mensaje: string): Vacante {
    const v = obtenerVacante(vacId);
    const c = obtenerCandidato(cid);
    if (tieneProcesoActivo(cid, vacId)) {
      throw new ValidationError("Ya tienes un proceso de selección activo. No puedes postularte a otra vacante hasta que concluya.");
    }
    const m = matchScore(c, v.req);
    v.pipeline[cid] = {
      estado: "postulado", match: m, mensaje, docsFiltro: {}, docsContrato: {},
      historial: [`Se postuló directamente desde Buscar vacantes · ${hoy()}`],
    };
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Nuevo candidato postulado",
      `${c.nombre} se postuló directamente a ${v.id} · "${v.req.titulo}" desde Buscar vacantes (${m}% de compatibilidad). Mensaje: "${mensaje}"`,
      v.id,
    );
    return v;
  },

  /** Filtros automáticos simulados aprobados (empleos previos, PLD, psicométrico). */
  docsFiltroListos(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    p.estado = "filtros_ok";
    p.historial.push(`Filtros automáticos aprobados (empleos previos, historial de crédito, PLD, psicométrico) · ${hoy()}`);
    return v;
  },

  /** Video-entrevista con IA: re-ranquea al candidato. */
  videoIA(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    const delta = ((cid * 29) % 15) - 5;
    p.matchIA = Math.max(20, Math.min(99, p.match + delta));
    p.estado = "evaluado";
    p.historial.push(`Video-entrevista con IA completada · nuevo ranking ${p.matchIA}% · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Candidato superó el primer filtro",
      `${c.nombre} completó la video-entrevista con IA para "${v.req.titulo}". Nuevo ranking: ${p.matchIA}%. Revisa tu terna de finalistas.`,
      v.id,
    );
    return v;
  },

  /** El formador envía a los candidatos 3 opciones de horario de entrevista. */
  enviarSlots(vacId: string, cids: number[], slots: string[], modalidad: string): Vacante {
    const v = obtenerVacante(vacId);
    cids.forEach((cid) => {
      const p = obtenerPipeline(v, cid);
      p.estado = "slots_enviados";
      p.slots = slots;
      p.modalidadEnt = modalidad;
      p.historial.push(`Invitado a entrevista con 3 opciones de horario · ${hoy()}`);
      notificacionService.emitir(
        { tipo: "candidato", id: cid },
        "Invitación a entrevista",
        `El formador quiere entrevistarte para "${v.req.titulo}" (${modalidad}). Elige uno de los 3 horarios propuestos.`,
        v.id,
      );
    });
    return v;
  },

  /** El candidato confirma un horario (exclusividad de horarios). */
  confirmarSlot(vacId: string, cid: number, slot: string): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    if (slotTomado(v, slot, cid)) {
      notificacionService.emitir(
        { tipo: "candidato", id: cid },
        "Horario no disponible",
        `El horario ${slot} ya fue confirmado por otro candidato para "${v.req.titulo}". Elige otro de los horarios propuestos.`,
        v.id,
      );
      return v;
    }
    p.estado = "agendado";
    p.slotElegido = slot;
    p.teams = `https://teams.microsoft.com/l/meetup-join/reclutalia-${vacId}-${cid}`;
    p.historial.push(`Confirmó horario de entrevista: ${slot} · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "El candidato aceptó tu horario",
      `${c.nombre} confirmó la entrevista para "${v.req.titulo}": ${slot}. Se generó la reunión en Teams (enlace en la ficha del candidato).`,
      v.id,
    );
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Entrevista confirmada",
      `Tu entrevista para "${v.req.titulo}" quedó agendada: ${slot}. El enlace de Teams está disponible en tu panel.`,
      v.id,
    );
    return v;
  },

  /** El formador registra el resultado de la entrevista (calificación 1–10 obligatoria). */
  registrarEntrevista(
    vacId: string, cid: number,
    datos: Pick<Entrevista, "resumen" | "feedback" | "externa" | "calificacion">,
  ): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const delta = ((cid * 17) % 11) - 3;
    p.matchFinal = Math.max(25, Math.min(99, (p.matchIA ?? p.match) + delta));
    p.estado = "entrevistado";
    p.entrevista = { ...datos, fecha: hoy() };
    p.historial.push(
      `${datos.externa ? "Entrevista externa registrada" : "Entrevista realizada con copiloto de IA"} · ranking final ${p.matchFinal}% · ${hoy()}`,
    );
    return v;
  },

  /** El formador selecciona al candidato ideal; descarta al resto de entrevistados. */
  seleccionar(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "seleccionado";
    p.historial.push(`Seleccionado como candidato ideal · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "¡Felicidades! Fuiste seleccionado",
      `Fuiste elegido para "${v.req.titulo}". Siguiente paso: sube tu documentación de contratación (checklist en tu panel; solo PDF, máx. 1 MB por archivo).`,
      v.id,
    );
    Object.entries(v.pipeline).forEach(([ocid, op]) => {
      if (Number(ocid) !== cid && ["entrevistado", "agendado", "slots_enviados", "evaluado"].includes(op.estado)) {
        op.estado = "descartado";
        op.historial.push(`Proceso cerrado: se seleccionó a otro candidato · ${hoy()}`);
        notificacionService.emitir(
          { tipo: "candidato", id: Number(ocid) },
          "Actualización de tu proceso",
          `El proceso de "${v.req.titulo}" concluyó con otro candidato. La IA identificó otras vacantes compatibles con tu perfil y te invitaremos a postularte.`,
          v.id,
        );
      }
    });
    void c;
    return v;
  },

  /** El candidato agenda su examen médico en una sucursal autorizada. */
  agendarMedico(vacId: string, cid: number, datos: Record<string, string>): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.medico = { ...datos, validado: false };
    p.historial.push(`Examen médico agendado en ${datos.sucursal} · ${datos.fecha} · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Examen médico agendado",
      `${c.nombre} agendó su examen médico para "${v.req.titulo}" en ${datos.sucursal} (${datos.fecha}). Valida el resultado en la pestaña "Selección y documentos".`,
      v.id,
    );
    return v;
  },

  /** El formador valida el resultado positivo del examen médico. */
  validarMedico(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    if (!p.medico) p.medico = { validado: false };
    p.medico.validado = true;
    p.historial.push(`Resultado del examen médico validado por el formador · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Examen médico validado",
      `Tu examen médico para "${v.req.titulo}" fue validado. Ya puedes completar y enviar tu documentación de contratación.`,
      v.id,
    );
    return v;
  },

  /** Recordatorio de documentación pendiente. */
  recordarDocs(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    p.historial.push(`Recordatorio de documentación pendiente enviado · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Recordatorio: documentación pendiente",
      `El formador te recuerda completar y enviar tu documentación de contratación para "${v.req.titulo}" (revisa el checklist en tu panel; solo PDF, máx. 1 MB por archivo).`,
      v.id,
    );
    return v;
  },

  /** El candidato sube/actualiza un documento de contratación (persistido; lo ve el formador). */
  setDocContrato(vacId: string, cid: number, key: string, value: string): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    p.docsContrato[key] = value;
    return v;
  },

  /** El candidato registra su número de cuenta / CLABE para nómina. */
  setCuentaBanco(vacId: string, cid: number, cuenta: string): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    p.cuentaBanco = cuenta;
    return v;
  },

  /** El candidato completa su documentación de contratación. */
  docsContratoListos(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "docs_completos";
    p.historial.push(`Documentación de contratación completa y validada · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Documentación completa",
      `${c.nombre} terminó de subir su documentación para "${v.req.titulo}". Ya puedes preparar y enviar la carta oferta.`,
      v.id,
    );
    return v;
  },

  /** El formador envía la carta oferta. */
  enviarOferta(vacId: string, cid: number, monto: number, fecha: string, ubicacion?: string): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    p.estado = "oferta_enviada";
    p.oferta = { monto, fecha, ubicacion: ubicacion || DIRECCION_CORP };
    p.historial.push(`Carta oferta enviada: ${money(monto)} · ingreso y firma el ${fecha} · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Recibiste tu carta oferta",
      `Tu propuesta para "${v.req.titulo}": ${money(monto)} mensuales brutos. Fecha de firma e ingreso: ${fecha}. Te presentarás en: ${p.oferta.ubicacion}. Revísala y acéptala en tu panel.`,
      v.id,
    );
    return v;
  },

  /** El candidato acepta la oferta y firma; la vacante se cierra. */
  /** El candidato acepta la oferta → pasa a "Apertura de cuenta" (ya NO cierra la vacante). */
  aceptarOferta(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "oferta_aceptada";
    p.historial.push(`Aceptó la carta oferta · ${hoy()}`);
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "¡Tu candidato aceptó la oferta! 🎉",
      `${c.nombre} aceptó la carta oferta de "${v.req.titulo}" (ingreso: ${p.oferta?.fecha}). Cuando abra su cuenta de nómina podrás firmar el contrato desde la pestaña Contratación.`,
      v.id,
    );
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "Oferta aceptada · siguiente paso",
      `Aceptaste la oferta de "${v.req.titulo}". Siguiente paso: abre tu cuenta de nómina (QR o enlace) y registra tu número de cuenta para que tu formador firme el contrato.`,
      v.id,
    );
    return v;
  },

  /** El formador firma el contrato: número de empleado, correo corporativo y accesos Okta; cierra la vacante. */
  firmarContrato(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const c = obtenerCandidato(cid);
    p.estado = "contratado";
    p.numEmpleado = numEmpleado(cid);
    const correo = `${p.numEmpleado}@elektra.com.mx`;
    p.historial.push(`Contrato firmado · nº de empleado ${p.numEmpleado} · accesos Okta confirmados · ${hoy()}`);
    v.estado = "cerrada";
    notificacionService.emitir(
      { tipo: "formador", id: v.formadorId },
      "Contrato firmado · contratación completada 🎉",
      `Firmaste el contrato de ${c.nombre} para "${v.req.titulo}". Nº de empleado: ${p.numEmpleado} · correo ${correo} · accesos lógicos (Okta) confirmados. Ingreso: ${p.oferta?.fecha}.`,
      v.id,
    );
    notificacionService.emitir(
      { tipo: "candidato", id: cid },
      "¡Bienvenido(a) al equipo!",
      `Tu contrato para "${v.req.titulo}" quedó firmado. Nº de empleado: ${p.numEmpleado} · correo corporativo ${correo} · accesos Okta confirmados. Te esperamos el ${p.oferta?.fecha}.`,
      v.id,
    );
    return v;
  },

  /** Modo demo: simula la siguiente acción del candidato. */
  simular(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    const p = obtenerPipeline(v, cid);
    const filtrosDemo = (): void => {
      p.docsFiltro = { constancias: ["constancia_empleo_1.pdf", "constancia_empleo_2.pdf"] };
      p.autorizaFiltros = true;
      candidatoService.completarPsicometrico(cid);
    };
    if (p.estado === "invitado") {
      this.aplicar(vacId, cid);
      filtrosDemo();
      this.docsFiltroListos(vacId, cid);
      this.videoIA(vacId, cid);
    } else if (p.estado === "postulado" || p.estado === "filtros_ok") {
      filtrosDemo();
      this.docsFiltroListos(vacId, cid);
      this.videoIA(vacId, cid);
    } else if (p.estado === "slots_enviados") {
      const libre = p.slots?.find((s) => !slotTomado(v, s, cid)) ?? p.slots?.[0] ?? "";
      this.confirmarSlot(vacId, cid, libre);
    } else if (p.estado === "seleccionado") {
      p.docsContrato = {
        ine: "ine.pdf", curp: "curp.pdf", rfc: "rfc.pdf",
        domicilio: "comprobante_domicilio.pdf", estudios: "comprobante_estudios.pdf",
      };
      p.cuentaBanco = "012180001234567895";
      if (v.req.examenMedico) {
        p.medico = {
          estado: "Ciudad de México", ciudad: "CDMX", municipio: "Tlalpan",
          sucursal: SUCURSALES_MEDICAS[0].nombre, fecha: proximosDias(7)[2], validado: true,
        };
      }
      this.docsContratoListos(vacId, cid);
    } else if (p.estado === "oferta_enviada") {
      this.aceptarOferta(vacId, cid);
    } else if (p.estado === "oferta_aceptada" && !p.cuentaBanco) {
      this.setCuentaBanco(vacId, cid, "012180001234567895");
    }
    return v;
  },

  /** Quita a un candidato del pipeline de una vacante (elimina su entrada). */
  quitarDelPipeline(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    obtenerPipeline(v, cid); // lanza si no está en el pipeline
    delete v.pipeline[cid];
    return v;
  },

  /**
   * (Herramienta del formador) Retrocede una etapa el proceso de la vacante: cada candidato activo
   * baja un paso del pipeline y se limpian los datos generados en los pasos deshechos. Si la vacante
   * estaba cerrada, se reabre. Es una acción de demo (se pierde el avance de esos pasos).
   */
  retrocederEtapa(vacId: string): Vacante {
    const v = obtenerVacante(vacId);
    const ORDEN = [
      "invitado", "postulado", "filtros_ok", "video_ia", "evaluado", "slots_enviados",
      "agendado", "entrevistado", "seleccionado", "docs_completos", "oferta_enviada",
      "oferta_aceptada", "contratado",
    ];
    const PREV: Record<string, string> = {
      postulado: "invitado", filtros_ok: "postulado", video_ia: "filtros_ok", evaluado: "filtros_ok",
      slots_enviados: "evaluado", agendado: "slots_enviados", entrevistado: "agendado",
      seleccionado: "entrevistado", docs_completos: "seleccionado", oferta_enviada: "docs_completos",
      oferta_aceptada: "oferta_enviada", contratado: "oferta_aceptada",
    };

    let cambiados = 0;
    for (const p of Object.values(v.pipeline)) {
      const nuevo = PREV[p.estado];
      if (!nuevo) continue;
      const ni = ORDEN.indexOf(nuevo);
      const antesDe = (e: string) => ni < ORDEN.indexOf(e);
      // Limpiar datos de pasos posteriores al nuevo estado.
      if (antesDe("filtros_ok")) { p.docsFiltro = {}; delete p.autorizaFiltros; }
      if (antesDe("evaluado")) delete p.matchIA;
      if (antesDe("slots_enviados")) { delete p.slots; delete p.modalidadEnt; }
      if (antesDe("agendado")) { delete p.slotElegido; delete p.teams; }
      if (antesDe("entrevistado")) { delete p.entrevista; delete p.matchFinal; }
      // Documentos y examen médico se capturan en el paso "seleccionado": al deshacerlo se reinician.
      if (antesDe("docs_completos")) { p.docsContrato = {}; delete p.medico; }
      if (antesDe("oferta_enviada")) delete p.oferta;
      if (antesDe("oferta_aceptada")) delete p.cuentaBanco;
      if (antesDe("contratado")) delete p.numEmpleado;
      p.estado = nuevo;
      p.historial.push(`El formador retrocedió la etapa del proceso · ${hoy()}`);
      cambiados++;
    }
    if (cambiados === 0) {
      throw new ValidationError("No hay candidatos en una etapa que se pueda retroceder.");
    }
    if (v.estado === "cerrada") v.estado = "abierta";
    v.historial.push(`Etapa del proceso retrocedida por el formador · ${hoy()}`);
    return v;
  },
};
