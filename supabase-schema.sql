-- ================================================================
-- BLANZEAPP — SUPABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- ================================================================


-- ================================================================
-- 1. FETCHLAB
-- ================================================================

-- Stores the entire request/folder tree + env vars as JSONB per user.
-- One row per user (upsert pattern keeps it simple for a nested tree).
create table if not exists fl_workspaces (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  items       jsonb not null default '[]',
  env_vars    jsonb not null default '[]',
  updated_at  timestamptz default now()
);

-- Each history entry (method, url, status, timing) stored individually.
create table if not exists fl_history (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  method      text not null,
  url         text not null,
  status      integer not null default 0,
  duration    integer not null default 0,
  size        integer not null default 0,
  created_at  timestamptz default now()
);

create index if not exists fl_history_user_id_idx on fl_history(user_id);
create index if not exists fl_history_created_at_idx on fl_history(user_id, created_at desc);

-- Row Level Security
alter table fl_workspaces enable row level security;
alter table fl_history    enable row level security;

create policy "fl_workspaces: owner only"
  on fl_workspaces for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fl_history: owner only"
  on fl_history for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ================================================================
-- 2. TASK BOARD
-- ================================================================

-- Each task row belongs to one user.
-- Column membership is stored as a text column_id (matches the
-- fixed column IDs: backlog | todo | in-progress | review | done).
-- Subtasks and comments are stored as JSONB arrays for simplicity.
create table if not exists tb_tasks (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  title           text not null,
  description     text not null default '',
  priority        text not null default 'medium',   -- urgent | high | medium | low
  labels          text[] default '{}',
  due_date        date,
  column_id       text not null default 'backlog',  -- backlog | todo | in-progress | review | done
  position        integer not null default 0,
  is_completed    boolean not null default false,
  subtasks        jsonb not null default '[]',      -- [{ id, title, completed }]
  comments        jsonb not null default '[]',      -- [{ id, text, authorName, createdAt }]
  estimated_hours numeric,
  assignee_name   text,
  attachments     text[] default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists tb_tasks_user_id_idx    on tb_tasks(user_id);
create index if not exists tb_tasks_column_id_idx  on tb_tasks(user_id, column_id);
create index if not exists tb_tasks_position_idx   on tb_tasks(user_id, column_id, position);

alter table tb_tasks enable row level security;

create policy "tb_tasks: owner only"
  on tb_tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tb_tasks_updated_at
  before update on tb_tasks
  for each row execute procedure set_updated_at();


-- ================================================================
-- 3. NOTES
-- ================================================================

-- Folders (supports nesting via parent_id self-reference).
create table if not exists note_folders (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  icon        text not null default '📁',
  color       text not null default '#3b82f6',
  parent_id   uuid references note_folders(id) on delete cascade,
  position    integer not null default 0,
  created_at  timestamptz default now()
);

create index if not exists note_folders_user_id_idx  on note_folders(user_id);
create index if not exists note_folders_parent_id_idx on note_folders(parent_id);

-- Notes — TipTap JSON content stored in `content` jsonb column.
-- `content_text` holds plain-text extraction for full-text search.
create table if not exists notes (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  folder_id     uuid references note_folders(id) on delete set null,
  title         text not null default 'Untitled',
  content       jsonb,                             -- TipTap JSON document
  content_text  text not null default '',          -- plain text for search
  icon          text not null default '📝',
  cover_color   text not null default '#3b82f6',
  is_pinned     boolean not null default false,
  is_favorite   boolean not null default false,
  is_archived   boolean not null default false,
  tags          text[] default '{}',
  word_count    integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists notes_user_id_idx    on notes(user_id);
create index if not exists notes_folder_id_idx  on notes(folder_id);
create index if not exists notes_updated_at_idx on notes(user_id, updated_at desc);
create index if not exists notes_search_idx     on notes using gin(to_tsvector('english', content_text));

alter table note_folders enable row level security;
alter table notes         enable row level security;

create policy "note_folders: owner only"
  on note_folders for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes: owner only"
  on notes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger notes_updated_at
  before update on notes
  for each row execute procedure set_updated_at();


-- ================================================================
-- DONE. Verify tables:
-- select tablename from pg_tables where schemaname = 'public';
-- ================================================================
