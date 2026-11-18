/* v316 — Langues : français (par défaut sur un appareil francophone) et anglais.
   Le jeu est écrit en français ; en anglais, un dictionnaire (assets/i18n-en-v316.js, chargé seulement dans ce cas) traduit
   à la volée tous les textes affichés : nœuds de texte et attributs (title, aria-label, placeholder, alt), ainsi que alert/confirm.
   Les entrées peuvent contenir des jokers {0}, {1}… (nombres, noms) ; à défaut, les plus longs morceaux connus sont remplacés dans la phrase.
   Choix mémorisé dans localStorage (hackenia-lang) ; ?lang=en|fr force la langue. */
(()=>{'use strict';
const KEY='hackenia-lang',SUP=['fr','en'];
function detect(){try{const q=new URLSearchParams(location.search).get('lang');if(SUP.includes(q)){localStorage.setItem(KEY,q);return q}}catch{}try{const s=localStorage.getItem(KEY);if(SUP.includes(s))return s}catch{}return String(navigator.language||'fr').toLowerCase().startsWith('fr')?'fr':'en'}
const lang=detect();document.documentElement.lang=lang;
const api={lang,supported:SUP,set(l){if(!SUP.includes(l))return;try{localStorage.setItem(KEY,l)}catch{}location.reload()},t:s=>s,missing:new Set()};window.HackeniaI18n=api;
if(lang!=='en')return;
/* ——— anglais ——— */
const DICT=new Map(),PATS=[],FRAG=[];let started=false;
const norm=s=>s.replace(/\s+/g,' ').trim(),HAS=/[A-Za-zÀ-ÿ]/;
function build(){const src=window.HACKENIA_EN||{};for(const [k,v] of Object.entries(src)){const key=norm(k);if(!key)continue;if(/\{\d+\}/.test(key)){const nums=[...key.matchAll(/\{(\d+)\}/g)].map(m=>m[1]),parts=key.split(/\{\d+\}/).map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));PATS.push([new RegExp('^'+parts.join('([\\s\\S]{1,160}?)')+'$'),v,key.length,nums,key.split(/\{\d+\}/).filter(Boolean)])}else{DICT.set(key,v);if((key.length>=8||(key.length>=4&&/^[A-ZÀ-Ý]/.test(key)))&&!String(v).includes(key))FRAG.push(key)}}
 PATS.sort((a,b)=>b[2]-a[2]);FRAG.sort((a,b)=>b.length-a.length)}
const CACHE=new Map();
function tr(text){if(!text||!HAS.test(text))return null;const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(text),core=norm(m[2]);if(!core)return null;
 if(CACHE.has(core)){const c=CACHE.get(core);return c==null?null:m[1]+c+m[3]}
 let r=DICT.get(core);
 if(r===undefined){for(const [re,out,,nums,lits] of PATS){if(core.length>400||!lits.every(l=>core.includes(l)))continue;const x=re.exec(core);if(x){r=out.replace(/\{(\d+)\}/g,(_,i)=>{const k=nums.indexOf(i),p=k<0?'':x[k+1];return tr(p)??p});break}}}
 if(r===undefined){const o=frag(core);if(o!==core)r=o}
 if(CACHE.size>20000)CACHE.clear();if(r===undefined||r===core){CACHE.set(core,null);return null}CACHE.set(core,r);return m[1]+r+m[3]}
const wordy=c=>!!c&&/[A-Za-zÀ-ÿ]/.test(c);
function frag(core){let o=core;for(const k of FRAG){let i=o.indexOf(k);while(i>=0){if(!(wordy(o[i-1])&&wordy(k[0]))&&!(wordy(o[i+k.length])&&wordy(k[k.length-1]))){const v=DICT.get(k);o=o.slice(0,i)+v+o.slice(i+k.length);i=o.indexOf(k,i+v.length)}else i=o.indexOf(k,i+1)}}return o}
api.t=s=>{const r=tr(String(s));return r??s};
const ATTR=['title','aria-label','placeholder','alt'],SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','CODE','PRE','NOSCRIPT']);
const done=new WeakMap(),doneAttr=new WeakMap();
function attrs(el){let m=doneAttr.get(el);for(const a of ATTR){const v=el.getAttribute?.(a);if(v){if(m&&m[a]===v)continue;const r=tr(v);if(r!=null&&r!==v){el.setAttribute(a,r);(m||(m={}))[a]=r;doneAttr.set(el,m)}else{(m||(m={}))[a]=v;doneAttr.set(el,m)}}}if(el.tagName==='INPUT'&&/^(button|submit|reset)$/.test(el.type)){const r=tr(el.value);if(r!=null&&r!==el.value)el.value=r}}
function text(n){if(SKIP.has(n.parentNode?.tagName))return;const v=n.nodeValue;if(done.get(n)===v)return;const r=tr(v);if(r!=null&&r!==v){n.nodeValue=r;done.set(n,r)}else done.set(n,v)}
function walk(n){if(n.nodeType===3){text(n);return}if(n.nodeType!==1||SKIP.has(n.tagName))return;attrs(n);for(let c=n.firstChild;c;c=c.nextSibling)walk(c)}
function run(){if(started)return;started=true;build();const d=document.querySelector('meta[name=description]');if(d)d.content=api.t(d.content);
 walk(document.documentElement);
 new MutationObserver(list=>{for(const m of list){if(m.type==='childList')m.addedNodes.forEach(walk);else if(m.type==='characterData')text(m.target);else if(m.type==='attributes')attrs(m.target)}}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});}
api.start=run;
for(const f of['alert','confirm','prompt']){const o=window[f].bind(window);window[f]=(m,...a)=>o(api.t(String(m??'')),...a)}
const loc=(proto,fn)=>{const o=proto[fn];proto[fn]=function(l,...a){return o.call(this,l==='fr-FR'||l==='fr'?'en-US':l,...a)}};loc(Number.prototype,'toLocaleString');loc(Date.prototype,'toLocaleString');loc(Date.prototype,'toLocaleDateString');loc(Date.prototype,'toLocaleTimeString');
document.write('<script src="assets/i18n-en-v316.js?v=20270102-v418"><\/script><script>HackeniaI18n.start()<\/script>');
})();
