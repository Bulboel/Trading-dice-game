-- Hackénia v228 — Propositions de dés par les joueurs.
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
--
-- Principe :
--  * un joueur (compte anonyme du jeu) peut proposer un dé : nom, description, élément, rareté, schéma,
--    image (obligatoire) et modèle 3D .glb (facultatif) ; une proposition par jour au plus ;
--  * il ne voit que ses propres propositions ; seul l'administrateur (vous) les voit toutes et les valide ;
--  * les fichiers sont rangés dans un espace de stockage privé « dice-submissions » (image 2 Mo, modèle 20 Mo).

-- 1. Administrateurs (votre compte, voir la fin du fichier)
create table if not exists public.hackenia_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.hackenia_admins enable row level security;
create or replace function public.is_hackenia_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.hackenia_admins where user_id = auth.uid())
$$;
drop policy if exists "Admin : se voir" on public.hackenia_admins;
create policy "Admin : se voir" on public.hackenia_admins for select to authenticated using (user_id = (select auth.uid()));

-- 2. Propositions
create table if not exists public.dice_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  author      text not null check (char_length(author) between 1 and 24),
  name        text not null check (char_length(name) between 2 and 40),
  description text not null default '' check (char_length(description) <= 400),
  element     text not null check (element in ('foudre','vent','terre','glace','eau','feu','','multi')),
  rarity      int  not null check (rarity in (1,2,3,5,6)),
  tiles       jsonb not null check (jsonb_typeof(tiles) = 'array' and jsonb_array_length(tiles) between 3 and 6),
  image_path  text not null,
  model_path  text,
  rights_ok   boolean not null check (rights_ok),
  status      text not null default 'pending' check (status in ('pending','accepted','rejected')),
  review_note text not null default '' check (char_length(review_note) <= 400),
  reviewed_at timestamptz
);
create index if not exists dice_submissions_user on public.dice_submissions (user_id, created_at desc);
alter table public.dice_submissions enable row level security;

drop policy if exists "Proposer un dé" on public.dice_submissions;
drop policy if exists "Voir ses propositions" on public.dice_submissions;
drop policy if exists "Admin : tout voir" on public.dice_submissions;
drop policy if exists "Admin : valider" on public.dice_submissions;
create policy "Proposer un dé" on public.dice_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and review_note = '' and reviewed_at is null
              and image_path like (select auth.uid())::text || '/%'
              and (model_path is null or model_path like (select auth.uid())::text || '/%'));
create policy "Voir ses propositions" on public.dice_submissions for select to authenticated using (user_id = (select auth.uid()));
create policy "Admin : tout voir" on public.dice_submissions for select to authenticated using (public.is_hackenia_admin());
create policy "Admin : valider" on public.dice_submissions for update to authenticated using (public.is_hackenia_admin()) with check (public.is_hackenia_admin());

-- Une proposition par jour et par joueur.
create or replace function public.dice_submissions_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.dice_submissions where user_id = new.user_id and created_at > now() - interval '1 day') then
    raise exception 'Une seule proposition par jour : revenez demain !';
  end if;
  return new;
end $$;
drop trigger if exists dice_submissions_limit on public.dice_submissions;
create trigger dice_submissions_limit before insert on public.dice_submissions for each row execute function public.dice_submissions_limit();

grant usage on schema public to authenticated;
grant select, insert on public.dice_submissions to authenticated;
grant update (status, review_note, reviewed_at) on public.dice_submissions to authenticated;
grant select on public.hackenia_admins to authenticated;
grant execute on function public.is_hackenia_admin() to authenticated;

-- 3. Stockage privé des fichiers
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dice-submissions', 'dice-submissions', false, 20971520,
        array['image/png','image/jpeg','image/webp','model/gltf-binary','application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Déposer ses fichiers de dé" on storage.objects;
drop policy if exists "Lire ses fichiers de dé" on storage.objects;
drop policy if exists "Admin : lire les fichiers de dé" on storage.objects;
create policy "Déposer ses fichiers de dé" on storage.objects for insert to authenticated
  with check (bucket_id = 'dice-submissions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Lire ses fichiers de dé" on storage.objects for select to authenticated
  using (bucket_id = 'dice-submissions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Admin : lire les fichiers de dé" on storage.objects for select to authenticated
  using (bucket_id = 'dice-submissions' and public.is_hackenia_admin());

notify pgrst, 'reload schema';

-- 4. VOTRE COMPTE ADMINISTRATEUR (une seule fois)
--   a) Authentication › Users › Add user › Create new user : votre email + un mot de passe solide,
--      cochez « Auto Confirm User ».
--   b) Puis exécutez la ligne ci-dessous en remplaçant l'email :
-- insert into public.hackenia_admins (user_id) select id from auth.users where email = 'VOTRE-EMAIL@exemple.fr' on conflict do nothing;
