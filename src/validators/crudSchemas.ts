/** Esquemas para las operaciones CRUD añadidas (create/update de recursos). */
import { z } from "zod";
import { MAX_TEXT_LENGTH } from "../config/constants";

/** Body para crear/guardar un candidato: objeto libre (el servicio aplica plantilla/merge). */
export const candidatoBodySchema = z.object({ candidato: z.record(z.unknown()) }).strict();

/** Body para crear/actualizar un formador: objeto libre (el servicio aplica plantilla/merge). */
export const formadorBodySchema = z.object({ formador: z.record(z.unknown()) }).strict();

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
