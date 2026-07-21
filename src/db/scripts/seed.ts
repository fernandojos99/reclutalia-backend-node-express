/**
 * Bootstrap: inserta la semilla (`src/data/seed.ts`) en la BD.
 * Idempotente: usa ON CONFLICT DO NOTHING, así re-ejecutarlo no duplica ni pisa datos vivos.
 * Uso: `npm run db:seed` (correr después de `db:migrate`).
 */
import { sql } from "../client";
import { SEED_CANDIDATOS, SEED_FORMADORES, SEED_VACANTES, SEED_NOTIFICACIONES } from "../../data/seed";

async function main(): Promise<void> {
  const db = sql;
  if (!db) {
    console.error("Falta DATABASE_URL en el entorno. Aborta.");
    process.exit(1);
  }
  const json = (v: unknown) => db.json(v as Parameters<typeof db.json>[0]);

  await db.begin(async (tx) => {
    for (const c of SEED_CANDIDATOS) {
      await tx`insert into candidatos (id, tipo, data) values (${c.id}, ${c.tipo}, ${json(c)})
               on conflict (id) do nothing`;
    }
    for (const f of SEED_FORMADORES) {
      await tx`insert into formadores (id, data) values (${f.id}, ${json(f)})
               on conflict (id) do nothing`;
    }
    for (const v of SEED_VACANTES) {
      await tx`insert into vacantes (id, formador_id, estado, data)
               values (${v.id}, ${v.formadorId}, ${v.estado}, ${json(v)})
               on conflict (id) do nothing`;
    }
    for (const n of SEED_NOTIFICACIONES) {
      await tx`insert into notificaciones (id, dest_tipo, dest_id, leida, data)
               values (${n.id}, ${n.para.tipo}, ${String(n.para.id)}, ${n.leida}, ${json(n)})
               on conflict (id) do nothing`;
    }
  });

  console.log(`✔ Semilla insertada: ${SEED_CANDIDATOS.length} candidatos, ${SEED_FORMADORES.length} formadores, ${SEED_VACANTES.length} vacantes, ${SEED_NOTIFICACIONES.length} notificaciones.`);
  await db.end();
}

main().catch((e) => {
  console.error("Error en el seed:", e);
  process.exit(1);
});
