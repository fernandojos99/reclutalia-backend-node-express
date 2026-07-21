/**
 * Controlador de acciones del pipeline: recibe la petición, valida y delega en pipelineService.
 * Todas devuelven la vacante actualizada. Sin lógica de negocio aquí.
 */
import type { Request, Response, NextFunction } from "express";
import { pipelineService } from "../services/pipelineService";
import { parseBody, parseNumericId } from "../utils/validate";
import {
  invitarSchema, rechazarSchema, postularDirectoSchema, enviarSlotsSchema,
  confirmarSlotSchema, registrarEntrevistaSchema, agendarMedicoSchema, enviarOfertaSchema,
  docContratoSchema, cuentaBancoSchema,
} from "../validators/pipelineSchemas";

const vac = (req: Request): string => req.params.id;
const cand = (req: Request): number => parseNumericId(req.params.cid);

export const pipelineController = {
  invitar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { mensaje } = parseBody(invitarSchema, req.body);
      res.json(pipelineService.invitar(vac(req), cand(req), mensaje));
    } catch (err) { next(err); }
  },
  aplicar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.aplicar(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  rechazar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { motivo } = parseBody(rechazarSchema, req.body);
      res.json(pipelineService.rechazarInvitacion(vac(req), cand(req), motivo));
    } catch (err) { next(err); }
  },
  postularDirecto(req: Request, res: Response, next: NextFunction): void {
    try {
      const { mensaje } = parseBody(postularDirectoSchema, req.body);
      res.json(pipelineService.postularDirecto(vac(req), cand(req), mensaje));
    } catch (err) { next(err); }
  },
  docsFiltro(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.docsFiltroListos(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  videoIA(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.videoIA(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  enviarSlots(req: Request, res: Response, next: NextFunction): void {
    try {
      const { cids, slots, modalidad } = parseBody(enviarSlotsSchema, req.body);
      res.json(pipelineService.enviarSlots(vac(req), cids, slots, modalidad));
    } catch (err) { next(err); }
  },
  confirmarSlot(req: Request, res: Response, next: NextFunction): void {
    try {
      const { slot } = parseBody(confirmarSlotSchema, req.body);
      res.json(pipelineService.confirmarSlot(vac(req), cand(req), slot));
    } catch (err) { next(err); }
  },
  registrarEntrevista(req: Request, res: Response, next: NextFunction): void {
    try {
      const datos = parseBody(registrarEntrevistaSchema, req.body);
      res.json(pipelineService.registrarEntrevista(vac(req), cand(req), datos));
    } catch (err) { next(err); }
  },
  seleccionar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.seleccionar(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  agendarMedico(req: Request, res: Response, next: NextFunction): void {
    try {
      const datos = parseBody(agendarMedicoSchema, req.body);
      res.json(pipelineService.agendarMedico(vac(req), cand(req), datos));
    } catch (err) { next(err); }
  },
  validarMedico(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.validarMedico(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  recordarDocs(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.recordarDocs(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  setDocContrato(req: Request, res: Response, next: NextFunction): void {
    try {
      const { key, value } = parseBody(docContratoSchema, req.body);
      res.json(pipelineService.setDocContrato(vac(req), cand(req), key, value));
    } catch (err) { next(err); }
  },
  setCuentaBanco(req: Request, res: Response, next: NextFunction): void {
    try {
      const { cuenta } = parseBody(cuentaBancoSchema, req.body);
      res.json(pipelineService.setCuentaBanco(vac(req), cand(req), cuenta));
    } catch (err) { next(err); }
  },
  docsContrato(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.docsContratoListos(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  enviarOferta(req: Request, res: Response, next: NextFunction): void {
    try {
      const { monto, fecha, ubicacion } = parseBody(enviarOfertaSchema, req.body);
      res.json(pipelineService.enviarOferta(vac(req), cand(req), monto, fecha, ubicacion));
    } catch (err) { next(err); }
  },
  aceptarOferta(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.aceptarOferta(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  firmarContrato(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.firmarContrato(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  simular(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.simular(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
  quitar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(pipelineService.quitarDelPipeline(vac(req), cand(req)));
    } catch (err) { next(err); }
  },
};
