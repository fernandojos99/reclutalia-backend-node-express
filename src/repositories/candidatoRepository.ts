/** Acceso a datos de candidatos. Única capa que toca `store.candidatos`. */
import { store } from "../data/store";
import type { Candidato } from "../types/domain";

export const candidatoRepository = {
  findAll(): Candidato[] {
    return store.candidatos;
  },

  findById(id: number): Candidato | undefined {
    return store.candidatos.find((c) => c.id === id);
  },

  /** Reemplaza el candidato completo (equivale a `ACT.guardarCandidato`: no hace merge). */
  upsert(candidato: Candidato): Candidato {
    const i = store.candidatos.findIndex((c) => c.id === candidato.id);
    if (i >= 0) {
      store.candidatos[i] = candidato;
    } else {
      const nextId = store.candidatos.length ? Math.max(...store.candidatos.map((c) => c.id)) + 1 : 1;
      candidato = { ...candidato, id: nextId };
      store.candidatos.unshift(candidato);
    }
    return candidato;
  },

  /** Elimina un candidato por id. Devuelve true si existía. */
  remove(id: number): boolean {
    const i = store.candidatos.findIndex((c) => c.id === id);
    if (i < 0) return false;
    store.candidatos.splice(i, 1);
    return true;
  },
};
