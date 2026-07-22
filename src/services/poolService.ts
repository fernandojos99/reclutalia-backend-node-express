/**
 * Marketplace de talento del formador (parte del antiguo objeto `ACT`).
 * Favoritos y categorías son globales por formador; archivar es por vacante.
 */
import { vacanteRepository } from "../repositories/vacanteRepository";
import { formadorRepository } from "../repositories/formadorRepository";
import { NotFoundError } from "../errors/AppError";
import type { Formador, Vacante } from "../types/domain";

function obtenerVacante(vacId: string): Vacante {
  const v = vacanteRepository.findById(vacId);
  if (!v) throw new NotFoundError(`Vacante ${vacId} no encontrada`);
  return v;
}

function obtenerFormador(formadorId: string): Formador {
  const f = formadorRepository.findById(formadorId);
  if (!f) throw new NotFoundError(`Formador ${formadorId} no encontrado`);
  return f;
}

const toggle = <T>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export const poolService = {
  /** Archivar / restaurar candidato — por vacante. */
  archivarCand(vacId: string, cid: number): Vacante {
    const v = obtenerVacante(vacId);
    if (!v.archivados) v.archivados = [];
    v.archivados = toggle(v.archivados, cid);
    return v;
  },

  /** Favorito de candidato — global por formador. */
  toggleFavCand(formadorId: string, cid: number): Formador {
    const f = obtenerFormador(formadorId);
    if (!f.favoritosCands) f.favoritosCands = [];
    f.favoritosCands = toggle(f.favoritosCands, cid);
    return f;
  },

  /** Crea una categoría (si no existe). */
  crearCategoria(formadorId: string, nombre: string): Formador {
    const f = obtenerFormador(formadorId);
    if (!f.categorias) f.categorias = [];
    const n = nombre.trim();
    if (n && !f.categorias.some((c) => c.nombre === n)) f.categorias.push({ nombre: n, cids: [] });
    return f;
  },

  /** Agrega/quita un candidato de una categoría. */
  toggleCategoria(formadorId: string, nombre: string, cid: number): Formador {
    const f = obtenerFormador(formadorId);
    if (!f.categorias) f.categorias = [];
    const cat = f.categorias.find((c) => c.nombre === nombre);
    if (cat) cat.cids = toggle(cat.cids, cid);
    return f;
  },

  /** Elimina una categoría del formador. */
  eliminarCategoria(formadorId: string, nombre: string): Formador {
    const f = obtenerFormador(formadorId);
    if (f.categorias) f.categorias = f.categorias.filter((c) => c.nombre !== nombre);
    return f;
  },
};
