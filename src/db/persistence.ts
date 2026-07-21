/**
 * Puente entre el store en memoria y Postgres.
 *
 * Estrategia (prototipo): el store en memoria sigue siendo la fuente que leen repos/servicios
 * (que mutan objetos vivos). Al arrancar se HIDRATA desde la BD; tras cada escritura se hace
 * WRITE-THROUGH (upsert de todo el store). Así no hay que reescribir servicios a async.
 *
 * Sin DATABASE_URL, todo esto es no-op y el backend usa la semilla en memoria.
 */
import { sql, dbEnabled } from "./client";
import { store } from "../data/store";

/** Carga las 4 colecciones desde la BD al store en memoria. */
export async function hydrateFromDb(): Promise<void> {
  if (!sql) return;
  const [cands, forms, vacs, notifs] = await Promise.all([
    sql`select data from candidatos order by id desc`,
    sql`select data from formadores`,
    sql`select data from vacantes`,
    sql`select data from notificaciones`,
  ]);

  const total = cands.length + forms.length + vacs.length + notifs.length;
  if (total === 0) {
    // BD vacía: conservamos la semilla en memoria y avisamos. Corre `npm run db:seed`
    // para poblar la BD (o la primera escritura la persistirá automáticamente).
    console.warn("[db] Las tablas están vacías. Ejecuta `npm run db:seed` para poblarlas.");
    return;
  }

  store.candidatos = cands.map((r) => r.data);
  store.formadores = forms.map((r) => r.data);
  store.vacantes = vacs.map((r) => r.data);
  store.notificaciones = notifs.map((r) => r.data);
  console.log(`[db] Store hidratado desde Supabase (${store.candidatos.length} candidatos, ${store.vacantes.length} vacantes).`);
}

/** Hidratación memoizada: se ejecuta una sola vez por proceso. */
let hydrating: Promise<void> | null = null;
export function ensureHydrated(): Promise<void> {
  if (!dbEnabled) return Promise.resolve();
  if (!hydrating) {
    hydrating = hydrateFromDb().catch((e) => {
      hydrating = null; // permite reintentar en la siguiente petición
      throw e;
    });
  }
  return hydrating;
}

/**
 * Upsert de todo el store a la BD (write-through). No hay borrados en el dominio.
 * Usa BULK upsert (una query por tabla) para minimizar round-trips a Supabase.
 */
export async function persistStore(): Promise<void> {
  const db = sql;
  if (!db) return;
  const json = (v: unknown) => db.json(v as Parameters<typeof db.json>[0]);

  await db.begin(async (tx) => {
    if (store.candidatos.length) {
      const rows = store.candidatos.map((c) => ({ id: c.id, tipo: c.tipo, data: json(c) }));
      await tx`insert into candidatos ${tx(rows, "id", "tipo", "data")}
               on conflict (id) do update set tipo = excluded.tipo, data = excluded.data`;
    }
    if (store.formadores.length) {
      const rows = store.formadores.map((f) => ({ id: f.id, data: json(f) }));
      await tx`insert into formadores ${tx(rows, "id", "data")}
               on conflict (id) do update set data = excluded.data`;
    }
    if (store.vacantes.length) {
      const rows = store.vacantes.map((v) => ({ id: v.id, formador_id: v.formadorId, estado: v.estado, data: json(v) }));
      await tx`insert into vacantes ${tx(rows, "id", "formador_id", "estado", "data")}
               on conflict (id) do update set formador_id = excluded.formador_id, estado = excluded.estado, data = excluded.data`;
    }
    if (store.notificaciones.length) {
      const rows = store.notificaciones.map((n) => ({ id: n.id, dest_tipo: n.para.tipo, dest_id: String(n.para.id), leida: n.leida, data: json(n) }));
      await tx`insert into notificaciones ${tx(rows, "id", "dest_tipo", "dest_id", "leida", "data")}
               on conflict (id) do update set dest_tipo = excluded.dest_tipo, dest_id = excluded.dest_id, leida = excluded.leida, data = excluded.data`;
    }
  });
}
