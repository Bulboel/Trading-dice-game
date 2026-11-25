-- Hackénia v449 — Bubulles offertes par l'administrateur (100 à la fois, autant de fois que voulu).
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
-- Prérequis : 03-dice-submissions.sql (is_hackenia_admin) et 07-premium.sql.
--
-- Principe : l'administrateur ajoute un cadeau dans gold_gifts (admin_give_gold). Le jeu du joueur le réclame avec
-- claim_gold_gifts() : chaque cadeau est marqué « reçu » côté serveur au moment où il est versé, il ne peut donc être
-- touché qu'une seule fois par compte, même avec plusieurs sauvegardes ou plusieurs téléphones.

create table if not exists public.gold_gifts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     integer not null check (amount between 1 and 100000),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists gold_gifts_pending on public.gold_gifts (user_id) where claimed_at is null;
alter table public.gold_gifts enable row level security;
-- Aucune policy : la table n'est lisible et modifiable qu'à travers les fonctions ci-dessous.

create or replace function public.admin_give_gold(p_user uuid, p_amount integer default 100) returns integer
language plpgsql security definer set search_path = '' as $$
declare pending integer;
begin
  if not public.is_hackenia_admin() then raise exception 'Réservé à l''administrateur'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000 then raise exception 'Montant invalide'; end if;
  insert into public.gold_gifts (user_id, amount) values (p_user, p_amount);
  select coalesce(sum(amount), 0) into pending from public.gold_gifts where user_id = p_user and claimed_at is null;
  return pending; -- Bubulles en attente pour ce joueur (pas encore reçues)
end $$;

create or replace function public.claim_gold_gifts() returns integer
language plpgsql security definer set search_path = '' as $$
declare total integer;
begin
  if auth.uid() is null then return 0; end if;
  with c as (
    update public.gold_gifts set claimed_at = now()
    where user_id = auth.uid() and claimed_at is null
    returning amount
  ) select coalesce(sum(amount), 0) into total from c;
  return total;
end $$;

revoke all on function public.admin_give_gold(uuid, integer) from public, anon;
revoke all on function public.claim_gold_gifts() from public, anon;
grant execute on function public.admin_give_gold(uuid, integer) to authenticated;
grant execute on function public.claim_gold_gifts() to authenticated;
