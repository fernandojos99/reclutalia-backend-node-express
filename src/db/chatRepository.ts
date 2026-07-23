/**
 * Persistencia del chat del agente IA en Postgres (tablas chat_sesiones / chat_mensajes).
 * Es la fuente de verdad del historial: sobrevive a cold starts, redeploys y reinicios.
 *
 * Sin DATABASE_URL (sql === null) todo es no-op / vacío: el agente funciona igual pero sin
 * memoria entre mensajes (modo demo local sin BD).
 */
import { sql } from "./client";
import type { ChatMessage } from "../agent/deepseek";
import type { Owner } from "../agent/owner";

export interface ChatSesion {
  id: string;
  ownerTipo: string;
  ownerId: string;
  titulo: string;
  estado: string;
  creadaTs: number;
  actualizadaTs: number;
}

/** Partes de un ChatMessage que no son el texto (se guardan en la columna jsonb `data`). */
interface MsgExtra {
  name?: string;
  tool_call_id?: string;
  tool_calls?: ChatMessage["tool_calls"];
}

function rowToSesion(r: Record<string, unknown>): ChatSesion {
  return {
    id: r.id as string,
    ownerTipo: r.owner_tipo as string,
    ownerId: r.owner_id as string,
    titulo: r.titulo as string,
    estado: r.estado as string,
    creadaTs: Number(r.creada_ts),
    actualizadaTs: Number(r.actualizada_ts),
  };
}

export const chatRepository = {
  /** Sesiones de un usuario, más recientes primero. */
  async listar(owner: Owner): Promise<ChatSesion[]> {
    if (!sql) return [];
    const rows = await sql`
      select * from chat_sesiones
      where owner_tipo = ${owner.tipo} and owner_id = ${owner.id}
      order by actualizada_ts desc`;
    return rows.map(rowToSesion);
  },

  async obtener(id: string): Promise<ChatSesion | null> {
    if (!sql) return null;
    const rows = await sql`select * from chat_sesiones where id = ${id}`;
    return rows.length ? rowToSesion(rows[0]) : null;
  },

  /** Crea una sesión nueva. */
  async crear(id: string, owner: Owner, titulo: string): Promise<ChatSesion> {
    const ahora = Date.now();
    const sesion: ChatSesion = {
      id, ownerTipo: owner.tipo, ownerId: owner.id,
      titulo: titulo || "Nueva conversación", estado: "activa",
      creadaTs: ahora, actualizadaTs: ahora,
    };
    if (!sql) return sesion;
    await sql`
      insert into chat_sesiones (id, owner_tipo, owner_id, titulo, estado, creada_ts, actualizada_ts)
      values (${id}, ${owner.tipo}, ${owner.id}, ${sesion.titulo}, 'activa', ${ahora}, ${ahora})
      on conflict (id) do nothing`;
    return sesion;
  },

  /** Garantiza que exista la fila de la sesión (el bot flotante manda un sessionId sin crearla antes). */
  async asegurar(id: string, owner: Owner, titulo: string): Promise<void> {
    if (!sql) return;
    const ahora = Date.now();
    await sql`
      insert into chat_sesiones (id, owner_tipo, owner_id, titulo, estado, creada_ts, actualizada_ts)
      values (${id}, ${owner.tipo}, ${owner.id}, ${titulo || "Nueva conversación"}, 'activa', ${ahora}, ${ahora})
      on conflict (id) do nothing`;
  },

  async renombrar(id: string, titulo: string): Promise<void> {
    if (!sql) return;
    await sql`update chat_sesiones set titulo = ${titulo}, actualizada_ts = ${Date.now()} where id = ${id}`;
  },

  async eliminar(id: string): Promise<void> {
    if (!sql) return;
    await sql`delete from chat_sesiones where id = ${id}`; // cascade borra sus mensajes
  },

  /** Marca actividad; si la sesión sigue con el título por defecto, lo fija con el primer mensaje. */
  async tocar(id: string, tituloSiVacio?: string): Promise<void> {
    if (!sql) return;
    if (tituloSiVacio) {
      const t = tituloSiVacio.slice(0, 60);
      await sql`
        update chat_sesiones
        set actualizada_ts = ${Date.now()},
            titulo = case when titulo = 'Nueva conversación' then ${t} else titulo end
        where id = ${id}`;
    } else {
      await sql`update chat_sesiones set actualizada_ts = ${Date.now()} where id = ${id}`;
    }
  },

  /** Historial COMPLETO de la sesión como ChatMessage[] (para reconstruir la memoria del agente). */
  async getMensajes(sesionId: string): Promise<ChatMessage[]> {
    if (!sql) return [];
    const rows = await sql`
      select rol, contenido, data from chat_mensajes where sesion_id = ${sesionId} order by id asc`;
    return rows.map((r) => {
      const extra = (r.data ?? {}) as MsgExtra;
      const m: ChatMessage = { role: r.rol as ChatMessage["role"], content: (r.contenido ?? null) as string | null };
      if (extra.name) m.name = extra.name;
      if (extra.tool_call_id) m.tool_call_id = extra.tool_call_id;
      if (extra.tool_calls) m.tool_calls = extra.tool_calls;
      return m;
    });
  },

  /** Agrega mensajes nuevos (user/assistant/tool) al final de la sesión. */
  async agregarMensajes(sesionId: string, msgs: ChatMessage[]): Promise<void> {
    const db = sql;
    if (!db || !msgs.length) return;
    const ahora = Date.now();
    const rows = msgs.map((m) => {
      const extra: MsgExtra = {};
      if (m.name) extra.name = m.name;
      if (m.tool_call_id) extra.tool_call_id = m.tool_call_id;
      if (m.tool_calls) extra.tool_calls = m.tool_calls;
      return {
        sesion_id: sesionId,
        rol: m.role,
        contenido: m.content ?? null,
        data: db.json(extra as Parameters<typeof db.json>[0]),
        creado_ts: ahora,
      };
    });
    await db`insert into chat_mensajes ${db(rows, "sesion_id", "rol", "contenido", "data", "creado_ts")}`;
  },
};
