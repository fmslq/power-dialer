// Очередь, история и «Выбрать лида» с фильтрами (перенос queue/reinit/advance/back/match/mlist/pickLead/startSlice старого дайлера).
// Поведение то же: только необработанные (onlyT), фильтры Тип / Штат / Часовой пояс, старт от выбранного лида, отложенные (s) уходят в конец.
import {lstate,tzk,zone,localTime} from './geo.js';
import {statusColor} from './statuses.js';
export const match=(t,l,f)=>(!f.type||t.get(l,"Type of company").trim()==f.type)&&(!f.state||lstate(t,l)==f.state)&&(!f.tz||tzk(t,l)==f.tz);
export const TZ_ORDER=["Eastern","Central","Mountain","Pacific"];
export class Queue{
 constructor(t){this.t=t;this.start=0;this.f={type:"",state:"",tz:""};this.only=true;this.tk=0;this.hist=[];this.hc=-1}
 get cur(){return this.hist[this.hc]||null}
 list(){const t=this.t,n=t.L.length,st=this.start,q=[];
  for(let i=0;i<n;i++){const l=t.L[i];if(!t.ph(l)||(this.only&&t.res(l))||!match(t,l,this.f))continue;q.push(i)}
  return q.sort((a,b)=>t.L[a].s-t.L[b].s||((a-st+n)%n)-((b-st+n)%n))}
 reinit(){this.hist=[];this.hc=-1;const q=this.list();if(q.length){this.hist=[this.t.L[q[0]]];this.hc=0}}
 // → true, если взят свежий лид (а не шаг вперёд по истории)
 advance(){if(this.hc<this.hist.length-1){this.hc++;return false}
  const q=this.list(),cur=this.cur,k=q.findIndex(i=>this.t.L[i]!==cur);this.hist.push(k<0?null:this.t.L[q[k]]);this.hc=this.hist.length-1;
  if(this.hist.length>300){this.hist.shift();this.hc--}return k>=0}
 back(){if(this.hc<=0)return false;this.hc--;return true}
 next(){const q=this.list(),cur=this.cur,k=q.find(i=>this.t.L[i]!==cur);return k==null?null:this.t.L[k]}   // «Дальше: …»
 touch(l){l.s=++this.tk}                                                                                    // отложить / статус = в конец
 remaining(){return this.list().length}
 pick(i,f){this.start=i;this.f={type:f.type||"",state:f.state||"",tz:f.tz||""};this.t.L.forEach(x=>x.s=0);this.hist.splice(this.hc+1);this.hist.push(this.t.L[i]);this.hc=this.hist.length-1}
 slice(f,clear){this.start=0;this.f=clear?{type:"",state:"",tz:""}:{type:f.type||"",state:f.state||"",tz:f.tz||""};this.t.L.forEach(x=>x.s=0);this.reinit()}
 // после reconcile: оставить в истории только живых лидов
 keep(set){const cur=this.cur;this.hist=this.hist.filter(l=>l&&set.has(l));this.hc=cur&&set.has(cur)?this.hist.lastIndexOf(cur):-1;if(this.hc<0)this.reinit();
  this.start=Math.max(0,Math.min(this.start,this.t.L.length-1))}
}
// Данные окна «Выбрать лида» (mlist): чипы фильтров (топ-10 по частоте), строки, «Показать выше/ниже». M={q,type,state,tz,hide,off,n}
export function pickerData(t,q,M,curL,map,now=Date.now()){const ltc={},lt=l=>{const z=zone(t,l);if(!z)return null;if(!(z.z in ltc))ltc[z.z]=localTime(t,l,new Date(now));return ltc[z.z]};const all=[];t.L.forEach((l,i)=>{if(t.ph(l))all.push(i)});
 const cnt=f=>{const m={};all.forEach(i=>{const v=f(t.L[i]);if(v)m[v]=(m[v]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>x[0])};
 const s=String(M.q||'').toLowerCase(),filtered=!!(M.q||M.type||M.state||M.tz||M.hide);
 const rs=all.filter(i=>{const l=t.L[i];return(!M.hide||!t.res(l))&&match(t,l,M)&&(!s||[t.get(l,"Business"),t.get(l,"Phone"),t.get(l,"Type of company"),t.get(l,"Notes"),t.get(l,"Result"),t.get(l,"Prep")].join(" ").toLowerCase().includes(s))});
 const cur=t.L.indexOf(curL);if(M.first){M.first=0;const p=rs.indexOf(cur);if(p>0)M.off=Math.max(0,p-120)}const off=M.off||0,n=M.n||400;
 const rows=rs.slice(off,off+n).map((i,k)=>{const l=t.L[i];return{i,biz:t.get(l,"Business"),type:t.get(l,"Type of company"),state:lstate(t,l),
  result:t.res(l),notes:t.get(l,"Notes").trim().replace(/\s+/g," "),prep:t.prep(l).replace(/\s+/g," "),done:!!t.res(l),now:i==cur,first:filtered&&!k&&!off,color:t.res(l)?statusColor(t.res(l),map):null,tz:tzk(t,l),local:lt(l),date:t.get(l,"Date Engaged")}});
 return{chips:{tz:TZ_ORDER.filter(v=>all.some(i=>tzk(t,t.L[i])==v)),state:cnt(l=>lstate(t,l)),type:cnt(l=>t.get(l,"Type of company").trim())},
  rows,total:rs.length,up:off>0,down:rs.length>off+n,filtered,hasFilter:!!(M.type||M.state||M.tz),curPos:rs.indexOf(cur)}}
