-- Down4: a permanent, bookmarkable board for a friend group.
-- Run this alongside schema.sql in your Supabase project. Safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists down4_crews (
  code text primary key,
  name text,
  created_at timestamptz not null default now()
);

-- A beacon is one plan. Several friends can share it ("me too"), which is why
-- it lives in its own table instead of on the member row.
create table if not exists down4_beacons (
  id uuid primary key default gen_random_uuid(),
  crew_code text not null references down4_crews (code) on delete cascade,
  activity text not null,
  area text not null default '',
  until_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists down4_members (
  id uuid primary key default gen_random_uuid(),
  crew_code text not null references down4_crews (code) on delete cascade,
  member_id text not null,
  name text not null,
  beacon_id uuid references down4_beacons (id) on delete set null,
  beacon_joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path from the first cut of this schema, which kept a boolean and a
-- free-text note on the member row.
alter table down4_members
  add column if not exists beacon_id uuid references down4_beacons (id) on delete set null,
  add column if not exists beacon_joined_at timestamptz;

alter table down4_members
  drop column if exists is_down,
  drop column if exists down_for;

create unique index if not exists down4_members_unique_member
  on down4_members (crew_code, member_id);

create index if not exists down4_members_by_crew
  on down4_members (crew_code, created_at);

create index if not exists down4_members_by_beacon
  on down4_members (beacon_id);

create index if not exists down4_beacons_by_crew
  on down4_beacons (crew_code, created_at desc);

alter table down4_crews enable row level security;
alter table down4_beacons enable row level security;
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
  create policy "Public beacons read" on down4_beacons
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public beacons insert" on down4_beacons
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public beacons update" on down4_beacons
    for update using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public beacons delete" on down4_beacons
    for delete using (true);
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

-- Realtime: the board listens for beacon and member changes so the crew stays
-- in sync without a refresh.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['down4_beacons', 'down4_members'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;
