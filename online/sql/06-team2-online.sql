-- Les Dés d’Hackénia v264 — 2 contre 2 en ligne.
-- À exécuter une fois dans le SQL Editor du projet Supabase du jeu de dés (après 05-open-tables.sql).
--
-- Principe : le serveur reste un simple relais d’événements. Une partie 2v2 a 4 sièges (0 à 3) :
--   équipe A = sièges 0 et 2, équipe B = sièges 1 et 3 ; l’ordre des tours est 0 → 1 → 2 → 3.
-- Les sièges sans humain sont des IA (games.ai_seats, decks dans games.ai_decks). L’hôte (le plus petit siège humain)
-- joue pour elles : play_action accepte p_as_seat pour lui seul, et seulement sur un siège IA.
-- Les parties 1v1 existantes et les fonctions create_game / join_game / open_tables restent compatibles.
BEGIN;

-- 1. Colonnes ----------------------------------------------------------------------------------------------
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT '1v1';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS ai_seats smallint[] NOT NULL DEFAULT '{}';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS ai_decks jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_mode_check;
ALTER TABLE public.games ADD CONSTRAINT games_mode_check CHECK (mode IN ('1v1','2v2'));

-- 2. Contraintes : 4 sièges au lieu de 2 (winner reste 0/1 : en 2v2 c’est l’équipe gagnante) ----------------
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_turn_seat_check;
ALTER TABLE public.games ADD CONSTRAINT games_turn_seat_check CHECK (turn_seat BETWEEN 0 AND 3);
ALTER TABLE public.game_players DROP CONSTRAINT IF EXISTS game_players_seat_check;
ALTER TABLE public.game_players ADD CONSTRAINT game_players_seat_check CHECK (seat BETWEEN 0 AND 3);

-- 3. Créer une table 2v2 -------------------------------------------------------------------------------------
-- p_ai_seats : sièges confiés à l’IA (0 à 2 parmi 1, 2, 3). Exemples :
--   {1,3}  = toi + un ami (sièges 0 et 2) contre deux IA   |   {2,3} = toi + IA contre un joueur + IA
-- p_ai_decks : {"1":[10 dés],"3":[10 dés]} composés par l’hôte, partagés avec tous les joueurs.
CREATE OR REPLACE FUNCTION public.create_team_game(p_name text, p_deck jsonb, p_terrain text,
  p_ai_seats smallint[] DEFAULT '{}', p_ai_decks jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(game_id uuid, game_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
DECLARE v_id uuid; v_code text; s smallint; v_ai smallint[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'non connecté'; END IF;
  v_ai := COALESCE(ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_ai_seats, '{}')) x ORDER BY x), '{}');
  IF cardinality(v_ai) > 2 THEN RAISE EXCEPTION 'au plus deux IA'; END IF;
  FOREACH s IN ARRAY v_ai LOOP
    IF s NOT IN (1,2,3) THEN RAISE EXCEPTION 'siège IA invalide'; END IF;
    IF COALESCE(jsonb_typeof(p_ai_decks -> s::text), 'null') <> 'array' OR jsonb_array_length(p_ai_decks -> s::text) <> 10
      THEN RAISE EXCEPTION 'deck IA manquant pour le siège %', s; END IF;
  END LOOP;
  v_code := public.gen_code();
  INSERT INTO public.games (code, terrain, mode, ai_seats, ai_decks)
    VALUES (v_code, p_terrain, '2v2', v_ai, COALESCE(p_ai_decks, '{}'::jsonb)) RETURNING games.id INTO v_id;
  INSERT INTO public.game_players (game_id, seat, user_id, name, deck, ready)
    VALUES (v_id, 0, auth.uid(), left(coalesce(nullif(trim(p_name), ''), 'Joueur 1'), 24), p_deck, true);
  RETURN QUERY SELECT v_id, v_code;
END $fn$;

