-- Mario House Party: online play.
-- Run this alongside schema.sql in your Supabase project. Safe to re-run.
--
-- Reconstructed from what src/lib/mario-games.ts, mario-game-start.ts and
-- mario-game-actions.ts read and write. If the tables already exist in your
-- project, this adds only what is missing and leaves your data alone.

create extension if not exists "pgcrypto";

-- One game, found by the same five-character code the investigations use.
create table if not exists mario_games (
  code text primary key,
  status text not null default 'setup',
  display_device_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz
);

do $$
begin
  alter table mario_games
    add constraint mario_games_status_check
    check (status in ('setup', 'playing', 'final_rounds', 'finished'));
exception
  when duplicate_object then null;
end $$;

-- A seat at the table: who they are, the cards in their hand, and the four
-- house boards they play cards onto. Hand and board are whole JSON documents
-- because the game reads and replaces them as a unit.
create table if not exists mario_game_players (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references mario_games (code) on delete cascade,
  player_id text not null,
  player_name text,
  player_color text not null,
  hand jsonb not null default '[]'::jsonb,
  board jsonb not null default jsonb_build_object(
    'inPlay', '[]'::jsonb,
    'mario-bros', jsonb_build_object('heroes', '[]'::jsonb, 'collectables', '[]'::jsonb),
    'mushroom-kingdom', jsonb_build_object('heroes', '[]'::jsonb, 'collectables', '[]'::jsonb),
    'kong-island', jsonb_build_object('heroes', '[]'::jsonb, 'collectables', '[]'::jsonb),
    'bowsers-castle', jsonb_build_object('heroes', '[]'::jsonb, 'collectables', '[]'::jsonb, 'monsters', '[]'::jsonb)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Boards saved before the mat had a temporary row simply have no 'inPlay'
-- key; the app reads a missing key as an empty row, so there is nothing to
-- migrate.

-- upsertMarioPlayer passes onConflict "game_code,player_id", so this index is
-- what makes rejoining from the same device update the seat instead of adding
-- a second one.
create unique index if not exists mario_game_players_unique_player
  on mario_game_players (game_code, player_id);

-- Turn order is the order players joined: endTurn walks this list to find who
-- is next.
create index if not exists mario_game_players_by_game
  on mario_game_players (game_code, created_at);

-- The shared table: the draw pile, whose turn it is, and what they have spent
-- it on so far. One row per game.
create table if not exists mario_game_state (
  game_code text primary key references mario_games (code) on delete cascade,
  deck jsonb not null default '[]'::jsonb,
  discard_pile jsonb not null default '[]'::jsonb,
  current_turn_player_id text,
  turn_number integer not null default 1,
  actions_taken jsonb not null default '[]'::jsonb,
  steal_used boolean not null default false,
  -- Star Power and Piranha Plants outlive the action that played them.
  effects jsonb not null default jsonb_build_object('starPower', '{}'::jsonb, 'skipNext', '[]'::jsonb),
  -- Enough of the table to put it back, so Thwomp can reverse the last play.
  last_action jsonb,
  updated_at timestamptz not null default now()
);

-- Games that started before cards had lasting effects simply have neither
-- column; both default rather than needing a migration.
alter table mario_game_state
  add column if not exists effects jsonb not null default jsonb_build_object('starPower', '{}'::jsonb, 'skipNext', '[]'::jsonb),
  add column if not exists last_action jsonb;

alter table mario_games enable row level security;
alter table mario_game_players enable row level security;
alter table mario_game_state enable row level security;

-- Open policies for MVP testing, the same as the rest of this project.
-- Tighten these before shipping.
do $$
begin
  create policy "Public mario games read" on mario_games
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario games insert" on mario_games
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario games update" on mario_games
    for update using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario players read" on mario_game_players
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario players insert" on mario_game_players
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario players update" on mario_game_players
    for update using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario players delete" on mario_game_players
    for delete using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario state read" on mario_game_state
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario state insert" on mario_game_state
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public mario state update" on mario_game_state
    for update using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

-- Realtime: the board subscribes to all three tables, filtered by game code,
-- so every seat sees a card played the moment it lands.
--
-- REPLICA IDENTITY FULL matters for DELETE: without it Postgres ships only the
-- primary key, so a filtered subscription (game_code=eq.X) never matches a
-- delete and a player who left stays on everyone else's screen.
alter table mario_games replica identity full;
alter table mario_game_players replica identity full;
alter table mario_game_state replica identity full;

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['mario_games', 'mario_game_players', 'mario_game_state'] loop
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
