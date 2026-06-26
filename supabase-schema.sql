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
  open_tabs   jsonb,           -- { openTabIds: string[], activeTabId: string | null }
  updated_at  timestamptz default now()
);

-- Add open_tabs column if upgrading from older schema
alter table fl_workspaces add column if not exists open_tabs jsonb;

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

-- Spaces (top-level workspace groups, like ClickUp Spaces)
create table if not exists tb_spaces (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default 'My Workspace',
  color       text not null default '#6366f1',
  icon        text not null default '🚀',
  description text not null default '',
  position    integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists tb_spaces_user_id_idx on tb_spaces(user_id);
alter table tb_spaces enable row level security;
create policy "tb_spaces: owner only"
  on tb_spaces for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Projects (boards within a space)
create table if not exists tb_projects (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  space_id    uuid references tb_spaces(id) on delete cascade not null,
  name        text not null default 'Project',
  description text not null default '',
  color       text not null default '#6366f1',
  icon        text not null default '📋',
  status      text not null default 'active',  -- active | archived
  position    integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists tb_projects_user_id_idx  on tb_projects(user_id);
create index if not exists tb_projects_space_id_idx on tb_projects(space_id);
alter table tb_projects enable row level security;
create policy "tb_projects: owner only"
  on tb_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Columns (dynamic status columns per project)
create table if not exists tb_columns (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references tb_projects(id) on delete cascade not null,
  name        text not null,
  color       text not null default '#64748b',
  position    integer not null default 0,
  is_done     boolean not null default false,
  created_at  timestamptz default now()
);

create index if not exists tb_columns_project_id_idx on tb_columns(project_id);
alter table tb_columns enable row level security;
create policy "tb_columns: owner only"
  on tb_columns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tasks (belong to a project + column)
create table if not exists tb_tasks (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  space_id        uuid references tb_spaces(id) on delete cascade,
  project_id      uuid references tb_projects(id) on delete cascade,
  column_id       text not null default '',   -- stores tb_columns.id (uuid as text)
  title           text not null,
  description     text not null default '',
  priority        text not null default 'medium',
  labels          text[] default '{}',
  due_date        date,
  position        integer not null default 0,
  is_completed    boolean not null default false,
  subtasks        jsonb not null default '[]',
  comments        jsonb not null default '[]',
  estimated_hours numeric,
  assignee_name   text,
  attachments     text[] default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists tb_tasks_user_id_idx    on tb_tasks(user_id);
create index if not exists tb_tasks_project_id_idx on tb_tasks(project_id);
create index if not exists tb_tasks_column_id_idx  on tb_tasks(user_id, column_id);
create index if not exists tb_tasks_position_idx   on tb_tasks(project_id, column_id, position);

alter table tb_tasks enable row level security;
create policy "tb_tasks: owner only"
  on tb_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migration: add new columns to existing tb_tasks rows
alter table tb_tasks add column if not exists space_id   uuid references tb_spaces(id) on delete cascade;
alter table tb_tasks add column if not exists project_id uuid references tb_projects(id) on delete cascade;

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
  content       jsonb,                             -- TipTap JSON document (rich mode)
  content_text  text not null default '',          -- plain text for search
  raw_content   text not null default '',          -- verbatim text for code/raw mode
  note_type     text not null default 'rich',      -- 'rich' | 'code'
  icon          text not null default '📝',
  cover_color   text not null default '',
  is_pinned     boolean not null default false,
  is_favorite   boolean not null default false,
  is_archived   boolean not null default false,
  tags          text[] default '{}',
  word_count    integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Migration: add new columns to existing notes tables
alter table notes add column if not exists raw_content  text not null default '';
alter table notes add column if not exists note_type    text not null default 'rich';

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
