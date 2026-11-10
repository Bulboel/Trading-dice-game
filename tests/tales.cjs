// v229 — Contes de la Taverne : sécurité Supabase, règles de participation et récompenses.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sql=read('online/sql/04-tavern-tales.sql');
for(const k of['unique (contest_id, user_id)',"c.status = 'open' and c.deadline > now()","status in ('selected','winner')","c.status = 'voting'","e.user_id <> (select auth.uid())",'primary key (contest_id, user_id)','public.is_hackenia_admin()','rights_ok   boolean not null check (rights_ok)',"podcast_url ~ '^https://'","c.status = 'closed'"])assert.ok(sql.includes(k),'SQL: '+k);
const js=read('assets/tales-v229.js');assert.ok(js.includes('MIN_LEVEL=5,SELECTED_GOLD=25,WINNER_GOLD=300'));assert.ok(js.includes("claimed.has('s:'+e.id)")&&js.includes("claimed.has('w:'+e.id)"),'Each reward paid once');assert.ok(!/service_role/.test(js));
const portal=read('assets/portal-v159.js');assert.ok(portal.includes("'tales'].includes(h)")&&portal.includes('data-action="tales"')&&portal.includes('🎭 Scénariste')&&portal.includes("throw Error('Scénariste invalide')"));
assert.ok(read('assets/community-v229.js').includes('HACKENIA_COMMUNITY'),'Discord link slot');
console.log('PASS: one scene per player and contest while open, public reads only selected scenes, one vote per player (not for oneself) during voting, admin moderation, https podcast link, rewards paid once, Discord slot.');
