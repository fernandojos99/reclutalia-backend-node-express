-- Esquema de Reclutalia (prototipo). Modelo JSONB por entidad: cada agregado se guarda
-- completo en la columna `data`, con algunas columnas escalares indexadas para consultas.
-- Idempotente: se puede correr varias veces sin error.

create table if not exists candidatos (
  id   integer primary key,
  tipo text,
  data jsonb not null
);

create table if not exists formadores (
  id   text primary key,
  data jsonb not null
);

create table if not exists vacantes (
  id          text primary key,
  formador_id text,
  estado      text,
  data        jsonb not null
);
create index if not exists idx_vacantes_formador on vacantes (formador_id);

create table if not exists notificaciones (
  id        text primary key,
  dest_tipo text,
  dest_id   text,
  leida     boolean default false,
  data      jsonb not null
);
create index if not exists idx_notif_dest on notificaciones (dest_tipo, dest_id);

-- ── Chat del agente IA: sesiones persistentes por usuario/rol (sobreviven cold starts) ──
create table if not exists chat_sesiones (
  id             text primary key,
  owner_tipo     text not null,                       -- 'formador' | 'candidato' | 'admin'
  owner_id       text not null,
  titulo         text not null default 'Nueva conversación',
  estado         text not null default 'activa',      -- 'activa' | 'archivada'
  creada_ts      bigint not null,
  actualizada_ts bigint not null
);
create index if not exists idx_chat_ses_owner on chat_sesiones (owner_tipo, owner_id, actualizada_ts desc);

create table if not exists chat_mensajes (
  id        bigserial primary key,
  sesion_id text not null references chat_sesiones (id) on delete cascade,
  rol       text not null,                            -- 'user' | 'assistant' | 'tool'
  contenido text,
  data      jsonb,                                    -- tool_calls / tool_call_id / name (fidelidad del historial)
  creado_ts bigint not null
);
create index if not exists idx_chat_msg_sesion on chat_mensajes (sesion_id, id);
