/**
 * Acceso a datos de vacantes. Única capa que toca `store.vacantes`.
 * Sin ORM: arrays en memoria. Reemplazable por una BD real sin tocar los services.
 */
import { store } from "../data/store";
import type { Vacante } from "../types/domain";

export const vacanteRepository = {
  findAll(): Vacante[] {
    return store.vacantes;
  },

  findById(id: string): Vacante | undefined {
    return store.vacantes.find((v) => v.id === id);
  },

  findByFormador(formadorId: string): Vacante[] {
    return store.vacantes.filter((v) => v.formadorId === formadorId);
  },

  /** Inserta al inicio (como `unshift` del front). */
  insert(vacante: Vacante): Vacante {
    store.vacantes.unshift(vacante);
    return vacante;
  },

  /** Elimina una vacante por id. Devuelve true si existía. */
  remove(id: string): boolean {
    const i = store.vacantes.findIndex((v) => v.id === id);
    if (i < 0) return false;
    store.vacantes.splice(i, 1);
    return true;
  },
};
