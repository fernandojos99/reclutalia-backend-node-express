/**
 * Esquemas de validación de entrada para vacantes (zod).
 * `.strict()` elimina campos inesperados (no confiar en el frontend).
 */
import { z } from "zod";
import { MAX_TEXT_LENGTH } from "../config/constants";

const killerSchema = z.object({ q: z.string().max(MAX_TEXT_LENGTH) }).strict();

/** Descriptivo de la vacante. Refleja `Requisito`; todos los campos requeridos. */
export const requisitoSchema = z.object({
  titulo: z.string().min(1).max(MAX_TEXT_LENGTH),
  area: z.string().min(1),
  descripcion: z.string().max(MAX_TEXT_LENGTH),
  nivelPuesto: z.string().min(1),
  anosExp: z.number().int().min(0),
  educacion: z.string().min(1),
  espRequeridas: z.array(z.string()),
  espOpcionales: z.array(z.string()),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  aptitudes: z.array(z.string()),
  killer: z.array(killerSchema),
  ubicacionTrabajo: z.string(),
  modalidad: z.string(),
  ubicacionCandidato: z.string(),
  radioKm: z.number().min(0),
  salarioMin: z.number().min(0),
  salarioMax: z.number().min(0),
  horario: z.string(),
  dias: z.array(z.string()),
  numVacantes: z.number().int().min(1),
  examenMedico: z.boolean(),
  tipoSede: z.string(),
  sede: z.string(),
  unidadNegocio: z.string(),
  tipoVacante: z.string(),
  puedeSerSuperior: z.boolean(),
  ubicacionNoRelevante: z.boolean(),
  expNoRelevante: z.boolean(),
  edadMin: z.number().int(),
  edadMax: z.number().int(),
  edadNoRelevante: z.boolean(),
}).strict();

export const crearVacanteSchema = z.object({
  req: requisitoSchema,
  formadorId: z.string().min(1),
}).strict();

export const editarVacanteSchema = z.object({
  req: requisitoSchema,
  rechazados: z.array(z.string()).default([]),
  nota: z.string().max(MAX_TEXT_LENGTH).default(""),
}).strict();

/** cambios: mapa {campo: anotación} o string legado. */
export const solicitarCambiosSchema = z.object({
  cambios: z.union([z.string().max(MAX_TEXT_LENGTH), z.record(z.string().max(MAX_TEXT_LENGTH))]),
}).strict();

export const solicitarMasSchema = z.object({
  multiposting: z.boolean().default(false),
}).strict();
