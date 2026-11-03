// История звонков Zoom (CSV из веб-портала Zoom: Phone → Call History → Export).
// Это НЕ живые события Smart Embed: файл скачивается после смены. Нужен для проверки задним числом
// (встречи «на проверке», бонус за разговор, аналитика), см. DECISIONS §14.
import {parse} from './table.js';
const hms=v=>{const m=String(v||'').trim().match(/^(\d+):(\d\d):(\d\d)$/);return m?(+m[1])*3600+(+m[2])*60+(+m[3]):null};
const num=v=>String(v||'').replace(/[^\d+]/g,'');
// Start Time без часового пояса: время аккаунта Zoom. tzOffsetMin = смещение пояса аккаунта (как getTimezoneOffset).
export function parseZoomHistory(text,{tzOffsetMin=null}={}){const rows=parse(String(text).replace(/^\uFEFF/,''),',');const h=rows[0].map(x=>x.trim()),ix=n=>h.indexOf(n);
  if(ix('Call ID')<0||ix('Start Time')<0||ix('Duration')<0)return{ok:false,why:'не похоже на историю звонков Zoom',calls:[]};
  const g=(r,n)=>r[ix(n)]!=null?String(r[ix(n)]).trim():'';
  const calls=rows.slice(1).filter(r=>r.length>3&&g(r,'Call ID')).map(r=>{const dir=/out/i.test(g(r,'Direction'))?'out':'in',st=g(r,'Start Time').replace(' ','T');
    const t=tzOffsetMin==null?new Date(st).getTime():Date.parse(st+'Z')+tzOffsetMin*60000,wait=hms(g(r,'Wait Time')),dur=hms(g(r,'Duration'));
    return{id:g(r,'Call ID'),dir,number:num(dir==='out'?g(r,'To Phone Number'):g(r,'From Phone Number')),start:t,wait,dur:dur==null?0:dur,
      result:g(r,'Call Result'),connected:/connected|answered/i.test(g(r,'Call Result'))&&dur!=null,device:g(r,'Device')}});
  return{ok:true,calls,devices:[...new Set(calls.map(c=>c.device).filter(Boolean))]}}
// Найти звонок для статуса: тот же номер (10 последних цифр), исходящий, начат не позже статуса и не раньше чем за winMin.
export function matchCall(calls,phone,statusAt,winMin=30){const p=num(phone).slice(-10);let best=null;
  for(const c of calls)if(c.dir==='out'&&c.number.slice(-10)===p&&c.start<=statusAt+5000&&statusAt-c.start<=winMin*60000&&(!best||c.start>best.start))best=c;return best}
// Через что звонили: встроенный телефон (есть живые события) или приложение Zoom (событий в браузере нет).
export const viaApp=devices=>devices.some(d=>/MAC_Client|WIN_Client|IOS|Android/i.test(d));
// Повторный набор: все исходящие на номер между прошлым статусом и этим = один звонок (длительность = сумма).
export function matchGroup(calls,phone,statusAt,sinceAt=null,winMin=30,minSec=30){const p=num(phone).slice(-10),lo=sinceAt!=null?sinceAt:statusAt-winMin*60000;
  const g=calls.filter(c=>c.dir==='out'&&c.number.slice(-10)===p&&c.start<=statusAt+5000&&c.start>=lo).sort((a,b)=>a.start-b.start);
  return g.length?{calls:g,start:g[0].start,dur:g.reduce((a,c,i)=>a+(i===g.length-1||c.dur>=minSec?c.dur:0),0),redials:g.length-1}:null}   // ранние наборы < 30 с не прибавляются
