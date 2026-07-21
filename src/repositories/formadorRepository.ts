/** Acceso a datos de formadores. Única capa que toca `store.formadores`. */
import { store } from "../data/store";
import type { Formador } from "../types/domain";

export const formadorRepository = {
  findAll(): Formador[] {
    return store.formadores;
  },

  findById(id: string): Formador | undefined {
    return store.formadores.find((f) => f.id === id);
  },

  /** Genera el siguiente id de formador (F1, F2, …). */
  nextId(): string {
    const nums = store.formadores
      .map((f) => Number(f.id.replace(/^F/, "")))
      .filter((n) => Number.isFinite(n));
    return `F${(nums.length ? Math.max(...nums) : 0) + 1}`;
  },

  /** Crea o reemplaza un formador completo. */
  upsert(formador: Formador): Formador {
    const i = store.formadores.findIndex((f) => f.id === formador.id);
    if (i >= 0) store.formadores[i] = formador;
    else store.formadores.push(formador);
    return formador;
  },

  /** Elimina un formador por id. Devuelve true si existía. */
  remove(id: string): boolean {
    const i = store.formadores.findIndex((f) => f.id === id);
    if (i < 0) return false;
    store.formadores.splice(i, 1);
    return true;
  },
};
