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
