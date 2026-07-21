/**
 * Lógica de candidatos (parte del antiguo objeto `ACT`).
 * `guardarCandidato` reemplaza el objeto completo (no hace merge, igual que el original).
 */
import { candidatoRepository } from "../repositories/candidatoRepository";
import { vacanteRepository } from "../repositories/vacanteRepository";
import { formadorRepository } from "../repositories/formadorRepository";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { candidatoFieldsSchema } from "../validators/crudSchemas";
import { hoy } from "../utils/format";
import type { Candidato } from "../types/domain";

/** Valores por defecto de un candidato (sin id). */
function baseCandidato(): Omit<Candidato, "id"> {
  return {
    nombre: "Nuevo candidato", tipo: "externo", area: "Operaciones", puesto: "",
    nivel: "Junior", exp: 0, edu: "Licenciatura titulado", ciudad: "CDMX", modalidad: "Presencial",
    salario: 12000, esp: [], hard: [], soft: [], resumen: "", email: "", tel: "",
    experiencia: [], educacion: [], intereses: [], foto: null, favoritos: [], psicometrico: null,
    docsPerfil: { ine: null, curp: null, rfc: null, domicilio: null, estudios: null, certificaciones: [], cv: null },
  };
}

/**
 * Valida y COACCIONA los datos de entrada con zod (campos de lista → array, numéricos → número).
 * Es la ÚNICA barrera de datos: se aplica tanto en el path HTTP como cuando la tool del agente
 * llama al servicio directamente. Lanza ValidationError (→ 400) si algún tipo es irreparable.
 */
function sanitizar(input: Partial<Candidato>): Partial<Candidato> {
  const r = candidatoFieldsSchema.safeParse(input);
  if (!r.success) throw new ValidationError("Datos de candidato inválidos", r.error.format());
  return r.data as Partial<Candidato>;
}

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
    const limpio = sanitizar(candidato);
    return candidatoRepository.upsert({ ...baseCandidato(), ...limpio, id: candidato.id } as Candidato);
  },

  /** Crea un candidato nuevo (id autogenerado) con los datos provistos sobre la plantilla. */
  crear(datos: Partial<Candidato>): Candidato {
    const limpio = sanitizar(datos);
    return candidatoRepository.upsert({ ...baseCandidato(), ...limpio, id: 0 } as Candidato);
  },

  /** Elimina un candidato y limpia sus referencias en vacantes y formadores (cascade). */
  eliminar(cid: number): { ok: true } {
    this.obtener(cid); // lanza si no existe
    for (const v of vacanteRepository.findAll()) {
      if (v.pipeline && v.pipeline[cid]) delete v.pipeline[cid];
      if (v.pool) v.pool = v.pool.filter((p) => p.cid !== cid);
      if (v.archivados) v.archivados = v.archivados.filter((x) => x !== cid);
    }
    for (const f of formadorRepository.findAll()) {
      if (f.favoritosCands) f.favoritosCands = f.favoritosCands.filter((x) => x !== cid);
      if (f.categorias) f.categorias.forEach((cat) => { cat.cids = cat.cids.filter((x) => x !== cid); });
    }
    candidatoRepository.remove(cid);
    return { ok: true };
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
