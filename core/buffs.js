// БОНУСЫ ПРЕДМЕТОВ БАЗЫ (STORY_BIBLE §8). Предмет из узла «ТИШИНЫ» — усилитель несущей: маленький постоянный бонус.
// Виды: xAll/mAll — % ко всему XP/$; x/m — % к XP/$ одного класса статуса; fast — +секунды к окну серии быстрых статусов;
// first10 — % XP за первые 10 звонков дня; night — % XP после 18:00. Бонусы складываются, у каждого вида потолок CAP.
// Цифры — черновик до общего пересмотра баланса (Q24).
export const CAP={xAll:25,mAll:25,cls:30,fast:30};
export const ITEM_BUFF={
 d1t0:{first10:5},d1t1:{xAll:1},d1t2:{fast:5},
 d2t0:{x:{GATEKEEPER:10}},d2t1:{xAll:3},d2t2:{x:{TALK:5}},
 d3t0:{m:{BOOKED:5}},d3t1:{fast:3},d3t2:{mAll:5},
 d4t0:{fast:5},d4t1:{night:3},d4t2:{x:{TRASH:10}},
 d5t0:{mAll:2},d5t1:{m:{DISCOVERY:8}},d5t2:{x:{BOOKED:5}},
 d6t0:{mAll:2},d6t1:{m:{CALLBACK:8}},d6t2:{xAll:3},
 d7t0:{xAll:3},d7t1:{x:{CALLBACK:8}},d7t2:{x:{GATEKEEPER:10}},
 d8t0:{mAll:3},d8t1:{m:{BOOKED:6}},d8t2:{fast:5},
 d9t0:{fast:3},d9t1:{x:{TALK:6}},d9t2:{xAll:3},
 d10t0:{xAll:3},d10t1:{fast:5},d10t2:{mAll:3},
 d11t0:{mAll:3},d11t1:{xAll:3},d11t2:{x:{BOOKED:6}},
 d12t0:{xAll:2,mAll:2},d12t1:{mAll:5},d12t2:{xAll:5}};
const CLS_RU={TRASH:'«мимо»',GATEKEEPER:'гейткиперов',MINOR:'мелких',TALK:'разговоров',CALLBACK:'перезвонов',BOOKED:'встреч',DISCOVERY:'DISCOVERY'};
// подпись для карточки рынка
export function buffText(id){const b=ITEM_BUFF[id];if(!b)return'';const o=[];
 if(b.xAll)o.push(`+${b.xAll}% XP ко всем звонкам`);if(b.mAll)o.push(`+${b.mAll}% $ ко всем звонкам`);
 for(const[k,v]of Object.entries(b.x||{}))o.push(`+${v}% XP за ${CLS_RU[k]||k}`);for(const[k,v]of Object.entries(b.m||{}))o.push(`+${v}% $ за ${CLS_RU[k]||k}`);
 if(b.fast)o.push(`+${b.fast} с к окну серии`);if(b.first10)o.push(`+${b.first10}% XP за первые 10 звонков дня`);if(b.night)o.push(`+${b.night}% XP после 18:00`);return o.join(' · ')}
// сумма бонусов купленного (owned — meta.owned); n — звонков сегодня до этого статуса; hour — местный час
export function itemTotals(owned,n=99,hour=12){const t={xAll:0,mAll:0,x:{},m:{},fast:0};
 for(const id in owned||{}){const b=ITEM_BUFF[id];if(!owned[id]||!b)continue;
  t.xAll+=(b.xAll||0)+(b.first10&&n<10?b.first10:0)+(b.night&&hour>=18?b.night:0);t.mAll+=b.mAll||0;t.fast+=b.fast||0;
  for(const[k,v]of Object.entries(b.x||{}))t.x[k]=(t.x[k]||0)+v;for(const[k,v]of Object.entries(b.m||{}))t.m[k]=(t.m[k]||0)+v}
 t.xAll=Math.min(CAP.xAll,t.xAll);t.mAll=Math.min(CAP.mAll,t.mAll);t.fast=Math.min(CAP.fast,t.fast);
 for(const k in t.x)t.x[k]=Math.min(CAP.cls,t.x[k]);for(const k in t.m)t.m[k]=Math.min(CAP.cls,t.m[k]);return t}
// сливает бонусы предметов в модификаторы директивы дня (missions.modsFor): множители перемножаются, секунды складываются
export function withItems(mods,owned,n,hour){const t=itemTotals(owned,n,hour),r={m:{...(mods.m||{})},x:{...(mods.x||{})},mAll:(mods.mAll||1)*(1+t.mAll/100),xAll:(mods.xAll||1)*(1+t.xAll/100),fast:(mods.fast||0)+t.fast};
 for(const k in t.x)r.x[k]=(r.x[k]||1)*(1+t.x[k]/100);for(const k in t.m)r.m[k]=(r.m[k]||1)*(1+t.m[k]/100);return r}
export function runBuffTests(ids){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('бонус у каждого из 36 предметов и подпись',()=>ids.length===36&&ids.every(id=>ITEM_BUFF[id]&&buffText(id).length>5));
 t('бонусы: лампа только первые 10 звонков, потолок XP 25%',()=>itemTotals({d1t0:1},3).xAll===5&&itemTotals({d1t0:1},12).xAll===0&&itemTotals(Object.fromEntries(ids.map(i=>[i,1])),3,20).xAll===25);
 t('бонусы сливаются с директивой',()=>{const r=withItems({m:{TALK:1.4},mAll:1,fast:15},{d3t2:1,d1t2:1,d2t2:1});return Math.abs(r.mAll-1.05)<1e-9&&r.fast===20&&Math.abs(r.x.TALK-1.05)<1e-9&&r.m.TALK===1.4});
 return o}
