/** Rutas de vacantes (incluye pipeline y pool): Route → Controller → Service → Repository. */
import { Router } from "express";
import { vacanteController } from "../controllers/vacanteController";
import { pipelineController } from "../controllers/pipelineController";
import { poolController } from "../controllers/poolController";

export const vacanteRoutes = Router();

// ── Vacante (ciclo de vida) ──
vacanteRoutes.get("/", vacanteController.listar);
vacanteRoutes.get("/:id", vacanteController.obtener);
vacanteRoutes.post("/", vacanteController.crear);
vacanteRoutes.patch("/:id", vacanteController.editar);
vacanteRoutes.post("/:id/cambios", vacanteController.solicitarCambios);
vacanteRoutes.post("/:id/solicitar-edicion", vacanteController.solicitarEdicion);
vacanteRoutes.post("/:id/resolver-edicion", vacanteController.resolverEdicion);
vacanteRoutes.post("/:id/aprobar", vacanteController.aprobar);
vacanteRoutes.post("/:id/reset-etapa", pipelineController.retrocederEtapa);
vacanteRoutes.post("/:id/solicitar-mas", vacanteController.solicitarMas);
vacanteRoutes.delete("/:id", vacanteController.eliminar);

// ── Marketplace de talento del formador ──
vacanteRoutes.post("/:id/archivar/:cid", poolController.archivarCand);

// ── Postulación directa del candidato (sin invitación previa) ──
vacanteRoutes.post("/:id/postular/:cid", pipelineController.postularDirecto);

// ── Envío de horarios a varios candidatos ──
vacanteRoutes.post("/:id/slots", pipelineController.enviarSlots);

// ── Pipeline por candidato ──
vacanteRoutes.delete("/:id/pipeline/:cid", pipelineController.quitar);
vacanteRoutes.post("/:id/pipeline/:cid/invitar", pipelineController.invitar);
vacanteRoutes.post("/:id/pipeline/:cid/aplicar", pipelineController.aplicar);
vacanteRoutes.post("/:id/pipeline/:cid/rechazar", pipelineController.rechazar);
vacanteRoutes.post("/:id/pipeline/:cid/filtros", pipelineController.docsFiltro);
vacanteRoutes.post("/:id/pipeline/:cid/video-ia", pipelineController.videoIA);
vacanteRoutes.post("/:id/pipeline/:cid/confirmar-slot", pipelineController.confirmarSlot);
vacanteRoutes.post("/:id/pipeline/:cid/entrevista", pipelineController.registrarEntrevista);
vacanteRoutes.post("/:id/pipeline/:cid/seleccionar", pipelineController.seleccionar);
vacanteRoutes.post("/:id/pipeline/:cid/medico", pipelineController.agendarMedico);
vacanteRoutes.post("/:id/pipeline/:cid/medico/validar", pipelineController.validarMedico);
vacanteRoutes.post("/:id/pipeline/:cid/recordar-docs", pipelineController.recordarDocs);
vacanteRoutes.post("/:id/pipeline/:cid/doc-contrato", pipelineController.setDocContrato);
vacanteRoutes.post("/:id/pipeline/:cid/cuenta", pipelineController.setCuentaBanco);
vacanteRoutes.post("/:id/pipeline/:cid/oferta/fecha", pipelineController.solicitarCambioFecha);
vacanteRoutes.post("/:id/pipeline/:cid/capacitacion", pipelineController.marcarCapacitacion);
vacanteRoutes.post("/:id/pipeline/:cid/docs-contrato", pipelineController.docsContrato);
vacanteRoutes.post("/:id/pipeline/:cid/oferta", pipelineController.enviarOferta);
vacanteRoutes.post("/:id/pipeline/:cid/oferta/aceptar", pipelineController.aceptarOferta);
vacanteRoutes.post("/:id/pipeline/:cid/firmar", pipelineController.firmarContrato);
vacanteRoutes.post("/:id/pipeline/:cid/simular", pipelineController.simular);
