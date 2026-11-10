-- Hackénia v204 — Sauvegarde en ligne et code de récupération.
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
-- Prérequis (déjà en place pour le PVP) : Authentication › Sign In / Providers › « Allow anonymous sign-ins » activé.
--
-- Principe : chaque joueur a un compte anonyme (aucun email, aucun mot de passe).
-- Sa progression est copiée dans player_saves ; lui seul peut la lire et l'écrire (RLS).
-- Le code de récupération (ex. HACK-7F3K-92QD) n'est jamais stocké en clair : seule son empreinte SHA-256 est gardée.

create extension if not exists pgcrypto with schema extensions;

-- 1. Sauvegardes
create table if not exists public.player_saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  summary    jsonb not null default '{}'::jsonb,
  rev        bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint player_saves_size check (octet_length(data::text) < 400000)
);
alter table public.player_saves enable row level security;

drop policy if exists "Lire sa sauvegarde" on public.player_saves;
drop policy if exists "Créer sa sauvegarde" on public.player_saves;
drop policy if exists "Modifier sa sauvegarde" on public.player_saves;
create policy "Lire sa sauvegarde" on public.player_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "Créer sa sauvegarde" on public.player_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Modifier sa sauvegarde" on public.player_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2. Codes de récupération (accessibles uniquement par les fonctions ci-dessous)
create table if not exists public.recovery_codes (
  code_hash  text primary key,
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.recovery_codes enable row level security;

create table if not exists public.recovery_attempts (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index if not exists recovery_attempts_user_at on public.recovery_attempts (user_id, at);
alter table public.recovery_attempts enable row level security;

-- Normalise « hack-7f3k 92qd » en « 7F3K92QD… » puis calcule l'empreinte.
create or replace function public.recovery_hash(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(regexp_replace(regexp_replace(upper(coalesce(p_code, '')), '^HACK', ''), '[^A-Z0-9]', '', 'g'), 'sha256'), 'hex')
$$;

-- Crée (ou remplace) le code du joueur connecté. 12 caractères aléatoires (60 bits), alphabet sans 0/O/1/I.
create or replace function public.create_recovery_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(12);
  raw text := '';
  i int;
begin
  if uid is null then raise exception 'Non connecté'; end if;
  if not exists (select 1 from public.player_saves where user_id = uid) then raise exception 'Aucune sauvegarde en ligne pour ce joueur'; end if;
  for i in 0..11 loop raw := raw || substr(alphabet, 1 + (get_byte(bytes, i) % 32), 1); end loop;
  delete from public.recovery_codes where user_id = uid;
  insert into public.recovery_codes (code_hash, user_id) values (public.recovery_hash(raw), uid);
  return 'HACK-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4);
end $$;

-- 10 essais par heure et par joueur, pour empêcher de deviner un code.
create or replace function public.recovery_throttle() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Non connecté'; end if;
  if (select count(*) from public.recovery_attempts where user_id = uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'Trop de tentatives : réessayez dans une heure';
  end if;
  insert into public.recovery_attempts (user_id) values (uid);
  delete from public.recovery_attempts where at < now() - interval '1 day';
end $$;

-- Aperçu d'une sauvegarde à partir d'un code (Bubulles, nombre de dés…), sans rien modifier.
create or replace function public.peek_recovery_code(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare owner uuid; s public.player_saves;
begin
  perform public.recovery_throttle();
  select user_id into owner from public.recovery_codes where code_hash = public.recovery_hash(p_code);
  if owner is null then return null; end if;
  select * into s from public.player_saves where user_id = owner;
  if not found then return null; end if;
  return jsonb_build_object('summary', s.summary, 'updated_at', s.updated_at, 'same', owner = auth.uid());
end $$;

-- Récupère la sauvegarde liée au code sur le compte de cet appareil. Le code suit la progression :
-- il fonctionne ensuite pour ce nouvel appareil (l'ancien appareil garde une copie indépendante).
create or replace function public.claim_recovery_code(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); owner uuid; s public.player_saves; h text := public.recovery_hash(p_code);
begin
  perform public.recovery_throttle();
  select user_id into owner from public.recovery_codes where code_hash = h;
  if owner is null then return null; end if;
  select * into s from public.player_saves where user_id = owner;
  if not found then return null; end if;
  if owner <> uid then
    insert into public.player_saves (user_id, data, summary, rev, updated_at)
      values (uid, s.data, s.summary, s.rev + 1, now())
      on conflict (user_id) do update set data = excluded.data, summary = excluded.summary, rev = public.player_saves.rev + 1, updated_at = now();
    delete from public.recovery_codes where user_id = uid;
    update public.recovery_codes set user_id = uid where code_hash = h;
  end if;
  return jsonb_build_object('data', s.data, 'summary', s.summary);
end $$;

revoke all on function public.create_recovery_code(), public.recovery_throttle(), public.peek_recovery_code(text), public.claim_recovery_code(text) from public, anon;
grant execute on function public.create_recovery_code(), public.peek_recovery_code(text), public.claim_recovery_code(text) to authenticated;
revoke all on function public.recovery_throttle() from authenticated;

-- Droits d'accès à la table (les projets Supabase récents ne les donnent plus automatiquement aux nouvelles tables).
-- Les règles RLS ci-dessus limitent toujours chaque joueur à sa propre sauvegarde.
grant usage on schema public to authenticated;
grant select, insert, update on public.player_saves to authenticated;

-- Fait connaître immédiatement les nouvelles tables et fonctions à l'API (sinon « Could not find the table … in the schema cache »).
notify pgrst, 'reload schema';
