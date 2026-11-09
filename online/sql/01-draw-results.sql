-- Les Dés d’Hackénia v182 — enregistrer un match nul en PVP.
-- Exécuter une fois dans le SQL Editor du projet Supabase du jeu de dés.
-- Cette migration ajoute un RPC ; les fonctions de jeu et les anciennes parties sont conservées.
BEGIN;
DO $migration$
DECLARE game_id_type text;
BEGIN
  SELECT pg_catalog.format_type(atttypid, atttypmod) INTO game_id_type
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.games'::regclass AND attname = 'id' AND NOT attisdropped;
  IF game_id_type IS NULL THEN RAISE EXCEPTION 'Table public.games ou colonne id introuvable'; END IF;
  EXECUTE format($ddl$
    CREATE OR REPLACE FUNCTION public.finish_draw(p_game %s)
    RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
    AS $fn$
    DECLARE actor integer; next_seq bigint; current_status text;
    BEGIN
      IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
      SELECT seat INTO actor FROM public.game_players
        WHERE game_id = p_game AND user_id = auth.uid();
      IF actor IS NULL THEN RAISE EXCEPTION 'Vous ne participez pas à cette partie'; END IF;
      SELECT status::text, last_seq INTO current_status, next_seq
        FROM public.games WHERE id = p_game FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Partie introuvable'; END IF;
      IF current_status = 'finished' THEN RETURN next_seq; END IF;
      IF current_status <> 'playing' THEN RAISE EXCEPTION 'Partie non active'; END IF;
      next_seq := COALESCE(next_seq, 0) + 1;
      -- "hello" est déjà autorisé par le protocole ; le résultat reste explicite dans son payload.
      INSERT INTO public.game_events(game_id, seq, seat, kind, payload)
        VALUES (p_game, next_seq, actor, 'hello', '{"result":"draw","version":"182"}'::jsonb);
      UPDATE public.games SET status = 'finished', winner = NULL, last_seq = next_seq
        WHERE id = p_game;
      RETURN next_seq;
    END;
    $fn$;
  $ddl$, game_id_type);
  EXECUTE format('REVOKE ALL ON FUNCTION public.finish_draw(%s) FROM PUBLIC', game_id_type);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.finish_draw(%s) TO authenticated', game_id_type);
END;
$migration$;
NOTIFY pgrst, 'reload schema';
COMMIT;
