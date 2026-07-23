/**
 * Persistencia del CHAT DIRECTO persona↔persona (candidato↔formador / admin↔formador), dentro de un
 * proceso/vacante. Cada conversación tiene exactamente dos participantes y su historial solo lo ven
 * ellos. La id es determinista (dc_<vacId>_<part1>_<part2> ordenados) para que ambos lados coincidan.
 */
import { sql } from "./client";

export interface Participante { tipo: string; id: string; }

export interface ConvMensaje {
  autorTipo: string;
  autorId: string;
  contenido: string;
  creadoTs: number;
}

export interface Conversacion {
  id: string;
  vacId: string | null;
  a: Participante;
  b: Participante;
  creadaTs: number;
  actualizadaTs: number;
  ultimo?: string | null;
  ultimoTs?: number | null;
}

/** Id determinista de la conversación (mismos participantes → misma id, sin importar el orden). */
export function convIdDe(vacId: string, x: Participante, y: Participante): string {
  const [p1, p2] = [`${x.tipo}:${x.id}`, `${y.tipo}:${y.id}`].sort();
  return `dc_${vacId}_${p1}_${p2}`;
}

/** Ordena los dos participantes de forma estable (para almacenarlos como A/B consistentes). */
function ordenar(x: Participante, y: Participante): [Participante, Participante] {
  return `${x.tipo}:${x.id}` <= `${y.tipo}:${y.id}` ? [x, y] : [y, x];
}

export function esParticipante(c: Conversacion, p: Participante): boolean {
  return (c.a.tipo === p.tipo && c.a.id === p.id) || (c.b.tipo === p.tipo && c.b.id === p.id);
}

function rowToConv(r: Record<string, unknown>): Conversacion {
  return {
    id: r.id as string,
    vacId: (r.vac_id as string) ?? null,
    a: { tipo: r.a_tipo as string, id: r.a_id as string },
    b: { tipo: r.b_tipo as string, id: r.b_id as string },
    creadaTs: Number(r.creada_ts),
    actualizadaTs: Number(r.actualizada_ts),
    ultimo: (r.ultimo as string) ?? null,
    ultimoTs: r.ultimo_ts != null ? Number(r.ultimo_ts) : null,
  };
}

export const directChatRepository = {
  /** Garantiza que exista la conversación (los participantes se guardan ordenados de forma estable). */
  async asegurar(id: string, vacId: string, x: Participante, y: Participante): Promise<void> {
    if (!sql) return;
    const [a, b] = ordenar(x, y);
    const ahora = Date.now();
    await sql`
      insert into chat_conversaciones (id, vac_id, a_tipo, a_id, b_tipo, b_id, creada_ts, actualizada_ts)
      values (${id}, ${vacId}, ${a.tipo}, ${a.id}, ${b.tipo}, ${b.id}, ${ahora}, ${ahora})
      on conflict (id) do nothing`;
  },

  async obtener(id: string): Promise<Conversacion | null> {
    if (!sql) return null;
    const rows = await sql`select * from chat_conversaciones where id = ${id}`;
    return rows.length ? rowToConv(rows[0]) : null;
  },

  async getMensajes(convId: string): Promise<ConvMensaje[]> {
    if (!sql) return [];
    const rows = await sql`
      select autor_tipo, autor_id, contenido, creado_ts
      from chat_conv_mensajes where conv_id = ${convId} order by id asc`;
    return rows.map((r) => ({
      autorTipo: r.autor_tipo as string,
      autorId: r.autor_id as string,
      contenido: r.contenido as string,
      creadoTs: Number(r.creado_ts),
    }));
  },

  async agregarMensaje(convId: string, autor: Participante, contenido: string): Promise<void> {
    if (!sql) return;
    const ahora = Date.now();
    await sql`
      insert into chat_conv_mensajes (conv_id, autor_tipo, autor_id, contenido, creado_ts)
      values (${convId}, ${autor.tipo}, ${autor.id}, ${contenido}, ${ahora})`;
    await sql`update chat_conversaciones set actualizada_ts = ${ahora} where id = ${convId}`;
  },

  /** Conversaciones donde `p` es uno de los participantes, con su último mensaje, más recientes primero. */
  async listarPorParticipante(p: Participante): Promise<Conversacion[]> {
    if (!sql) return [];
    const rows = await sql`
      select c.*, m.contenido as ultimo, m.creado_ts as ultimo_ts
      from chat_conversaciones c
      left join lateral (
        select contenido, creado_ts from chat_conv_mensajes where conv_id = c.id order by id desc limit 1
      ) m on true
      where (c.a_tipo = ${p.tipo} and c.a_id = ${p.id}) or (c.b_tipo = ${p.tipo} and c.b_id = ${p.id})
      order by c.actualizada_ts desc`;
    return rows.map(rowToConv);
  },
};
