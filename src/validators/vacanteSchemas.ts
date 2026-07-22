/**
 * Esquemas de validación de entrada para vacantes (zod).
 * `.strict()` elimina campos inesperados (no confiar en el frontend).
 */
import { z } from "zod";
import { MAX_TEXT_LENGTH } from "../config/constants";

/** Descriptivo de la vacante. Refleja `Requisito`; todos los campos requeridos. */
export const requisitoSchema = z.object({
  titulo: z.string().min(1).max(MAX_TEXT_LENGTH),
  area: z.string().min(1),
  descripcion: z.string().max(MAX_TEXT_LENGTH),
  nivelPuesto: z.string().min(1),
  anosExp: z.number().int().min(0),
  educacion: z.string().min(1),
  espRequeridas: z.array(z.string()).max(5),
  areasConocimiento: z.array(z.string()).max(3).default([]),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  aptitudes: z.array(z.string()),
  turno: z.string().default("Turno Mixto"),
  sueldo: z.number().min(0).optional(),
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

/** El formador propone una edición del descriptivo (req completo + resumen de campos cambiados). */
export const solicitarEdicionSchema = z.object({
  req: requisitoSchema,
  resumen: z.record(z.string().max(MAX_TEXT_LENGTH)),
}).strict();

/** El admin confirma o rechaza la edición propuesta. */
export const resolverEdicionSchema = z.object({
  aprobar: z.boolean(),
  nota: z.string().max(MAX_TEXT_LENGTH).default(""),
}).strict();

export const solicitarMasSchema = z.object({
  multiposting: z.boolean().default(false),
}).strict();
