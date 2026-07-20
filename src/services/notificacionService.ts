/**
 * Emisión y consulta de notificaciones. Reemplaza al helper `notify(...)` del front:
 * cada acción de negocio que antes llamaba `notify` ahora llama `notificacionService.emitir`.
 */
import { notificacionRepository } from "../repositories/notificacionRepository";
import type { DestinatarioNotificacion, Notificacion, RolNotificacion } from "../types/domain";
import { uid, hoy, hora } from "../utils/format";

export const notificacionService = {
  emitir(para: DestinatarioNotificacion, titulo: string, msg: string, vacId: string): void {
    notificacionRepository.insert({
      id: uid("N"), para, titulo, msg, vacId,
      fecha: `${hoy()} · ${hora()}`, leida: false,
    });
  },

  listar(tipo: RolNotificacion, id: string | number): Notificacion[] {
    return notificacionRepository.findByDestinatario(tipo, id);
  },

  listarTodas(): Notificacion[] {
    return notificacionRepository.findAll();
  },

  marcarLeida(id: string): void {
    notificacionRepository.markAsRead(id);
  },
};
