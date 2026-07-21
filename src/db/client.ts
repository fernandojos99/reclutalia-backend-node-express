/**
 * Cliente Postgres (Supabase). Usa la librería `postgres` (porsager).
 *
 * La cadena de conexión es el POOLER de Supabase (puerto 6543 = pgBouncer en modo transacción),
 * por eso `prepare: false` (pgBouncer no soporta prepared statements persistentes).
 * SSL requerido por Supabase; en el prototipo no verificamos el CA (rejectUnauthorized:false).
 *
 * `sql` es null si no hay DATABASE_URL configurada (modo memoria sin persistencia).
 */
import postgres from "postgres";
import { env } from "../config/env";

export const sql = env.dbUrl
  ? postgres(env.dbUrl, {
      prepare: false,
      ssl: { rejectUnauthorized: false },
      max: 5, // pocas conexiones: el pooler ya multiplexa
      idle_timeout: 20,
    })
  : null;

/** True si hay base de datos configurada. */
export const dbEnabled = sql !== null;
