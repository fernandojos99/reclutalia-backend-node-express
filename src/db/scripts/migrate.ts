/**
 * Migración: crea las tablas del esquema (idempotente).
 * Uso: `npm run db:migrate` (requiere DATABASE_URL en .env y estar en red IPv6 si aplica).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../client";

async function main(): Promise<void> {
  if (!sql) {
    console.error("Falta DATABASE_URL en el entorno. Aborta.");
    process.exit(1);
  }
  const schema = readFileSync(join(__dirname, "..", "schema.sql"), "utf8");

  // Ejecuta cada sentencia por separado (el esquema no contiene ';' dentro de una sentencia).
  const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }

  console.log(`✔ Migración aplicada (${statements.length} sentencias).`);
  await sql.end();
}

main().catch((e) => {
  console.error("Error en la migración:", e);
  process.exit(1);
});
