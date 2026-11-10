const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8'),seg=src.slice(src.indexOf('const DAILY_REWARDS='),src.indexOf('(function setupDaily()'));
let now=new Date(2026,10,10,9);const saved=[];const ctx=vm.createContext({profile:{gold:0,inventory:{},decks:[]},storageOK:true,structuredClone,Date:class extends Date{constructor(...a){super(...(a.length?a:[now]))}},Number,String,Math,commit(p){saved.push(p);ctx.profile=p;return true},toast(){},$:()=>null,bubulles:n=>String(n)});
vm.runInContext(seg+';this.api={dailyState,claimDaily,dailyRewards,todayKey};',ctx);const {dailyState,claimDaily,dailyRewards}=ctx.api;
assert.equal(dailyState().claimable,true);assert.equal(dailyState().day,0);
const rewards=dailyRewards(0);assert.equal(rewards.length,7);assert.deepEqual(Array.from(rewards,r=>r.gold),[30,30,30,30,30,30,100],'30 Bubulles a day, 100 on day 7');assert.ok(rewards[6].big&&rewards[6].gold>Math.max(...rewards.slice(0,6).map(r=>r.gold)),'Day 7 is the biggest reward');
claimDaily();assert.equal(ctx.profile.gold,rewards[0].gold);assert.equal(dailyState().claimable,false,'Only one claim per day');claimDaily();assert.equal(saved.length,1);
let total=rewards[0].gold;for(let d=2;d<=7;d++){now=new Date(2026,10,9+d,9);claimDaily();total+=rewards[d-1].gold}
assert.equal(ctx.profile.gold,total);assert.equal(ctx.profile.daily.day,7);
now=new Date(2026,10,20,9);assert.equal(dailyState().day,0,'Day 8 starts a new cycle');assert.equal(dailyState().cycle,1);claimDaily();assert.equal(ctx.profile.daily.day,1);assert.equal(ctx.profile.daily.cycle,1);
now=new Date(2026,10,25,9);assert.equal(dailyState().day,1,'Missed days do not reset progress');
console.log('PASS: one claim per calendar day, 7-day cycle with a bigger 7th reward, new cycle on day 8, no reset after missed days.');
