/**
 * Controlador de vacantes: SOLO recibe la petición, valida entrada y delega en el service.
 * Sin lógica de negocio. Los errores se propagan a `errorHandler` vía `next`.
 */
import type { Request, Response, NextFunction } from "express";
import { vacanteService } from "../services/vacanteService";
import {
  crearVacanteSchema, editarVacanteSchema, solicitarCambiosSchema, solicitarMasSchema,
  solicitarEdicionSchema, resolverEdicionSchema,
} from "../validators/vacanteSchemas";
import { ValidationError } from "../errors/AppError";
import type { z } from "zod";

function parseBody<T>(schema: { safeParse: (d: unknown) => z.SafeParseReturnType<unknown, T> }, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError("Datos de entrada inválidos", result.error.format());
  return result.data;
}

export const vacanteController = {
  listar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { formadorId } = req.query;
      const vacantes = typeof formadorId === "string"
        ? vacanteService.listarPorFormador(formadorId)
        : vacanteService.listar();
      res.json(vacantes);
    } catch (err) { next(err); }
  },

  obtener(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(vacanteService.obtener(req.params.id));
    } catch (err) { next(err); }
  },

  crear(req: Request, res: Response, next: NextFunction): void {
    try {
      const { req: requisito, formadorId } = parseBody(crearVacanteSchema, req.body);
      res.status(201).json(vacanteService.crear(requisito, formadorId));
    } catch (err) { next(err); }
  },

  editar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { req: requisito, rechazados, nota } = parseBody(editarVacanteSchema, req.body);
      res.json(vacanteService.editar(req.params.id, requisito, rechazados, nota));
    } catch (err) { next(err); }
  },

  solicitarCambios(req: Request, res: Response, next: NextFunction): void {
    try {
      const { cambios } = parseBody(solicitarCambiosSchema, req.body);
      res.json(vacanteService.solicitarCambios(req.params.id, cambios));
    } catch (err) { next(err); }
  },

  solicitarEdicion(req: Request, res: Response, next: NextFunction): void {
    try {
      const { req: requisito, resumen } = parseBody(solicitarEdicionSchema, req.body);
      res.json(vacanteService.solicitarEdicion(req.params.id, requisito, resumen));
    } catch (err) { next(err); }
  },

  resolverEdicion(req: Request, res: Response, next: NextFunction): void {
    try {
      const { aprobar, nota } = parseBody(resolverEdicionSchema, req.body);
      res.json(vacanteService.resolverEdicion(req.params.id, aprobar, nota));
    } catch (err) { next(err); }
  },

  aprobar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(vacanteService.aprobar(req.params.id));
    } catch (err) { next(err); }
  },

  solicitarMas(req: Request, res: Response, next: NextFunction): void {
    try {
      const { multiposting } = parseBody(solicitarMasSchema, req.body);
      res.json(vacanteService.solicitarMasCandidatos(req.params.id, multiposting));
    } catch (err) { next(err); }
  },

  eliminar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(vacanteService.eliminar(req.params.id));
    } catch (err) { next(err); }
  },
};
