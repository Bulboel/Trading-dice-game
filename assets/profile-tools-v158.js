/* Local fresh-start / undo transactions. A failed write restores the previous state. */
(()=>{'use strict';const keys=['hackenia-dice-profile-v1','hackenia-dice-draft-v1','hackenia-options-v1','hackenia-intro-v1'],BACKUP='hackenia-before-fresh-start-v1';
function snapshot(storage){return Object.fromEntries(keys.map(k=>[k,storage.getItem(k)]))}
function write(storage,values){for(const key of keys){if(values[key]===null)storage.removeItem(key);else storage.setItem(key,values[key])}}
function apply(storage,values){let before;try{before=snapshot(storage)}catch{return false}try{storage.setItem(BACKUP,JSON.stringify({version:1,values:before}));write(storage,values);return true}catch{try{write(storage,before)}catch{}return false}}
function backup(storage){try{const data=JSON.parse(storage.getItem(BACKUP));if(data?.version!==1||keys.some(k=>data.values?.[k]!==null&&typeof data.values?.[k]!=='string'))return null;return data.values}catch{return null}}
function reset(storage,profile){const values=Object.fromEntries(keys.map(k=>[k,null]));values[keys[0]]=JSON.stringify(profile);return apply(storage,values)}
function start(storage,profile){let values;try{values=snapshot(storage)}catch{return false}values[keys[0]]=JSON.stringify(profile);values[keys[1]]=null;return apply(storage,values)}
function restore(storage){const values=backup(storage);return!!values&&apply(storage,values)}
window.HackeniaProfileTools={reset,start,restore,backup};})();