-- 4. Rejoindre une table 2v2 : premier siège humain libre ; la partie démarre quand tout est occupé ----------
CREATE OR REPLACE FUNCTION public.join_team_game(p_code text, p_name text, p_deck jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
DECLARE v_game public.games%rowtype; v_seat smallint; v_taken integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'non connecté'; END IF;
  SELECT * INTO v_game FROM public.games g WHERE g.code = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'code inconnu'; END IF;
  IF v_game.mode <> '2v2' THEN RAISE EXCEPTION 'ce code est une partie 1 contre 1'; END IF;
  IF EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.game_id = v_game.id AND gp.user_id = auth.uid()) THEN
    RETURN v_game.id;
  END IF;
  IF v_game.status <> 'waiting' THEN RAISE EXCEPTION 'partie déjà commencée'; END IF;
  SELECT s INTO v_seat FROM generate_series(0,3) s
    WHERE s <> ALL (v_game.ai_seats)
      AND NOT EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.game_id = v_game.id AND gp.seat = s)
    ORDER BY s LIMIT 1;
  IF v_seat IS NULL THEN RAISE EXCEPTION 'table complète'; END IF;
  INSERT INTO public.game_players (game_id, seat, user_id, name, deck, ready)
    VALUES (v_game.id, v_seat, auth.uid(), left(coalesce(nullif(trim(p_name), ''), 'Joueur ' || (v_seat + 1)), 24), p_deck, true);
  SELECT count(*) INTO v_taken FROM public.game_players WHERE game_id = v_game.id;
  IF v_taken + cardinality(v_game.ai_seats) >= 4 THEN
    UPDATE public.games SET status = 'playing', is_public = false, updated_at = now() WHERE id = v_game.id;
  END IF;
  RETURN v_game.id;
END $fn$;

