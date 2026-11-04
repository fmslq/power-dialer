import {CONFIG as C} from './config.js';
// История по дням (root.days) + накопительные счётчики (root.life): основа Dominance, рангов, ачивок. Хранится вечно.
const PITCH=[3,4,14];   // J1: как PITCH_IDS в addict.js
const p2=n=>String(n).padStart(2,'0'),DAY=864e5;
export const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
export const isWork=t=>{const g=new Date(t).getDay();return g>0&&g<6};
export const RANKS=[[0,'Nobody'],[100,'Rookie'],[250,'Enforcer'],[400,'Syndicate Boss'],[650,'Apex Predator']];
// кусок 19: ранг даёт постоянный % к XP и $ (пока держишь ранг): Nobody, Rookie, Enforcer, Syndicate Boss, Apex Predator
export const RANK_BONUS=[0,3,6,10,15];
export const LEVELS=[[0,'Cold Caller Noob'],[1500,'Dial Tone Apprentice'],[5e3,'Voicemail Whisperer'],[12e3,'Gatekeeper Slayer'],[25e3,'Pickup Hunter'],[45e3,'Objection Handler'],[75e3,'Closer Trainee'],[12e4,'Deal Maker'],[18e4,'Corporate Raider'],[26e4,'Market Shark'],[36e4,'Syndicate Boss'],[48e4,"Founder's Champion"],[65e4,'Titan of Industry'],[85e4,'Cold-Call Demigod'],[11e5,'Reliance Legend']];
const life=r=>r.life||(r.life={calls:0,gk:0,booked:0,disc:0,since:0,spent:0});
export function record(root,e,now,streak){if(e.spam)return null;const days=root.days||(root.days={}),k=dayKey(now),d=days[k]||(days[k]={n:0,pts:0,xp:0,money:0,c:{},od:0,first:now,last:now});
 d.n++;if(PITCH.includes(e.sid))d.p=(d.p||0)+1;d.pts+=C.classes[e.cls].pts;d.xp+=e.x;d.money+=e.m;d.c[e.cls]=(d.c[e.cls]||0)+1;d.last=now;if(e.odStart)d.od++;d.hs=Math.max(d.hs||0,e.step||0);d.bs=Math.max(d.bs||0,streak||0);
 const hr=new Date(now).getHours();d.h=d.h||{};d.h[hr]=(d.h[hr]||0)+1;   // тепловая карта часов (вкладка ДОСЬЕ)
 const L=life(root);L.calls++;if(e.cls==='GATEKEEPER')L.gk++;if(e.cls==='DISCOVERY')L.disc++;if(e.cls==='BOOKED'){L.booked++;L.since=0}else L.since++;
 const R=root.recent||(root.recent=[]);R.push(e.cls);if(R.length>20)R.shift();return d}
export function unrecord(root,u){const d=root.days&&root.days[dayKey(u.rt||u.t)];if(!d||!u.cls)return;d.n=Math.max(0,d.n-1);d.pts=Math.max(0,d.pts-C.classes[u.cls].pts);d.xp-=u.x;d.money-=u.m;d.c[u.cls]=Math.max(0,(d.c[u.cls]||0)-1);if(PITCH.includes(u.id)&&d.p)d.p--;if(d.h){const hr=new Date(u.rt||u.t).getHours();if(d.h[hr])d.h[hr]--}
 const L=life(root);L.calls=Math.max(0,L.calls-1);if(u.cls==='GATEKEEPER')L.gk--;if(u.cls==='BOOKED')L.booked--;if(u.cls==='DISCOVERY')L.disc--}
// Окно Dominance: сегодня + предыдущие дни, пока не набрано 3 рабочих (выходные внутри окна считаются, если там звонили)
export function window3(now){const keys=[];let w=0,t=now;for(let i=0;i<14&&w<3;i++,t-=DAY){keys.push(dayKey(t));if(isWork(t))w++}return keys}
export function dominance(root,now){const ks=window3(now),days=root.days||{};const pts=ks.reduce((a,k)=>a+(days[k]?days[k].pts:0),0);
 const idle=ks.filter(k=>{const[y,m,d]=k.split('-');return isWork(new Date(+y,m-1,+d,12))}).every(k=>!(days[k]&&days[k].n));return{pts,idle,keys:ks}}
export const rankOf=pts=>RANKS.reduce((r,x,i)=>pts>=x[0]?i:r,0);
export const levelOf=xp=>LEVELS.reduce((r,x,i)=>xp>=x[0]?i:r,0);
export const nextRank=pts=>{const i=rankOf(pts);return i<RANKS.length-1?{name:RANKS[i+1][1],left:RANKS[i+1][0]-pts}:null};
export function ironWeek(root,now){let t=now,n=0,days=root.days||{};const ok=t=>(days[dayKey(t)]||{n:0}).n>=100;if(isWork(t)&&!ok(t))t-=DAY;
 for(let i=0;i<30;i++,t-=DAY){if(!isWork(t))continue;if(ok(t))n++;else break}return n}
