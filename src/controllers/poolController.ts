/** Controlador del Marketplace de talento del formador: archivar, favoritos y categorías. */
import type { Request, Response, NextFunction } from "express";
import { poolService } from "../services/poolService";
import { parseBody, parseNumericId } from "../utils/validate";
import { categoriaSchema } from "../validators/pipelineSchemas";

export const poolController = {
  archivarCand(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(poolService.archivarCand(req.params.id, parseNumericId(req.params.cid)));
    } catch (err) { next(err); }
  },
  toggleFavCand(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(poolService.toggleFavCand(req.params.id, parseNumericId(req.params.cid)));
    } catch (err) { next(err); }
  },
  crearCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      const { nombre } = parseBody(categoriaSchema, req.body);
      res.json(poolService.crearCategoria(req.params.id, nombre));
    } catch (err) { next(err); }
  },
  toggleCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      const nombre = decodeURIComponent(req.params.nombre);
      res.json(poolService.toggleCategoria(req.params.id, nombre, parseNumericId(req.params.cid)));
    } catch (err) { next(err); }
  },
  eliminarCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      const nombre = decodeURIComponent(req.params.nombre);
      res.json(poolService.eliminarCategoria(req.params.id, nombre));
    } catch (err) { next(err); }
  },
};
