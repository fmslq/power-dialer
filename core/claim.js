// ЗАБРАТЬ НАГРАДУ (ТЗ: трофеи/ачивки). Выполненная ачивка или новый трофей (встреча/discovery) не зачисляются сами:
// карточка во вкладке ТРОФЕИ светится под «завесой», игрок нажимает — завеса падает, деньги летят в счётчик.
// Суммы — доля «железного дня» (assumedDailyMoney): заметно, но баланс рынка не ломает.
import {CONFIG as C} from './config.js';
import {ACH} from './achv.js';
export const CLAIM_SHARE={c:.1,r:.25,l:.6,gold:.06,platinum:.04};      // обычная / редкая / легендарная ачивка; трофей встречи / discovery
const r10=v=>Math.max(10,Math.round(v/10)*10);
export const rewardAch=a=>r10(C.assumedDailyMoney*(CLAIM_SHARE[a&&a.r]||CLAIM_SHARE.c));
export const rewardTr=t=>r10(C.assumedDailyMoney*(CLAIM_SHARE[t&&t.kind]||CLAIM_SHARE.gold));
const box=root=>root.claimed||(root.claimed={a:{},t:{}});
export const trKey=t=>String(t.t)+':'+String(t.lead||'');
export function pending(root){const b=box(root),got=root.ach||{};
 return[...ACH.filter(a=>got[a.id]&&!b.a[a.id]).map(a=>({kind:'a',id:a.id,item:a,money:rewardAch(a)})),
  ...(root.trophies||[]).filter(t=>!b.t[trKey(t)]).map(t=>({kind:'t',id:trKey(t),item:t,money:rewardTr(t)}))]}
export const isClaimed=(root,kind,id)=>!!box(root)[kind][id];
// старые сохранения: всё, что уже было получено до этой функции, считается забранным (без денег, чтобы не было «дождя» из $)
export function migrateClaims(root){if(root.claimV===1)return false;const b=box(root);for(const id in root.ach||{})b.a[id]=b.a[id]||1;
 for(const t of root.trophies||[])b.t[trKey(t)]=b.t[trKey(t)]||1;root.claimV=1;return true}
export function claim(root,G,kind,id,now=Date.now()){const b=box(root);if(b[kind]&&b[kind][id])return{ok:false,why:'уже забрано'};
 const p=pending(root).find(x=>x.kind===kind&&x.id===id);if(!p)return{ok:false,why:'нечего забирать'};
 const from=G.money||0;G.money=from+p.money;b[kind][id]=now;
 // ачивка не откатывается Undo — значит и деньги за неё не должны откатиться вместе со снимком последнего статуса
 const u=G.undo&&G.undo[G.undo.length-1];if(kind==='a'&&u&&u.before){try{const s=JSON.parse(u.before);s.money=(s.money||0)+p.money;u.before=JSON.stringify(s)}catch(e){}}
 return{ok:true,from,to:G.money,money:p.money,item:p.item,kind}}
export function runClaimTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('награда: ачивки по редкости, трофей меньше ачивки',()=>rewardAch({r:'c'})<rewardAch({r:'r'})&&rewardAch({r:'r'})<rewardAch({r:'l'})&&rewardTr({kind:'gold'})<rewardAch({r:'c'}));
 t('забрать: деньги +, второй раз нельзя',()=>{const root={ach:{v50:1},trophies:[]},G={money:100,undo:[]};const r=claim(root,G,'a','v50');return r.ok&&G.money===100+rewardAch(ACH[0])&&!claim(root,G,'a','v50').ok&&!pending(root).length});
 t('деньги за ачивку переживают Undo снимка',()=>{const root={ach:{v50:1}},G={money:50,undo:[{before:JSON.stringify({money:40})}]};claim(root,G,'a','v50');return JSON.parse(G.undo[0].before).money===40+rewardAch(ACH[0])});
 t('миграция: старое считается забранным',()=>{const root={ach:{v50:1},trophies:[{t:1,lead:'x',kind:'gold'}]};migrateClaims(root);return pending(root).length===0&&!migrateClaims(root)});
 t('трофей: в списке ожидания до нажатия',()=>{const root={claimV:1,trophies:[{t:5,lead:'p',kind:'platinum'}]},G={money:0,undo:[]};const n=pending(root).length;const r=claim(root,G,'t','5:p');return n===1&&r.ok&&G.money===rewardTr({kind:'platinum'})});
 return o}
