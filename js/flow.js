import {apply,talkBonus,verified} from './engine.js';
import {CONFIG as C} from './config.js';
// Связывает статус со звонком. Любая нехватка данных => старая логика (6.1–6.5), без штрафов.
export function statusFlow(s,id,now,prov,lead,o={}){const c=prov.takeCall(now),meta={mode:'manual',verified:'MANUAL',call:null,offList:false,mismatch:null,health:prov.health().state};let ao={bonus:o.bonus,re:o.re,mods:o.mods};
 if(c){meta.call=c.id;
  if(c.number&&o.isKnown&&!o.isKnown(c.number)){meta.offList=true;return{meta,ev:null}}
  if(c.number&&lead&&lead.phone&&c.number.slice(-10)!==String(lead.phone).slice(-10))meta.mismatch=c.number;
  const stale=!c.manual&&c.ringing!=null&&c.ended==null&&now-c.ringing>C.staleRingingMin*60000,
   full=c.manual?true:c.ringing!=null&&c.ended!=null&&!stale&&meta.health!=='red';
  if(full){ao.gapMs=s.last==null?0:c.ringing-s.last;ao.sinceEndedMs=c.manual?0:now-c.ended;meta.mode=c.manual?'manual-dial':'zoom';meta.verified=c.manual?'MANUAL':null}
  prov.bind(c.id,id)}
 const ev=apply(s,id,now,ao),u=s.undo[s.undo.length-1];u.call=meta.call;u.mode=meta.mode;if(c&&c.dur!=null)u.dur=c.dur;
 if(meta.mode==='zoom'&&c&&c.dur!=null)ev.settle=settle(s,u);else if(meta.mode==='zoom'&&c)u.wait=c.id;
 return{meta,ev,entry:u}}
export function settle(s,u,dur=u.dur){u.dur=dur;u.settled=1;const ok=verified(u.id,dur);u.verified=ok?'OK':'UNVERIFIED';
 return{verified:u.verified,bonus:ok&&u.mode==='zoom'?talkBonus(s,u,dur):{x:0,m:0}}}
// Лог пришёл позже статуса (до logWaitMin): бонус и верификация задним числом.
export function lateLog(s,callId,dur,now){const u=s.undo.find(x=>x.call===callId&&!x.settled&&x.mode==='zoom');if(!u||now-u.t>C.logWaitMin*60000)return null;return settle(s,u,dur)}