-- 5. join_game (1v1) : un code de table 2v2 est redirigé vers join_team_game ------------------------------------
CREATE OR REPLACE FUNCTION public.join_game(p_code text, p_name text, p_deck jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  v_game public.games%rowtype;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into v_game from public.games g where g.code = upper(trim(p_code)) for update;
  if not found then raise exception 'code inconnu'; end if;
  if v_game.mode = '2v2' then return public.join_team_game(p_code, p_name, p_deck); end if;
  if exists (select 1 from public.game_players gp where gp.game_id = v_game.id and gp.user_id = auth.uid()) then
    return v_game.id;
  end if;
  if v_game.status <> 'waiting' then raise exception 'partie déjà commencée'; end if;
  insert into public.game_players (game_id, seat, user_id, name, deck, ready)
  values (v_game.id, 1, auth.uid(), left(coalesce(nullif(trim(p_name), ''), 'Joueur 2'), 24), p_deck, true);
  update public.games set status = 'playing', updated_at = now() where id = v_game.id;
  return v_game.id;
end $function$;

-- 6. play_action : 4 sièges, équipes, et IA pilotées par l’hôte (p_as_seat) ---------------------------------------
DROP FUNCTION IF EXISTS public.play_action(uuid, text, jsonb, integer);
CREATE OR REPLACE FUNCTION public.play_action(p_game uuid, p_kind text, p_payload jsonb,
  p_expected_seq integer DEFAULT NULL::integer, p_as_seat smallint DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  v_seat smallint;      -- siège du joueur connecté
  v_actor smallint;     -- siège qui agit (lui-même, ou un siège IA qu’il pilote)
  v_game public.games%rowtype;
  v_seq  int;
  v_n    smallint;
begin
  select gp.seat into v_seat from public.game_players gp
   where gp.game_id = p_game and gp.user_id = auth.uid();
  if v_seat is null then raise exception 'tu ne fais pas partie de cette partie'; end if;

  select * into v_game from public.games g where g.id = p_game for update;
  if v_game.status <> 'playing' then raise exception 'partie non active'; end if;
  if p_kind not in ('hello','roll','place','move','skip','resign','win') then raise exception 'action inconnue'; end if;

  v_actor := v_seat;
  if p_as_seat is not null and p_as_seat <> v_seat then
    if v_game.mode <> '2v2' or p_as_seat <> all (v_game.ai_seats)
       or v_seat <> (select min(gp.seat) from public.game_players gp where gp.game_id = p_game) then
      raise exception 'siège IA non autorisé';
    end if;
    v_actor := p_as_seat;
  end if;
  v_n := case when v_game.mode = '2v2' then 4 else 2 end;

  if p_kind in ('roll','place','move','skip') and v_game.turn_seat <> v_actor then
    raise exception 'ce n''est pas ton tour';
  end if;
  if p_expected_seq is not null and p_expected_seq <> v_game.last_seq then
    raise exception 'désynchronisé (dernier événement : %)', v_game.last_seq;
  end if;

  v_seq := v_game.last_seq + 1;
  insert into public.game_events (game_id, seq, seat, kind, payload)
  values (p_game, v_seq, v_actor, p_kind, coalesce(p_payload, '{}'::jsonb));

  update public.games g set
    last_seq   = v_seq,
    updated_at = now(),
    turn_seat  = case when p_kind in ('place','skip') then ((g.turn_seat + 1) % v_n)::smallint else g.turn_seat end,
    status     = case when p_kind in ('resign','win') then 'finished' else g.status end,
    -- 1v1 : winner = siège ; 2v2 : winner = équipe (0 = sièges 0 et 2, 1 = sièges 1 et 3)
    winner     = case when p_kind = 'resign' then (1 - (case when g.mode = '2v2' then v_actor % 2 else v_actor end))::smallint
                      when p_kind = 'win'    then (case when g.mode = '2v2' then v_actor % 2 else v_actor end)::smallint
                      else g.winner end
  where g.id = p_game;
  return v_seq;
end $function$;
REVOKE ALL ON FUNCTION public.play_action(uuid, text, jsonb, integer, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.play_action(uuid, text, jsonb, integer, smallint) TO authenticated;

-- 6b. roll_dice : même contrôle de tour que play_action (le lancer est enregistré comme un événement « roll »),
--     et l'hôte peut lancer pour un siège IA qu'il pilote (p_as_seat).
DROP FUNCTION IF EXISTS public.roll_dice(uuid, integer);
CREATE OR REPLACE FUNCTION public.roll_dice(p_game uuid, p_n integer, p_as_seat smallint DEFAULT NULL)
RETURNS integer[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  v_vals int[] := '{}';
  i      int;
  v_seq  int;
begin
  if p_n < 1 or p_n > 4 then raise exception 'nombre de dés invalide'; end if;
  for i in 1..p_n loop
    v_vals := v_vals || (1 + floor(random() * 6))::int;
  end loop;
  v_seq := public.play_action(p_game, 'roll', jsonb_build_object('values', to_jsonb(v_vals)), null, p_as_seat);
  return v_vals;
end $function$;
REVOKE ALL ON FUNCTION public.roll_dice(uuid, integer, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_dice(uuid, integer, smallint) TO authenticated;

-- 7. Tables ouvertes : le 1v1 ne montre plus les tables 2v2, et une liste dédiée pour le 2v2 -------------------
CREATE OR REPLACE FUNCTION public.open_tables()
RETURNS TABLE(game_code text, host_name text, terrain text, opened_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
  SELECT g.code::text, COALESCE(NULLIF(p.name, ''), 'Joueur')::text, g.terrain::text, g.opened_at
  FROM public.games g
  JOIN public.game_players p ON p.game_id = g.id AND p.seat = 0
  WHERE auth.uid() IS NOT NULL AND g.is_public AND g.status = 'waiting' AND g.mode = '1v1'
    AND g.opened_at > now() - interval '2 minutes' AND p.user_id <> auth.uid()
  ORDER BY g.opened_at DESC LIMIT 20
$fn$;

CREATE OR REPLACE FUNCTION public.open_team_tables()
RETURNS TABLE(game_code text, host_name text, terrain text, opened_at timestamptz, humans integer, humans_needed integer, ai_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
  SELECT g.code::text, COALESCE(NULLIF(p.name, ''), 'Joueur')::text, g.terrain::text, g.opened_at,
         (SELECT count(*)::int FROM public.game_players x WHERE x.game_id = g.id),
         4 - cardinality(g.ai_seats), cardinality(g.ai_seats)
  FROM public.games g
  JOIN public.game_players p ON p.game_id = g.id AND p.seat = 0
  WHERE auth.uid() IS NOT NULL AND g.is_public AND g.status = 'waiting' AND g.mode = '2v2'
    AND g.opened_at > now() - interval '2 minutes' AND p.user_id <> auth.uid()
  ORDER BY g.opened_at DESC LIMIT 20
$fn$;

-- 8. Droits -------------------------------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_team_game(text, jsonb, text, smallint[], jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_team_game(text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.open_team_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_team_game(text, jsonb, text, smallint[], jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_team_game(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_team_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_game(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_tables() TO authenticated;
COMMIT;
