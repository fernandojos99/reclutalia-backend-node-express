/** CRUD de formadores. La lógica vive aquí; el repositorio solo obtiene/guarda datos. */
import { formadorRepository } from "../repositories/formadorRepository";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { formadorFieldsSchema } from "../validators/crudSchemas";
import type { Formador } from "../types/domain";

/** Valida y coacciona la entrada (barrera única para HTTP y para las tools del agente). */
function sanitizar(input: Partial<Formador>): Partial<Formador> {
  const r = formadorFieldsSchema.safeParse(input);
  if (!r.success) throw new ValidationError("Datos de formador inválidos", r.error.format());
  return r.data as Partial<Formador>;
}

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
    return formadorRepository.upsert(nuevoFormador({ ...sanitizar(datos), id }));
  },

  /** Actualiza un formador (merge de los campos provistos sobre el actual). */
  actualizar(id: string, datos: Partial<Formador>): Formador {
    const f = this.obtener(id);
    return formadorRepository.upsert({ ...f, ...sanitizar(datos), id });
  },

  /** Elimina un formador. */
  eliminar(id: string): { ok: true } {
    this.obtener(id); // lanza si no existe
    formadorRepository.remove(id);
    return { ok: true };
  },
};
