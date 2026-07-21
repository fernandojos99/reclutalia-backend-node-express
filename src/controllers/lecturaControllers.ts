/** Controladores de formadores (CRUD) y notificaciones. */
import type { Request, Response, NextFunction } from "express";
import { formadorService } from "../services/formadorService";
import { notificacionService } from "../services/notificacionService";
import { parseBody } from "../utils/validate";
import { formadorBodySchema, crearNotificacionSchema } from "../validators/crudSchemas";
import type { Formador, RolNotificacion } from "../types/domain";

export const formadorController = {
  listar(_req: Request, res: Response): void {
    res.json(formadorService.listar());
  },
  obtener(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(formadorService.obtener(req.params.id));
    } catch (err) { next(err); }
  },
  crear(req: Request, res: Response, next: NextFunction): void {
    try {
      const { formador } = parseBody(formadorBodySchema, req.body);
      res.status(201).json(formadorService.crear(formador as Partial<Formador>));
    } catch (err) { next(err); }
  },
  actualizar(req: Request, res: Response, next: NextFunction): void {
    try {
      const { formador } = parseBody(formadorBodySchema, req.body);
      res.json(formadorService.actualizar(req.params.id, formador as Partial<Formador>));
    } catch (err) { next(err); }
  },
  eliminar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(formadorService.eliminar(req.params.id));
    } catch (err) { next(err); }
  },
};

export const notificacionController = {
  listar(req: Request, res: Response): void {
    const { tipo, id } = req.query;
    if (typeof tipo === "string" && typeof id === "string") {
      res.json(notificacionService.listar(tipo as RolNotificacion, id));
      return;
    }
    // Sin filtro: todas (equivale a `db.notifs` del front original).
    res.json(notificacionService.listarTodas());
  },
  crear(req: Request, res: Response, next: NextFunction): void {
    try {
      const { para, titulo, msg, vacId } = parseBody(crearNotificacionSchema, req.body);
      res.status(201).json(notificacionService.crear(para, titulo, msg, vacId));
    } catch (err) { next(err); }
  },
  marcarLeida(req: Request, res: Response): void {
    notificacionService.marcarLeida(req.params.id);
    res.status(204).end();
  },
  eliminar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(notificacionService.eliminar(req.params.id));
    } catch (err) { next(err); }
  },
};
