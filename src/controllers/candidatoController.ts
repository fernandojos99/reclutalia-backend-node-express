/** Controlador de candidatos: lecturas + guardar perfil + completar psicométrico. */
import type { Request, Response, NextFunction } from "express";
import { candidatoService } from "../services/candidatoService";
import { parseBody, parseNumericId } from "../utils/validate";
import { guardarCandidatoSchema } from "../validators/pipelineSchemas";
import type { Candidato } from "../types/domain";

export const candidatoController = {
  listar(_req: Request, res: Response): void {
    res.json(candidatoService.listar());
  },
  obtener(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(candidatoService.obtener(parseNumericId(req.params.id)));
    } catch (err) { next(err); }
  },
  guardar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { candidato } = parseBody(guardarCandidatoSchema, req.body);
      res.json(candidatoService.guardar(candidato as unknown as Candidato));
    } catch (err) { next(err); }
  },
  completarPsicometrico(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(candidatoService.completarPsicometrico(parseNumericId(req.params.id)));
    } catch (err) { next(err); }
  },
  toggleFavVacante(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(candidatoService.toggleFavVacante(parseNumericId(req.params.id), req.params.vacId));
    } catch (err) { next(err); }
  },
};
