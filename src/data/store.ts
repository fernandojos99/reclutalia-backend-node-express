/**
 * "Base de datos" en memoria: 4 arrays vivos sembrados al arrancar.
 * Reemplaza al objeto `db` del frontend. Única fuente de datos; solo los repositorios la tocan.
 * Para migrar a una BD real, se cambian las implementaciones de los repositorios (no este archivo
 * ni los services).
 */
import type { Candidato, Formador, Vacante, Notificacion } from "../types/domain";
import {
  SEED_CANDIDATOS, SEED_VACANTES, SEED_FORMADORES, SEED_NOTIFICACIONES,
} from "./seed";

export interface Store {
  candidatos: Candidato[];
  vacantes: Vacante[];
  formadores: Formador[];
  notificaciones: Notificacion[];
}

/** Clona la semilla para que reiniciar el store no arrastre mutaciones previas. */
function seedStore(): Store {
  return {
    candidatos: structuredClone(SEED_CANDIDATOS),
    vacantes: structuredClone(SEED_VACANTES),
    formadores: structuredClone(SEED_FORMADORES),
    notificaciones: structuredClone(SEED_NOTIFICACIONES),
  };
}

export const store: Store = seedStore();

/** Útil para pruebas: restaura la semilla. */
export function resetStore(): void {
  const fresh = seedStore();
  store.candidatos = fresh.candidatos;
  store.vacantes = fresh.vacantes;
  store.formadores = fresh.formadores;
  store.notificaciones = fresh.notificaciones;
}
