create extension if not exists "pgcrypto";

create table if not exists investigations (
  code text primary key,
  created_at timestamptz not null default now()
);

create table if not exists investigation_players (
  id uuid primary key default gen_random_uuid(),
  investigation_code text not null references investigations (code) on delete cascade,
  player_id text not null,
  alias_title text,
  alias_color text,
  alias_locked boolean not null default false,
  identity text,
  is_murderer boolean not null default false,
  evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists investigation_players_unique_player
  on investigation_players (investigation_code, player_id);

create unique index if not exists investigation_players_unique_alias_color
  on investigation_players (investigation_code, alias_color)
  where alias_color is not null;

create unique index if not exists investigation_players_unique_identity
  on investigation_players (investigation_code, identity)
  where identity is not null;

create table if not exists investigation_case_files (
  investigation_code text primary key references investigations (code) on delete cascade,
  murderer_alias text not null,
  weapon text not null,
  location text not null,
  motive text not null,
  created_at timestamptz not null default now()
);

create table if not exists investigation_accusations (
  id uuid primary key default gen_random_uuid(),
  investigation_code text not null references investigations (code) on delete cascade,
  accuser_player_id text not null,
  accused_alias text not null,
  accused_identity text not null,
  weapon text,
  location text,
  motive text,
  is_correct boolean not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists investigation_accusations_by_code
  on investigation_accusations (investigation_code, created_at desc);

alter table investigations enable row level security;
alter table investigation_players enable row level security;
alter table investigation_case_files enable row level security;
alter table investigation_accusations enable row level security;

create policy "Public investigations read" on investigations
  for select using (true);

create policy "Public investigations insert" on investigations
  for insert with check (true);

create policy "Public players read" on investigation_players
  for select using (true);

create policy "Public players insert" on investigation_players
  for insert with check (true);

create policy "Public players update" on investigation_players
  for update using (true) with check (true);

create policy "Public case files read" on investigation_case_files
  for select using (true);

create policy "Public case files insert" on investigation_case_files
  for insert with check (true);

create policy "Public case files update" on investigation_case_files
  for update using (true) with check (true);

create policy "Public accusations read" on investigation_accusations
  for select using (true);

create policy "Public accusations insert" on investigation_accusations
  for insert with check (true);
