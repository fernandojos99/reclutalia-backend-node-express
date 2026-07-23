/**
 * Reinicia la BD al estado EXACTO de `src/data/seed.ts`:
 * borra todas las filas de las 4 tablas y reinserta la semilla, en una transacción.
 *
 * Operación DESTRUCTIVA: elimina cualquier dato creado después del seed. La usan el script
 * `npm run db:reset` y el endpoint protegido POST /api/admin/reset-seed.
 */
import { sql } from "./client";
import { store, resetStore } from "../data/store";
import { SEED_CANDIDATOS, SEED_FORMADORES, SEED_VACANTES, SEED_NOTIFICACIONES } from "../data/seed";

export interface ReseedResultado {
  candidatos: number;
  formadores: number;
  vacantes: number;
  notificaciones: number;
}

export async function reseedDatabase(): Promise<ReseedResultado> {
  // Siempre reinicia el store en memoria (fuente para el modo sin BD).
  resetStore();

  const db = sql;
  if (db) {
    const json = (v: unknown) => db.json(v as Parameters<typeof db.json>[0]);
    await db.begin(async (tx) => {
      // Vaciar todo (incluidas las conversaciones del chat: reset deja la app como recién instalada).
      await tx`delete from chat_mensajes`;
      await tx`delete from chat_sesiones`;
      await tx`delete from chat_conv_mensajes`;
      await tx`delete from chat_conversaciones`;
      await tx`delete from notificaciones`;
      await tx`delete from vacantes`;
      await tx`delete from candidatos`;
      await tx`delete from formadores`;
      // Reinsertar la semilla.
      await tx`insert into candidatos ${tx(SEED_CANDIDATOS.map((c) => ({ id: c.id, tipo: c.tipo, data: json(c) })), "id", "tipo", "data")}`;
      await tx`insert into formadores ${tx(SEED_FORMADORES.map((f) => ({ id: f.id, data: json(f) })), "id", "data")}`;
      await tx`insert into vacantes ${tx(SEED_VACANTES.map((v) => ({ id: v.id, formador_id: v.formadorId, estado: v.estado, data: json(v) })), "id", "formador_id", "estado", "data")}`;
      await tx`insert into notificaciones ${tx(SEED_NOTIFICACIONES.map((n) => ({ id: n.id, dest_tipo: n.para.tipo, dest_id: String(n.para.id), leida: n.leida, data: json(n) })), "id", "dest_tipo", "dest_id", "leida", "data")}`;
    });
  }

  return {
    candidatos: store.candidatos.length,
    formadores: store.formadores.length,
    vacantes: store.vacantes.length,
    notificaciones: store.notificaciones.length,
  };
}
