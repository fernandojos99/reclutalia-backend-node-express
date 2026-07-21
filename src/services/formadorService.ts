/** CRUD de formadores. La lógica vive aquí; el repositorio solo obtiene/guarda datos. */
import { formadorRepository } from "../repositories/formadorRepository";
import { NotFoundError } from "../errors/AppError";
import type { Formador } from "../types/domain";

function nuevoFormador(datos: Partial<Formador>): Formador {
  return {
    id: "", nombre: "Nuevo formador", puesto: "", area: "Operaciones",
    favoritosCands: [], categorias: [],
    ...datos,
  };
}

export const formadorService = {
  listar(): Formador[] {
    return formadorRepository.findAll();
  },

  obtener(id: string): Formador {
    const f = formadorRepository.findById(id);
    if (!f) throw new NotFoundError(`Formador ${id} no encontrado`);
    return f;
  },

  /** Crea un formador nuevo (id autogenerado F1, F2, …). */
  crear(datos: Partial<Formador>): Formador {
    const id = formadorRepository.nextId();
    return formadorRepository.upsert(nuevoFormador({ ...datos, id }));
  },

  /** Actualiza un formador (merge de los campos provistos sobre el actual). */
  actualizar(id: string, datos: Partial<Formador>): Formador {
    const f = this.obtener(id);
    return formadorRepository.upsert({ ...f, ...datos, id });
  },

  /** Elimina un formador. */
  eliminar(id: string): { ok: true } {
    this.obtener(id); // lanza si no existe
    formadorRepository.remove(id);
    return { ok: true };
  },
};
