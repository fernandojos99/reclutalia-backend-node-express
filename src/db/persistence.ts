/**
 * Puente entre el store en memoria y Postgres (modo "siempre fresco").
 *
 * Flujo por request (ver app.ts):
 *   1. refreshStore(): re-hidrata el store desde la BD → datos siempre actuales (sin caché stale
 *      ni clobbering entre instancias serverless).
 *   2. En escrituras: snapshotStore() captura el estado ANTES de mutar; tras responder,
 *      persistChanged() hace upsert SOLO de las entidades que cambiaron (diff por JSON).
 *
 * Sin DATABASE_URL, todo esto es no-op y el backend usa la semilla en memoria.
 *
 * Nota (prototipo): el `store` es global; bajo alta concurrencia dentro de una misma instancia
 * dos requests podrían pisarse (refresh/mutación intercalados). Para el volumen de la demo es
 * aceptable; una versión productiva usaría acceso por-entidad o transacciones a nivel de request.
 */
import { sql } from "./client";
import { store } from "../data/store";
import type { Candidato, Formador, Vacante, Notificacion } from "../types/domain";

/** Snapshot id→JSON de cada colección, para detectar qué cambió en un request. */
export interface Snapshot {
  candidatos: Map<number, string>;
  formadores: Map<string, string>;
  vacantes: Map<string, string>;
  notificaciones: Map<string, string>;
}

let avisoVacio = false;

/** Reintenta una operación de BD ante errores de conexión transitorios (pooler serverless). */
async function withRetry<T>(fn: () => Promise<T>, intentos = 3): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      const msg = (e as Error).message || "";
      const transitorio = /ECONNRESET|socket|terminated|timeout|Connection|CONNECT/i.test(msg);
      if (!transitorio || i === intentos - 1) throw e;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw ultimo;
}

/** Re-hidrata las 4 colecciones desde la BD al store en memoria. Se llama en cada request. */
export async function refreshStore(): Promise<void> {
  if (!sql) return;
  const db = sql;
  const [cands, forms, vacs, notifs] = await withRetry(() => Promise.all([
    db`select data from candidatos order by id desc`,
    db`select data from formadores`,
    db`select data from vacantes`,
    db`select data from notificaciones`,
  ]));

  if (cands.length + forms.length + vacs.length + notifs.length === 0) {
    if (!avisoVacio) {
      console.warn("[db] Las tablas están vacías. Ejecuta `npm run db:seed` para poblarlas.");
      avisoVacio = true;
    }
    return; // conserva la semilla en memoria
  }

  store.candidatos = cands.map((r) => r.data as Candidato);
  store.formadores = forms.map((r) => r.data as Formador);
  store.vacantes = vacs.map((r) => r.data as Vacante);
  store.notificaciones = notifs.map((r) => r.data as Notificacion);
}

/** Captura el estado actual del store como mapas id→JSON. */
export function snapshotStore(): Snapshot {
  return {
    candidatos: new Map(store.candidatos.map((c) => [c.id, JSON.stringify(c)])),
    formadores: new Map(store.formadores.map((f) => [f.id, JSON.stringify(f)])),
    vacantes: new Map(store.vacantes.map((v) => [v.id, JSON.stringify(v)])),
    notificaciones: new Map(store.notificaciones.map((n) => [n.id, JSON.stringify(n)])),
  };
}

/** Ids del snapshot que ya no están en el store (fueron eliminados durante el request). */
function eliminados<T>(snapKeys: IterableIterator<T>, presentes: Set<T>): T[] {
  return [...snapKeys].filter((id) => !presentes.has(id));
}

/**
 * Persiste los cambios de un request contra la BD:
 *   - upsert de las entidades cuyo JSON cambió o son nuevas,
 *   - DELETE de las entidades que estaban en el snapshot y ya no están en el store.
 */
export async function persistChanged(snap: Snapshot): Promise<void> {
  const db = sql;
  if (!db) return;
  const json = (v: unknown) => db.json(v as Parameters<typeof db.json>[0]);

  // Entidades cambiadas o nuevas (upsert).
  const dc = store.candidatos.filter((c) => snap.candidatos.get(c.id) !== JSON.stringify(c));
  const df = store.formadores.filter((f) => snap.formadores.get(f.id) !== JSON.stringify(f));
  const dv = store.vacantes.filter((v) => snap.vacantes.get(v.id) !== JSON.stringify(v));
  const dn = store.notificaciones.filter((n) => snap.notificaciones.get(n.id) !== JSON.stringify(n));

  // Entidades eliminadas (delete).
  const delC = eliminados(snap.candidatos.keys(), new Set(store.candidatos.map((c) => c.id)));
  const delF = eliminados(snap.formadores.keys(), new Set(store.formadores.map((f) => f.id)));
  const delV = eliminados(snap.vacantes.keys(), new Set(store.vacantes.map((v) => v.id)));
  const delN = eliminados(snap.notificaciones.keys(), new Set(store.notificaciones.map((n) => n.id)));

  if (!dc.length && !df.length && !dv.length && !dn.length &&
      !delC.length && !delF.length && !delV.length && !delN.length) return; // nada que hacer

  await withRetry(() => db.begin(async (tx) => {
    if (dc.length) {
      const rows = dc.map((c) => ({ id: c.id, tipo: c.tipo, data: json(c) }));
      await tx`insert into candidatos ${tx(rows, "id", "tipo", "data")}
               on conflict (id) do update set tipo = excluded.tipo, data = excluded.data`;
    }
    if (df.length) {
      const rows = df.map((f) => ({ id: f.id, data: json(f) }));
      await tx`insert into formadores ${tx(rows, "id", "data")}
               on conflict (id) do update set data = excluded.data`;
    }
    if (dv.length) {
      const rows = dv.map((v) => ({ id: v.id, formador_id: v.formadorId, estado: v.estado, data: json(v) }));
      await tx`insert into vacantes ${tx(rows, "id", "formador_id", "estado", "data")}
               on conflict (id) do update set formador_id = excluded.formador_id, estado = excluded.estado, data = excluded.data`;
    }
    if (dn.length) {
      const rows = dn.map((n) => ({ id: n.id, dest_tipo: n.para.tipo, dest_id: String(n.para.id), leida: n.leida, data: json(n) }));
      await tx`insert into notificaciones ${tx(rows, "id", "dest_tipo", "dest_id", "leida", "data")}
               on conflict (id) do update set dest_tipo = excluded.dest_tipo, dest_id = excluded.dest_id, leida = excluded.leida, data = excluded.data`;
    }
    // Borrados
    if (delC.length) await tx`delete from candidatos where id in ${tx(delC)}`;
    if (delF.length) await tx`delete from formadores where id in ${tx(delF)}`;
    if (delV.length) await tx`delete from vacantes where id in ${tx(delV)}`;
    if (delN.length) await tx`delete from notificaciones where id in ${tx(delN)}`;
  }));
}
