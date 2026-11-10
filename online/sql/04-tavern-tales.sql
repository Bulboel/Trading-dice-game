-- Hackénia v229 — « Les Contes de la Taverne » : concours de scènes de jeu de rôle.
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
-- Prérequis : 03-dice-submissions.sql (table des administrateurs et fonction is_hackenia_admin).
--
-- Principe :
--  * l'administrateur ouvre un concours (sujet, date limite) avant chaque partie de jeu de rôle ;
--  * chaque joueur envoie une scène par concours ; il ne voit que la sienne ;
--  * l'administrateur sélectionne les meilleures : elles deviennent lisibles par tous et le public vote (un vote par joueur) ;
--  * l'administrateur désigne le gagnant et ajoute le lien de l'épisode du podcast.

-- 1. Concours
create table if not exists public.tale_contests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 3 and 80),
  theme       text not null default '' check (char_length(theme) <= 600),
  deadline    timestamptz not null,
  status      text not null default 'open' check (status in ('open','voting','closed')),
  podcast_url text not null default '' check (podcast_url = '' or podcast_url ~ '^https://')
);
alter table public.tale_contests enable row level security;
drop policy if exists "Lire les concours" on public.tale_contests;
drop policy if exists "Admin : gérer les concours" on public.tale_contests;
create policy "Lire les concours" on public.tale_contests for select to authenticated using (true);
create policy "Admin : gérer les concours" on public.tale_contests for all to authenticated using (public.is_hackenia_admin()) with check (public.is_hackenia_admin());

-- 2. Participations (une par joueur et par concours)
create table if not exists public.tale_entries (
  id          uuid primary key default gen_random_uuid(),
  contest_id  uuid not null references public.tale_contests (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  author      text not null check (char_length(author) between 1 and 24),
  title       text not null check (char_length(title) between 3 and 80),
  situation   text not null check (char_length(situation) between 40 and 1500),
  npc         text not null default '' check (char_length(npc) <= 800),
  choices     jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 4),
  twist       text not null default '' check (char_length(twist) <= 800),
  rights_ok   boolean not null check (rights_ok),
  status      text not null default 'sent' check (status in ('sent','selected','winner','rejected')),
  review_note text not null default '' check (char_length(review_note) <= 400),
  unique (contest_id, user_id)
);
alter table public.tale_entries enable row level security;
drop policy if exists "Participer" on public.tale_entries;
drop policy if exists "Voir sa participation" on public.tale_entries;
drop policy if exists "Lire les scènes sélectionnées" on public.tale_entries;
drop policy if exists "Admin : tout voir et valider" on public.tale_entries;
create policy "Participer" on public.tale_entries for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'sent' and review_note = ''
              and exists (select 1 from public.tale_contests c where c.id = contest_id and c.status = 'open' and c.deadline > now()));
create policy "Voir sa participation" on public.tale_entries for select to authenticated using (user_id = (select auth.uid()));
create policy "Lire les scènes sélectionnées" on public.tale_entries for select to authenticated using (status in ('selected','winner'));
create policy "Admin : tout voir et valider" on public.tale_entries for all to authenticated using (public.is_hackenia_admin()) with check (public.is_hackenia_admin());

-- 3. Votes du public (un par joueur et par concours, pendant la phase de vote, pour une scène sélectionnée)
create table if not exists public.tale_votes (
  contest_id uuid not null references public.tale_contests (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id   uuid not null references public.tale_entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);
alter table public.tale_votes enable row level security;
drop policy if exists "Voter" on public.tale_votes;
drop policy if exists "Changer son vote" on public.tale_votes;
drop policy if exists "Voir son vote" on public.tale_votes;
create policy "Voter" on public.tale_votes for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.tale_contests c where c.id = contest_id and c.status = 'voting')
              and exists (select 1 from public.tale_entries e where e.id = entry_id and e.contest_id = contest_id and e.status = 'selected' and e.user_id <> (select auth.uid())));
create policy "Changer son vote" on public.tale_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.tale_contests c where c.id = contest_id and c.status = 'voting')
              and exists (select 1 from public.tale_entries e where e.id = entry_id and e.contest_id = contest_id and e.status = 'selected' and e.user_id <> (select auth.uid())));
create policy "Voir son vote" on public.tale_votes for select to authenticated using (user_id = (select auth.uid()));

-- Nombre de votes : visible par l'administrateur, et par tous une fois le concours terminé.
create or replace function public.tale_vote_counts(p_contest uuid) returns table (entry_id uuid, votes bigint)
language sql stable security definer set search_path = '' as $$
  select v.entry_id, count(*) from public.tale_votes v
  where v.contest_id = p_contest
    and (public.is_hackenia_admin() or exists (select 1 from public.tale_contests c where c.id = p_contest and c.status = 'closed'))
  group by v.entry_id
$$;

grant usage on schema public to authenticated;
grant select on public.tale_contests to authenticated;
grant insert, update, delete on public.tale_contests to authenticated;
grant select, insert on public.tale_entries to authenticated;
grant update (status, review_note) on public.tale_entries to authenticated;
grant select, insert, update on public.tale_votes to authenticated;
grant execute on function public.tale_vote_counts(uuid) to authenticated;
notify pgrst, 'reload schema';
