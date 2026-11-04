// E5 / библия §6.1: после босса — «Отпустить» (союзник, бонус навсегда) или «Забрать трофей» (деньги сразу + скидка 30% на showpiece района).
import {CONFIG as C} from './config.js';
import {bossState} from './engine.js';
import {DIST,SHOP_ITEMS} from './meta.js';
export const ALLY=[
 {d:1,t:'+3% XP за TRASH и GATEKEEPER: «на свалке всё пригодится»',x:{TRASH:3,GATEKEEPER:3}},
 {d:2,t:'Урон по боссам от GATEKEEPER ×1.5 (XP за гейткипера в фазе босса)',bossX:{GATEKEEPER:50}},
 {d:3,t:'+5 с к окну серии',fast:5},
 {d:4,t:'CALLBACK дают +10% денег',m:{CALLBACK:10}},
 {d:5,t:'+5% денег за BOOKED',m:{BOOKED:5}},
 {d:6,t:'+10 с к окну серии',fast:10},
 {d:7,t:'Антиспам: штраф ×0.75 вместо ×0.5',spamK:.75},
 {d:8,t:'+3% денег ко всему',mAll:3},
 {d:9,t:'Overdrive +30 с',odSec:30},
 {d:10,t:'Перерыв до сброса серии 50 мин вместо 40',maxGap:50},
 {d:11,t:'Крит по боссу: BOOKED в фазе босса ×1.15 XP',bossX:{BOOKED:15}}];
export const TROPHY_SHARE=.5,DISC=.3;
const ch=save=>((save.story||(save.story={})).ch||(save.story.ch={}));
export const choiceOf=(save,d)=>ch(save)['b'+d]||null;
export const trophyMoney=d=>Math.round(TROPHY_SHARE*C.assumedDailyMoney*C.districts[d-1][3]);
export const showpieceOf=d=>SHOP_ITEMS.find(x=>x.id===`d${d}t2`);
// первый захваченный район (1–11) без выбора; финал (12) без выбора
export function pendingChoice(save,G){const cap=(save.meta&&save.meta.captured)||{};for(let d=1;d<=11;d++){if((cap[d]||G.district>d)&&!choiceOf(save,d))return d}return null}
export function choose(save,G,d,how){if(choiceOf(save,d))return{ok:false,why:'уже выбрано'};const c=ch(save);
 if(how==='ally'){c['b'+d]='ally';return{ok:true,how,ally:ALLY.find(x=>x.d===d)}}
 const m=trophyMoney(d);G.money+=m;c['b'+d]='trophy';save.meta=save.meta||{};const dc=save.meta.disc||(save.meta.disc={});const sp=showpieceOf(d);if(sp)dc[sp.id]=DISC;return{ok:true,how,money:m,item:sp}}
export const allyCount=save=>Object.values(ch(save)).filter(v=>v==='ally').length;
// модификаторы союзников (поверх директивы и предметов, до Addiction)
export function withAllies(mods,save,G){const r={...mods,x:{...(mods.x||{})},m:{...(mods.m||{})}};const boss=G&&bossState(G)==='boss';
 for(const a of ALLY){if(choiceOf(save,a.d)!=='ally')continue;
  for(const[k,v]of Object.entries(a.x||{}))r.x[k]=(r.x[k]||1)*(1+v/100);for(const[k,v]of Object.entries(a.m||{}))r.m[k]=(r.m[k]||1)*(1+v/100);
  if(boss)for(const[k,v]of Object.entries(a.bossX||{}))r.x[k]=(r.x[k]||1)*(1+v/100);
  if(a.mAll)r.mAll=(r.mAll||1)*(1+a.mAll/100);if(a.fast)r.fast=(r.fast||0)+a.fast;if(a.odSec)r.odSec=(r.odSec||0)+a.odSec;
  if(a.spamK)r.spamK=Math.max(r.spamK||0,a.spamK);if(a.maxGap)r.maxGap=Math.max(r.maxGap||0,a.maxGap)}
 return r}
export const priceFor=(save,it)=>Math.round(it.price*(1-(((save.meta||{}).disc||{})[it.id]||0)));
export const bossName=d=>DIST[d-1][3];
