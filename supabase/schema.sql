-- Gwent Tracker — Supabase schema (auth foundation)
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
--
-- Before running: in Project Settings -> Authentication -> Providers -> Email,
-- turn OFF "Confirm email" so signUp() returns a live session immediately
-- (per product decision: no email confirmation step).

create extension if not exists "pgcrypto";

-- One row per authenticated user, auto-created on signup.
-- This is also the "directory of all registered users" used later to
-- invite someone into a game session.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;

-- Any logged-in user can browse the directory (needed to invite someone).
create policy "authenticated users can read all profiles" on profiles
  for select using (auth.role() = 'authenticated');

-- Users can only edit their own profile.
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- A finished match between two players, recorded once on "Завершити гру".
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null references profiles (id) on delete cascade,
  player2_id uuid not null references profiles (id) on delete cascade,
  player1_faction text not null,
  player2_faction text not null,
  player1_rounds_won int not null default 0,
  player2_rounds_won int not null default 0,
  winner_id uuid references profiles (id) on delete set null,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint different_players check (player1_id <> player2_id)
);

-- Per-round point totals within a game.
create table if not exists game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  round_number int not null,
  player1_points int not null default 0,
  player2_points int not null default 0,
  round_winner_id uuid references profiles (id) on delete set null,
  unique (game_id, round_number)
);

create index if not exists games_player1_idx on games (player1_id);
create index if not exists games_player2_idx on games (player2_id);
create index if not exists game_rounds_game_idx on game_rounds (game_id);

alter table games enable row level security;
alter table game_rounds enable row level security;

-- Any logged-in user can read all games (needed for a "global history" view
-- later); only the two participants can record a game they played.
create policy "authenticated users can read all games" on games
  for select using (auth.role() = 'authenticated');

create policy "participants can insert their own game" on games
  for insert with check (auth.uid() = player1_id or auth.uid() = player2_id);

create policy "authenticated users can read all game_rounds" on game_rounds
  for select using (auth.role() = 'authenticated');

create policy "participants can insert rounds for their own game" on game_rounds
  for insert with check (
    exists (
      select 1 from games g
      where g.id = game_id
        and (g.player1_id = auth.uid() or g.player2_id = auth.uid())
    )
  );

-- Invite handshake for starting a live game session between two devices.
-- Realtime (postgres_changes) is used so the invitee sees the invite pop up
-- immediately, and the inviter sees the moment it's accepted.
create table if not exists game_invites (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles (id) on delete cascade,
  to_user_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'playing', 'finished', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  -- Live session state once accepted: each side picks a faction, then plays
  -- out rounds together in real time until "Завершити гру".
  from_faction text,
  to_faction text,
  current_round int not null default 1,
  from_points int not null default 0,
  to_points int not null default 0,
  rounds jsonb not null default '[]'::jsonb,
  game_started_at timestamptz,
  constraint different_invite_users check (from_user_id <> to_user_id)
);

create index if not exists game_invites_to_user_idx on game_invites (to_user_id);
create index if not exists game_invites_from_user_idx on game_invites (from_user_id);

alter table game_invites enable row level security;

create policy "participants can read their invites" on game_invites
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "users can send invites as themselves" on game_invites
  for insert with check (auth.uid() = from_user_id);

create policy "participants can update their invites" on game_invites
  for update using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "participants can delete their invites" on game_invites
  for delete using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Register the table for Realtime, without erroring if run twice.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_invites'
  ) then
    alter publication supabase_realtime add table game_invites;
  end if;
end $$;
