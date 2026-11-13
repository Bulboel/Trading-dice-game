// Génère le SQL qui met à jour le catalogue des dés sur Supabase.
// Usage (à la racine du dépôt) :  node scripts/export-catalog-sql.cjs > maj-catalogue.sql
// Puis colle le contenu de maj-catalogue.sql dans Supabase > SQL Editor > Run.
// À refaire à chaque fois que des dés sont ajoutés, retirés ou changent de rareté.
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const src=html.match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/<\/?script>/g,'')).sort((a,b)=>b.length-a.length)[0].replace(/init\(\);\s*$/,'');
const P=()=>new Proxy(function(){},{get:(t,p)=>p==='children'?[]:p==='length'?0:p===Symbol.toPrimitive?()=>0:P(),set:()=>true,apply:()=>P()});
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById:()=>P()},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},console,Date,Math});
vm.runInContext(src,c);
const rows=vm.runInContext('M.map((d,i)=>[i,d.cn||d.n,rarityOf(d)])',c);
const q=s=>String(s).replace(/'/g,"''");
console.log('-- Catalogue des dés : '+rows.length+' dés dans le jeu ('+new Date().toISOString().slice(0,10)+')');
console.log("-- La rareté 7 (Énergie) doit être acceptée par la table : on remplace la contrainte (sans effet si elle l'accepte déjà).");
console.log("alter table public.dice_catalog drop constraint if exists dice_catalog_rarity_check;");
console.log("alter table public.dice_catalog add constraint dice_catalog_rarity_check check (rarity in (1,2,3,5,6,7));");
console.log('insert into public.dice_catalog (id, name, rarity, active) values');
console.log(rows.map(([i,n,r])=>`  (${i}, '${q(n)}', ${r}, true)`).join(',\n'));
console.log('on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, active = true;');
console.log('-- Dés qui ne sont plus dans le jeu : conservés dans le catalogue mais retirés des échanges');
console.log(`update public.dice_catalog set active = false where id not in (${rows.map(r=>r[0]).join(', ')});`);
