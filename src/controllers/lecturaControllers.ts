/** Controladores de solo lectura para formadores y notificaciones. */
import type { Request, Response } from "express";
import { formadorRepository } from "../repositories/formadorRepository";
import { notificacionService } from "../services/notificacionService";
import type { RolNotificacion } from "../types/domain";

export const formadorController = {
  listar(_req: Request, res: Response): void {
    res.json(formadorRepository.findAll());
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
  marcarLeida(req: Request, res: Response): void {
    notificacionService.marcarLeida(req.params.id);
    res.status(204).end();
  },
};
