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
};
