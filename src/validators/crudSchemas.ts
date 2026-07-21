/** Esquemas para las operaciones CRUD añadidas (create/update de recursos). */
import { z } from "zod";
import { MAX_TEXT_LENGTH } from "../config/constants";

/** Coacciona a array: string→[string], null/""→[], array→igual. Evita que un `esp="texto"` rompa el front. */
const aArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const arrayStr = z.preprocess(aArray, z.array(z.string()));

const experienciaItem = z.object({ puesto: z.string(), empresa: z.string(), inicio: z.string(), fin: z.string() }).partial().passthrough();
const educacionItem = z.object({ institucion: z.string(), titulo: z.string(), inicio: z.string(), fin: z.string() }).partial().passthrough();

const docsPerfilSchema = z.object({
  ine: z.string().nullable(),
  curp: z.string().nullable(),
  rfc: z.string().nullable(),
  domicilio: z.string().nullable(),
  estudios: z.string().nullable(),
  certificaciones: arrayStr,
  cv: z.string().nullable(),
}).partial();

/**
 * Campos de un candidato, TODOS opcionales (sirve para crear-parcial y para guardar-completo),
 * con tipos correctos: los campos de lista se coaccionan a array; los numéricos se coaccionan a número.
 */
export const candidatoFieldsSchema = z.object({
  id: z.coerce.number().int(),
  nombre: z.string().max(MAX_TEXT_LENGTH),
  tipo: z.enum(["interno", "externo"]),
  area: z.string(),
  puesto: z.string(),
  nivel: z.string(),
  exp: z.coerce.number().min(0),
  edu: z.string(),
  ciudad: z.string(),
  modalidad: z.string(),
  salario: z.coerce.number().min(0),
  esp: arrayStr,
  hard: arrayStr,
  soft: arrayStr,
  resumen: z.string().max(MAX_TEXT_LENGTH),
  email: z.string(),
  tel: z.string(),
  experiencia: z.preprocess(aArray, z.array(experienciaItem)),
  educacion: z.preprocess(aArray, z.array(educacionItem)),
  intereses: arrayStr,
  foto: z.string().nullable(),
  favoritos: arrayStr,
  psicometrico: z.object({ fecha: z.string(), ts: z.number() }).nullable(),
  docsPerfil: docsPerfilSchema,
}).partial();

/** Body para crear/guardar un candidato: `{ candidato: {...} }` con los campos ya tipados. */
export const candidatoBodySchema = z.object({ candidato: candidatoFieldsSchema }).strict();

/** Campos de un formador (todos opcionales, tipados). */
export const formadorFieldsSchema = z.object({
  id: z.string(),
  nombre: z.string().max(MAX_TEXT_LENGTH),
  puesto: z.string(),
  area: z.string(),
  favoritosCands: z.preprocess(aArray, z.array(z.coerce.number())),
  categorias: z.preprocess(aArray, z.array(z.object({ nombre: z.string(), cids: z.array(z.number()) }).partial())),
}).partial();

/** Body para crear/actualizar un formador. */
export const formadorBodySchema = z.object({ formador: formadorFieldsSchema }).strict();

/** Body para crear una notificación manualmente. */
export const crearNotificacionSchema = z
  .object({
    para: z.object({
      tipo: z.enum(["formador", "admin", "candidato"]),
      id: z.union([z.string(), z.number()]),
    }),
    titulo: z.string().min(1).max(MAX_TEXT_LENGTH),
    msg: z.string().min(1).max(MAX_TEXT_LENGTH),
    vacId: z.string().max(64).default(""),
  })
  .strict();
