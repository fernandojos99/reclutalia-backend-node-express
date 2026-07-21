/** Esquemas de validación de entrada para acciones de pipeline y candidato (zod, `.strict()`). */
import { z } from "zod";
import { MAX_TEXT_LENGTH } from "../config/constants";

const texto = z.string().max(MAX_TEXT_LENGTH);

export const invitarSchema = z.object({ mensaje: texto }).strict();

export const rechazarSchema = z.object({ motivo: texto.default("") }).strict();

export const postularDirectoSchema = z.object({
  mensaje: texto.default(""),
}).strict();

export const enviarSlotsSchema = z.object({
  cids: z.array(z.number().int()),
  slots: z.array(texto),
  modalidad: z.string(),
}).strict();

export const confirmarSlotSchema = z.object({ slot: texto }).strict();

export const registrarEntrevistaSchema = z.object({
  resumen: texto,
  feedback: texto,
  externa: z.boolean(),
  calificacion: z.number().min(1).max(10),
}).strict();

export const agendarMedicoSchema = z.object({
  estado: z.string(),
  ciudad: z.string(),
  municipio: z.string(),
  sucursal: z.string(),
  fecha: z.string(),
}).strict();

export const enviarOfertaSchema = z.object({
  monto: z.number().min(0),
  fecha: z.string(),
  ubicacion: z.string().optional(),
}).strict();

export const docContratoSchema = z.object({
  key: z.string().min(1),
  value: texto,
}).strict();

export const cuentaBancoSchema = z.object({
  cuenta: z.string().min(1).max(64),
}).strict();

export const guardarCandidatoSchema = z.object({
  candidato: z.record(z.unknown()),
}).strict();

export const categoriaSchema = z.object({ nombre: z.string().min(1) }).strict();
