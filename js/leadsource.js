import {e164} from './providers.js';
// LeadSource: адаптер (CSV или Google Sheets из текущего дайлера) + Guard. Прогресс игры от таблицы не зависит.
export const fingerprint=(name,head,n)=>({name,cols:head.map(x=>String(x).trim().toLowerCase()).sort().join('|'),n});
export const REQUIRED=['phone','business'];
export function guard(saved,cur){ // cur: {name,head,rows:[{phone,result}]} либо null
 if(!cur||!cur.head)return{ok:false,code:'none',msg:'NO TARGET LIST LOADED'};
 const h=cur.head.map(x=>String(x).trim().toLowerCase());
 if(REQUIRED.some(c=>!h.includes(c)))return{ok:false,code:'broken',msg:'BROKEN LIST: нет колонки '+REQUIRED.filter(c=>!h.includes(c)).join(', ')};
 const open=cur.rows.filter(r=>e164(r.phone)&&!String(r.result||'').trim()).length;
 if(!open)return{ok:false,code:'exhausted',msg:'TERRITORY EXHAUSTED'};
 const f=fingerprint(cur.name,cur.head,cur.rows.length);
 if(saved&&(saved.cols!==f.cols||Math.abs(saved.n-f.n)>Math.max(20,saved.n*.5)))return{ok:false,code:'different',msg:'Это другая таблица. Прогресс привязан к прежней. Продолжить с ней / загрузить правильную?',fp:f};
 return{ok:true,code:'ok',fp:f,open}}
export class LeadSource{constructor(adapter){this.a=adapter;this.confirmed=false}
 // adapter: {load(),rows(),head(),name(),next(),setStatus(lead,name),findByPhone(e164)}
 check(saved){return guard(saved,this.a.snapshot())}
 confirm(){this.confirmed=true}          // до подтверждения таймеры и музыка не стартуют
 canTick(){return this.confirmed}
 isKnown(num){return !!this.a.findByPhone(e164(num))}}
