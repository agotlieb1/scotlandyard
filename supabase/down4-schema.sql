-- Down4: a permanent, bookmarkable board for a friend group.
-- Run this alongside schema.sql in your Supabase project.

create extension if not exists "pgcrypto";

create table if not exists down4_crews (
  code text primary key,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists down4_members (
  id uuid primary key default gen_random_uuid(),
  crew_code text not null references down4_crews (code) on delete cascade,
  member_id text not null,
  name text not null,
  is_down boolean not null default false,
  down_for text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists down4_members_unique_member
  on down4_members (crew_code, member_id);

create index if not exists down4_members_by_crew
  on down4_members (crew_code, created_at);

alter table down4_crews enable row level security;
alter table down4_members enable row level security;

do $$
begin
  create policy "Public crews read" on down4_crews
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public crews insert" on down4_crews
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public members read" on down4_members
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public members insert" on down4_members
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public members update" on down4_members
    for update using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public members delete" on down4_members
    for delete using (true);
exception
  when duplicate_object then null;
end $$;

-- Realtime: the board listens for member changes so the crew stays in sync.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'down4_members'
     )
  then
    alter publication supabase_realtime add table down4_members;
  end if;
end
$$;
