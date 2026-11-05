import {apply,talkBonus,verified} from './engine.js';
import {CONFIG as C,STATUS} from './config.js';
// Связывает статус со звонком. Любая нехватка данных => старая логика (6.1–6.5), без штрафов.
// Проверка встречи/Discovery по Zoom (решение пользователя): короче minTalkSec = статус поставить НЕЛЬЗЯ.
// ok | short (есть данные Zoom, разговор короткий) | wait (лог ещё не пришёл) | nodata (Zoom нет / ручной / другой номер)
// Повторный набор (связь оборвалась, перезвонил тому же лиду): все непривязанные звонки на тот же номер
// после прошлого статуса = ОДИН звонок. Начало = первый набор, конец = последний, разговор = сумма.
export function group(prov,c,since){if(!c||c.manual||!prov.calls||!c.number)return c;const p=c.number.slice(-10),all=[];
 for(const x of (prov.calls.values?prov.calls.values():prov.calls))if(x.bound==null&&x.ringing!=null&&x.number&&x.number.slice(-10)===p&&x.ringing<=c.ringing&&(since==null||x.ringing>=since))all.push(x);
 if(all.length<2)return c;all.sort((a,b)=>a.ringing-b.ringing);const done=all.slice(0,-1),last=all[all.length-1],pend=all.some(x=>x.dur==null&&x.ended!=null&&x!==last);
 const prevDur=done.reduce((a,x)=>a+((x.dur||0)>=C.redialMinSec?x.dur:0),0);   // решение пользователя: оборванные наборы короче 30 с не прибавляются
 return{...last,id:last.id,ids:all.map(x=>x.id),ringing:all[0].ringing,redials:all.length-1,prevDur,
  dur:last.dur!=null&&!pend?prevDur+last.dur:null,connected:last.connected!=null?last.connected-prevDur*1000:(prevDur&&last.ended==null?last.ringing-prevDur*1000:last.connected)}}
export function winCheck(id,c,lead,now,{late=false}={}){const st=STATUS[id];if(!st||!C.classes[st.cls].win)return{v:'ok'};const min=C.minTalkSec[st.cls];
 if(!c||c.manual||(c.number&&lead&&lead.phone&&c.number.slice(-10)!==String(lead.phone).slice(-10)))return{v:'nodata',min};
 const dur=c.dur!=null?c.dur:c.connected!=null?Math.round(((c.ended!=null?c.ended:now)-c.connected)/1000):null;
 if(dur!=null&&dur>=min)return{v:'ok',dur,min};
 if(c.ended==null)return{v:'wait',dur,min};                       // звонок ещё идёт
 if(dur==null)return late?{v:'nodata',min}:{v:'wait',min};        // конец есть, длительности нет: ждём лог (UI до 10 с)
 return{v:'short',dur,min}}
export function statusFlow(s,id,now,prov,lead,o={}){const c=group(prov.zoom||prov,prov.takeCall(now),s.last),meta={mode:'manual',verified:'MANUAL',call:null,offList:false,mismatch:null,health:prov.health().state};let ao={bonus:o.bonus,re:o.re,mods:o.mods};
 const wc=winCheck(id,c,lead,now,{late:o.late});meta.win=wc;
 if(wc.v==='short'||wc.v==='wait')return{meta,ev:null,blocked:wc.v,dur:wc.dur,min:wc.min};
 if(wc.v==='nodata'){ao.cls='TALK';meta.winUnverified=true}   // в таблицу уходит, но игра считает как разговор (без трофея и Ульты)
 if(c){meta.call=c.id;
  if(c.number&&o.isKnown&&!o.isKnown(c.number)){meta.offList=true;return{meta,ev:null}}
  if(c.number&&lead&&lead.phone&&c.number.slice(-10)!==String(lead.phone).slice(-10))meta.mismatch=c.number;
  const stale=!c.manual&&c.ringing!=null&&c.ended==null&&now-c.ringing>C.staleRingingMin*60000,
   full=c.manual?true:c.ringing!=null&&c.ended!=null&&!stale&&meta.health!=='red';
  if(full){ao.gapMs=s.last==null?0:c.ringing-s.last;ao.sinceEndedMs=c.manual?0:now-c.ended;if(!c.manual&&!meta.mismatch){ao.callStart=c.ringing;ao.callEnd=c.ended}meta.mode=c.manual?'manual-dial':'zoom';meta.verified=c.manual?'MANUAL':null}
  for(const k of c.ids||[c.id])prov.bind(k,id)}
 const ev=apply(s,id,now,ao),u=s.undo[s.undo.length-1];u.call=meta.call;u.mode=meta.mode;if(meta.mismatch)u.mismatch=meta.mismatch;if(c&&c.ids){u.calls=c.ids;u.redials=c.redials;u.prevDur=c.prevDur}if(c&&c.dur!=null)u.dur=c.dur;
 if(meta.mode==='zoom'&&c&&c.dur!=null){ev.settle=settle(s,u);if(ev.settle.bonus.captured)ev.captured=true}else if(meta.mode==='zoom'&&c)u.wait=c.id;
 return{meta,ev,entry:u}}
export function settle(s,u,dur=u.dur){u.dur=dur;u.settled=1;const ok=verified(u.id,dur);u.verified=ok?'OK':'UNVERIFIED';
 // Бонус за разговор ТОЛЬКО по длительности из лога Zoom и только если номер звонка = номер лида.
 // Время «набор → статус» никогда не используется (ушёл, вернулся, поставил статус = бонуса нет).
 return{verified:u.verified,bonus:ok&&u.mode==='zoom'&&!u.mismatch?talkBonus(s,u,dur):{x:0,m:0}}}
// Лог пришёл позже статуса (до logWaitMin): бонус и верификация задним числом.
export function lateLog(s,callId,dur,now){const u=s.undo.find(x=>(x.call===callId||(x.calls&&x.calls.includes(callId)))&&!x.settled&&x.mode==='zoom');if(!u||now-u.t>C.logWaitMin*60000)return null;
 if(u.calls&&callId!==u.call)return null;                       // лог раннего (оборванного) набора: его длительность уже в prevDur
 return settle(s,u,(u.prevDur||0)+dur)}
