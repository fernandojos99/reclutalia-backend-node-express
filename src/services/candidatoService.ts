/**
 * Lógica de candidatos (parte del antiguo objeto `ACT`).
 * `guardarCandidato` reemplaza el objeto completo (no hace merge, igual que el original).
 */
import { candidatoRepository } from "../repositories/candidatoRepository";
import { NotFoundError } from "../errors/AppError";
import { hoy } from "../utils/format";
import type { Candidato } from "../types/domain";

export const candidatoService = {
  listar(): Candidato[] {
    return candidatoRepository.findAll();
  },

  obtener(cid: number): Candidato {
    const c = candidatoRepository.findById(cid);
    if (!c) throw new NotFoundError(`Candidato ${cid} no encontrado`);
    return c;
  },

  /** Reemplaza el candidato completo (equiv. `ACT.guardarCandidato`). */
  guardar(candidato: Candidato): Candidato {
    return candidatoRepository.upsert(candidato);
  },

  /** El candidato realiza su examen psicométrico (vigencia 6 meses). */
  completarPsicometrico(cid: number): Candidato {
    const c = this.obtener(cid);
    c.psicometrico = { fecha: hoy(), ts: Date.now() };
    return c;
  },

  /** Guarda/quita una vacante de las favoritas del candidato ("Buscar vacantes"). */
  toggleFavVacante(cid: number, vacId: string): Candidato {
    const c = this.obtener(cid);
    if (!c.favoritos) c.favoritos = [];
    c.favoritos = c.favoritos.includes(vacId) ? c.favoritos.filter((x) => x !== vacId) : [...c.favoritos, vacId];
    return c;
  },
};
