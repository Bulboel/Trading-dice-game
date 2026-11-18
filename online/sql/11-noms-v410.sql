-- Hackénia v410 — nouveaux noms de deux divinités dans le catalogue des dés (échanges en ligne).
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller ce fichier › Run.
update public.dice_catalog set name = 'Lumérion' where id = 33;
update public.dice_catalog set name = 'Floréa' where id = 113;
update public.dice_catalog set name = 'Lumérion Crépitant' where id = 145;
update public.dice_catalog set name = 'Floréa Crépitant' where id = 171;
update public.dice_catalog set name = 'Lumérion Crépitant émeraude' where id = 197;
update public.dice_catalog set name = 'Floréa Crépitant émeraude' where id = 223;
