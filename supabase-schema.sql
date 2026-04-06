-- LootLedger Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.

-- ============================================================
-- PROFILES
-- Extends auth.users with a username and role.
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null,
  role       text not null default 'raider' check (role in ('council', 'raider')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'raider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LOOT ENTRIES
-- Stores every loot award record (imported from RCLootCouncil CSV).
-- ============================================================
create table if not exists public.loot_entries (
  id           uuid primary key default gen_random_uuid(),
  timestamp    timestamptz not null,
  player_name  text not null,
  player_class text,
  item_name    text not null,
  item_id      integer,
  boss         text not null default 'Unknown',
  raid         text not null default 'Unknown',
  response     text not null default '',
  votes        integer not null default 0,
  awarded_by   text not null default '',
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists loot_entries_timestamp_idx  on public.loot_entries (timestamp desc);
create index if not exists loot_entries_player_idx     on public.loot_entries (player_name);
create index if not exists loot_entries_raid_idx       on public.loot_entries (raid);

-- ============================================================
-- PLAYERS
-- Optional roster for tracking guild members independently.
-- ============================================================
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  player_class text,
  rank         text,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- COUNCIL NOTES
-- Pre-raid loot priority notes, visible to council only.
-- ============================================================
create table if not exists public.council_notes (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null,
  item_name   text not null,
  priority    text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- profiles: users see their own row; council sees all
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Council can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

create policy "Council can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

create policy "Allow insert on own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- loot_entries: all authenticated users can read; only council can write
alter table public.loot_entries enable row level security;

create policy "Authenticated users can read loot entries"
  on public.loot_entries for select
  using (auth.role() = 'authenticated');

create policy "Council can insert loot entries"
  on public.loot_entries for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

create policy "Council can update loot entries"
  on public.loot_entries for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

create policy "Council can delete loot entries"
  on public.loot_entries for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

-- players: all authenticated can read; council can write
alter table public.players enable row level security;

create policy "Authenticated users can read players"
  on public.players for select
  using (auth.role() = 'authenticated');

create policy "Council can manage players"
  on public.players for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );

-- council_notes: council only
alter table public.council_notes enable row level security;

create policy "Council can manage council notes"
  on public.council_notes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'council'
    )
  );
