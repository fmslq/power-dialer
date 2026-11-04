// I8 (кусок 20): долговременный журнал звонков Zoom в сохранении игры (root.zlog), без дублей.
// Пополняется живыми событиями (callRinging / callLogged) и импортом CSV истории Zoom.
// Запись: [id, номер (10 цифр), начало (мс), длительность (с) | null, источник 'l'|'c'].
import {dayKey} from './stats.js';
export const ZL={max:4000,keepDays:60,sameSec:90,backDays:14};
const n10=p=>String(p||'').replace(/\D/g,'').slice(-10);
const arr=root=>Array.isArray(root.zlog)?root.zlog:(root.zlog=[]);
// дубль: тот же id, или тот же номер и начало в пределах sameSec (живое событие и строка CSV — разные id)
export function zlogFind(root,id,num,start){const L=arr(root),p=n10(num);
  for(let i=L.length-1;i>=0;i--){const e=L[i];if(id&&e[0]===id)return e;if(p&&e[1]===p&&start!=null&&Math.abs(e[2]-start)<=ZL.sameSec*1000)return e}return null}
export function zlogAdd(root,{id,number,start,dur=null,src='l'},now=Date.now()){const p=n10(number);if(!p||p.length<10||start==null||!isFinite(start))return false;
  const L=arr(root),e=zlogFind(root,id,p,start);
  if(e){if(dur!=null&&(e[3]==null||src==='c'))e[3]=dur;if(src==='c')e[4]='c';return false}
  L.push([String(id||('z'+start)),p,start,dur,src]);
  if(L.length>1&&L[L.length-2][2]>start)L.sort((a,b)=>a[2]-b[2]);
  zlogTrim(root,now);return true}
export function zlogDur(root,id,dur){const e=arr(root).find(x=>x[0]===id);if(e&&dur!=null)e[3]=dur;return!!e}
export function zlogTrim(root,now=Date.now()){const L=arr(root),lo=now-ZL.keepDays*864e5;let i=0;while(i<L.length&&L[i][2]<lo)i++;if(i)L.splice(0,i);if(L.length>ZL.max)L.splice(0,L.length-ZL.max)}
export function zlogImport(root,calls,now=Date.now()){let add=0,dup=0;for(const c of calls||[]){if(c.dir!=='out')continue;if(zlogAdd(root,{id:c.id,number:c.number,start:c.start,dur:c.dur,src:'c'},now))add++;else dup++}return{add,dup,total:arr(root).length}}
// Задним числом: последний звонок по номеру был в прошлый день, а сегодня по нему звонков нет → время того звонка (иначе null).
export function backAt(root,phone,now=Date.now()){const p=n10(phone);if(!p)return null;const L=arr(root),today=dayKey(now);let last=null;
  for(const e of L){if(e[1]!==p||e[2]>now+5000)continue;if(dayKey(e[2])===today)return null;if(last==null||e[2]>last)last=e[2]}
  return last!=null&&now-last<=ZL.backDays*864e5?last:null}
