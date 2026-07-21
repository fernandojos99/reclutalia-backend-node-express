/** Acceso a datos de notificaciones. Única capa que toca `store.notificaciones`. */
import { store } from "../data/store";
import type { Notificacion, RolNotificacion } from "../types/domain";

export const notificacionRepository = {
  findAll(): Notificacion[] {
    return store.notificaciones;
  },

  /** Notificaciones dirigidas a un destinatario (rol + id). */
  findByDestinatario(tipo: RolNotificacion, id: string | number): Notificacion[] {
    return store.notificaciones.filter(
      (n) => n.para.tipo === tipo && String(n.para.id) === String(id),
    );
  },

  /** Inserta al inicio (como `unshift` del front). */
  insert(notificacion: Notificacion): void {
    store.notificaciones.unshift(notificacion);
  },

  markAsRead(id: string): void {
    const n = store.notificaciones.find((x) => x.id === id);
    if (n) n.leida = true;
  },

  /** Elimina una notificación por id. Devuelve true si existía. */
  remove(id: string): boolean {
    const i = store.notificaciones.findIndex((x) => x.id === id);
    if (i < 0) return false;
    store.notificaciones.splice(i, 1);
    return true;
  },
};
