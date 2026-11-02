import {CONFIG as C,STATUS,districtThr} from './config.js';
const MS=1000,steps=C.heat.steps,stepOf=n=>steps.reduce((k,t,i)=>n>=t?i:k,0);
export const xpMult=m=>1+(m-1)*C.heat.xpShare;
export const newState=now=>({xp:0,money:0,lifeXp:0,district:1,dxp:0,carry:0,streak:0,step:0,last:null,lastCls:null,ulta:0,od:null,paused:null,shiftStart:now||0,undo:[],odBase:0});
const snapOf=s=>{const{undo,...r}=s;return JSON.stringify(r)};
export function rate(s,cls,now){const hi=C.hi.includes(cls);
 if(s.od&&now<s.od.until&&hi)return{m:C.od.money,x:C.od.xp,od:1};
 const k=(s.ulta>0||(s.od&&now<s.od.until))?steps.length-1:s.step,m=C.heat.money[k];return{m,x:xpMult(m),od:0}}
export function apply(s,id,now,o={}){const st=STATUS[id],cls=st.cls,cc=C.classes[cls],hi=C.hi.includes(cls),before=snapOf(s),ev={cls,pen:null,spam:false,captured:false,odStart:false,odEnd:false,tier:null};
 if(s.od&&now>=s.od.until){ev.odEnd=s.od;s.od=null}
 const gap=o.gapMs!=null?o.gapMs:s.last==null?0:now-s.last,max=C.maxGapMin*60*MS;
 if(o.re)ev.re=true;
 else if(s.last!=null&&now-s.last<C.antispamSec*MS)ev.spam=true;
 else if(s.last!=null){
  if(gap>max||o.sinceEndedMs>max){s.step=s.ulta=0;s.streak=1;s.od=null;ev.pen='reset'}
  else if(s.ulta>0){s.ulta--;s.streak++;s.step=stepOf(s.streak)}
  else{const allowed=C.classes[s.lastCls].win?C.winMaxGapMin*60*MS:cc.fast?(C.fastSec+(o.mods&&o.mods.fast||0)+(C.crmFrom.includes(s.lastCls)?C.crmSec:0))*MS:max;
   if(gap<=allowed){s.streak++;s.step=stepOf(s.streak)}else{s.step=Math.max(0,s.step-1);s.streak=steps[s.step];ev.pen='drop'}}
 }else{s.streak++;s.step=stepOf(s.streak)}
 if(ev.pen)s.odBase=Math.min(s.odBase,s.streak);
 if(!ev.spam&&!ev.re&&!ev.pen&&!s.od&&s.streak-s.odBase>=C.od.streak){s.od={until:now+C.od.sec*MS,n:0,money:0,xp:0};s.odBase=s.streak;ev.odStart=true}
 const r=rate(s,cls,now),y=C.districts[s.district-1][3],bonus=Math.min(o.bonus||0,C.bonusCap),sp=ev.spam?C.antispamMult:1;
 const md=o.mods||{},mx=(md.x&&md.x[cls])||1,mm=((md.m&&md.m[cls])||1)*(md.mAll||1);let x=Math.round(cc.xp*r.x*y*(1+bonus)*sp*mx),m=Math.round(cc.money*r.m*y*(1+bonus)*sp*mm),thr=districtThr(s.district);
 if(s.district>=C.finishFromDistrict&&!hi){const cap=Math.max(0,thr-1-s.dxp);if(x>cap){s.carry+=x-cap;ev.immune=true}x=Math.min(x,cap)}
 // xp для статистики полный, в район идёт x
 s.xp+=x;s.money+=m;s.lifeXp+=x;s.dxp+=x;
 if(s.dxp>=thr){const extra=s.dxp-thr;if(s.district<12){s.district++;s.dxp=s.carry+extra;s.carry=0}else s.dxp=thr;ev.captured=true}
 if(s.od&&r.od||s.od&&!hi){s.od.n++;s.od.money+=m;s.od.xp+=x}
 if(cc.win&&!ev.re)s.ulta=C.ulta.n;
 if(!ev.spam&&!ev.re){s.last=now;s.lastCls=cls}
 s.undo.push({t:now,id,before,x,m,cm:r.m,cx:r.x,cls});if(s.undo.length>50)s.undo.shift();
 ev.x=x;ev.m=m;ev.mult=r;ev.step=s.step;return ev}
// Undo: последний статус (≤ undoSec) откатывает всё; старый — только ресурсы.
export function undo(s,now,i=s.undo.length-1){const u=s.undo[i];if(!u)return false;
 if(i===s.undo.length-1&&now-u.t<=C.undoSec*MS){const keep=s.undo.slice(0,-1);Object.assign(s,JSON.parse(u.before));s.undo=keep;return 'full'}
 s.xp-=u.x;s.money-=u.m;s.lifeXp-=u.x;s.dxp=Math.max(0,s.dxp-u.x);s.undo.splice(i,1);return 'resources'}
export function pause(s,now){if(s.paused==null)s.paused=now}
export function resume(s,now){if(s.paused==null)return;const d=now-s.paused;s.paused=null;
 if(d>C.pauseMaxSec*MS){s.streak=s.step=s.ulta=0}
 if(s.last!=null)s.last+=d;if(s.od)s.od.until+=d}
// Бонус за время разговора (5.4): только TALK/CALLBACK/BOOKED/DISCOVERY, можно задним числом.
export function talkBonus(s,entry,dur){if(!C.hi.includes(entry.cls)||!dur)return{x:0,m:0};
 const n=Math.min(C.talkBonus.cap,Math.floor(Math.max(0,dur-C.talkBonus.after)/C.talkBonus.per)),y=C.districts[s.district-1][3];
 const x=Math.round(n*C.talkBonus.xp*entry.cx*y),m=Math.round(n*C.talkBonus.money*entry.cm*y);s.xp+=x;s.money+=m;s.lifeXp+=x;s.dxp+=x;entry.x+=x;entry.m+=m;return{x,m}}
export const verified=(id,dur)=>{const m=STATUS[id].min??C.minTalkSec[STATUS[id].cls];return !m||(dur!=null&&dur>=m)};
export const bossState=s=>{const t=districtThr(s.district),f=s.dxp/t;return f<1-C.bossPhaseShare?'scenery':s.dxp>=t-1&&s.district>=C.finishFromDistrict?'finish':'boss'};
