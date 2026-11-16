-- Hackénia v315 — Pack Sage : attribution par l'administrateur et lecture par le joueur.
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
-- Prérequis : 02-cloud-save.sql (player_saves) et 03-dice-submissions.sql (is_hackenia_admin).
--
-- Principe : un joueur ne peut jamais s'attribuer le pack lui-même. Seul l'administrateur écrit dans premium_grants
-- (via admin_set_premium) ; le jeu lit son propre droit avec my_premium() et active le pack sur la sauvegarde locale.
-- Plus tard, la validation d'un achat réel (Google Play) écrira la même table avec source = 'purchase' côté serveur.

create table if not exists public.premium_grants (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  sage       boolean not null default true,
  source     text not null default 'admin',
  granted_at timestamptz not null default now()
);
alter table public.premium_grants enable row level security;
drop policy if exists "Lire son pack" on public.premium_grants;
create policy "Lire son pack" on public.premium_grants for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.my_premium() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('sage', g.sage, 'source', g.source) from public.premium_grants g where g.user_id = auth.uid()), '{}'::jsonb)
$$;

create or replace function public.admin_list_players() returns table (user_id uuid, summary jsonb, updated_at timestamptz, sage boolean, source text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_hackenia_admin() then raise exception 'Réservé à l''administrateur'; end if;
  return query select s.user_id, s.summary, s.updated_at, coalesce(g.sage, false), g.source
    from public.player_saves s left join public.premium_grants g on g.user_id = s.user_id
    order by s.updated_at desc limit 500;
end $$;

create or replace function public.admin_set_premium(p_user uuid, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_hackenia_admin() then raise exception 'Réservé à l''administrateur'; end if;
  if p_on then
    insert into public.premium_grants (user_id, sage, source) values (p_user, true, 'admin')
    on conflict (user_id) do update set sage = true, source = 'admin', granted_at = now();
  else
    delete from public.premium_grants where user_id = p_user;
  end if;
end $$;

revoke all on function public.admin_list_players() from public, anon;
revoke all on function public.admin_set_premium(uuid, boolean) from public, anon;
grant execute on function public.my_premium() to authenticated;
grant execute on function public.admin_list_players() to authenticated;
grant execute on function public.admin_set_premium(uuid, boolean) to authenticated;
