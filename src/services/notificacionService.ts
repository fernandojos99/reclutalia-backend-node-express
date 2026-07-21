/**
 * Emisión y consulta de notificaciones. Reemplaza al helper `notify(...)` del front:
 * cada acción de negocio que antes llamaba `notify` ahora llama `notificacionService.emitir`.
 */
import { notificacionRepository } from "../repositories/notificacionRepository";
import type { DestinatarioNotificacion, Notificacion, RolNotificacion } from "../types/domain";
import { uid, hoy, hora } from "../utils/format";

export const notificacionService = {
  emitir(para: DestinatarioNotificacion, titulo: string, msg: string, vacId: string): void {
    this.crear(para, titulo, msg, vacId);
  },

  /** Crea una notificación y la devuelve (versión con retorno de `emitir`). */
  crear(para: DestinatarioNotificacion, titulo: string, msg: string, vacId: string): Notificacion {
    const notif: Notificacion = {
      id: uid("N"), para, titulo, msg, vacId,
      fecha: `${hoy()} · ${hora()}`, leida: false,
    };
    notificacionRepository.insert(notif);
    return notif;
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

  /** Elimina una notificación por id. */
  eliminar(id: string): { ok: true } {
    notificacionRepository.remove(id);
    return { ok: true };
  },
};
