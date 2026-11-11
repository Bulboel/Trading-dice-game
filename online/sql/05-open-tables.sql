-- Les Dés d’Hackénia v247 — Tables ouvertes en PVP : un joueur ouvre une table, n’importe qui peut la rejoindre sans code.
-- Exécuter une fois dans le SQL Editor du projet Supabase du jeu de dés.
-- Cette migration ajoute deux colonnes et deux fonctions ; create_game / join_game et les parties existantes sont conservées.
BEGIN;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS opened_at timestamptz;
DO $migration$
DECLARE game_id_type text; code_col text; terrain_expr text;
BEGIN
  SELECT pg_catalog.format_type(atttypid, atttypmod) INTO game_id_type
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.games'::regclass AND attname = 'id' AND NOT attisdropped;
  IF game_id_type IS NULL THEN RAISE EXCEPTION 'Table public.games ou colonne id introuvable'; END IF;
  SELECT attname INTO code_col FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.games'::regclass AND attname IN ('code','game_code','join_code') AND NOT attisdropped
    ORDER BY CASE attname WHEN 'code' THEN 0 WHEN 'game_code' THEN 1 ELSE 2 END LIMIT 1;
  IF code_col IS NULL THEN RAISE EXCEPTION 'Colonne du code de partie introuvable dans public.games'; END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid = 'public.games'::regclass AND attname = 'terrain' AND NOT attisdropped)
    THEN terrain_expr := 'g.terrain::text'; ELSE terrain_expr := 'NULL::text'; END IF;

  -- L’hôte (siège 0) ouvre ou ferme sa table tant qu’elle attend un adversaire. Chaque appel « ouvrir » rafraîchit opened_at.
  EXECUTE format($ddl$
    CREATE OR REPLACE FUNCTION public.set_table_public(p_game %s, p_public boolean)
    RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
    AS $fn$
    BEGIN
      IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
      IF NOT EXISTS (SELECT 1 FROM public.game_players WHERE game_id = p_game AND user_id = auth.uid() AND seat = 0)
        THEN RAISE EXCEPTION 'Seul le créateur de la partie peut ouvrir sa table'; END IF;
      UPDATE public.games SET is_public = p_public, opened_at = CASE WHEN p_public THEN now() ELSE opened_at END
        WHERE id = p_game AND status::text = 'waiting';
      RETURN FOUND;
    END;
    $fn$;
  $ddl$, game_id_type);
  EXECUTE format('REVOKE ALL ON FUNCTION public.set_table_public(%s, boolean) FROM PUBLIC', game_id_type);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.set_table_public(%s, boolean) TO authenticated', game_id_type);

  -- Liste des tables ouvertes : en attente, signalées depuis moins de 2 minutes, hors la sienne. 20 au plus.
  EXECUTE format($ddl$
    CREATE OR REPLACE FUNCTION public.open_tables()
    RETURNS TABLE(game_code text, host_name text, terrain text, opened_at timestamptz)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $fn$
      SELECT g.%I::text, COALESCE(NULLIF(p.name, ''), 'Joueur')::text, %s, g.opened_at
      FROM public.games g
      JOIN public.game_players p ON p.game_id = g.id AND p.seat = 0
      WHERE auth.uid() IS NOT NULL AND g.is_public AND g.status::text = 'waiting'
        AND g.opened_at > now() - interval '2 minutes' AND p.user_id <> auth.uid()
      ORDER BY g.opened_at DESC LIMIT 20
    $fn$;
  $ddl$, code_col, terrain_expr);
  REVOKE ALL ON FUNCTION public.open_tables() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.open_tables() TO authenticated;
END;
$migration$;
COMMIT;
