/**
 * Reinicia la BD al estado de `src/data/seed.ts` (DESTRUCTIVO).
 * Uso: `npm run db:reset` (requiere DATABASE_URL en .env).
 */
import { sql } from "../client";
import { reseedDatabase } from "../reseed";

async function main(): Promise<void> {
  if (!sql) {
    console.error("Falta DATABASE_URL en el entorno. Aborta.");
    process.exit(1);
  }
  const r = await reseedDatabase();
  console.log(`✔ BD reiniciada al seed: ${r.candidatos} candidatos, ${r.formadores} formadores, ${r.vacantes} vacantes, ${r.notificaciones} notificaciones.`);
  await sql.end();
}

main().catch((e) => {
  console.error("Error en el reset:", e);
  process.exit(1);
});
