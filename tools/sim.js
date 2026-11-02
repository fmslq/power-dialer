import {newState,apply,talkBonus} from '../js/engine.js';
import {CONFIG as C,districtThr} from '../js/config.js';
// классы -> id статуса; смесь из раздела 15: 45 мусор, 20 GK, 22 TALK, 6 CB, 5 minor, 1 booked, 0.1 disc
const MIX=[[0,45],[5,20],[2,11],[3,11],[12,6],[6,5],[4,1],[14,.1]],TOT=MIX.reduce((a,b)=>a+b[1],0);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,pick=()=>{let r=rnd()*TOT;for(const[i,w]of MIX){if((r-=w)<=0)return i}return 0};
const SC={lazy:{n:60,fast:.78},iron:{n:100,fast:.9},hard:{n:150,fast:.93},record:{n:211,fast:.95}};
console.log('сценарий | XP/день | $/день | отклонение дней на район (цель 3500 XP) | OD/день');
for(const[k,c]of Object.entries(SC)){let X=0,M=0,OD=0,BX=0,D=2000;
 for(let d=0;d<D;d++){const s=newState(0);let t=0;for(let i=0;i<c.n;i++){const id=pick();
   const prev=s.lastCls,ok=rnd()<c.fast;t+=ok?(20+rnd()*35):(65+rnd()*200);if(prev==='TALK'||prev==='CALLBACK')t+=ok?rnd()*100:0;
   const e=apply(s,id,t*1000,{});if(e.odStart)OD++;if(e.cls==='TALK'||e.cls==='CALLBACK'||e.cls==='BOOKED'||e.cls==='DISCOVERY'){const r=rnd(),dur=r<.7?15+rnd()*35:r<.9?60+rnd()*120:r<.98?180+rnd()*300:480+rnd()*420;if(dur>=15){const b=talkBonus(s,s.undo[s.undo.length-1],dur);BX+=b.x}}s.district=1;s.dxp=0;s.carry=0}
  X+=s.xp;M+=s.money}
 const x=X/D,m=M/D;console.log(k.padEnd(8),'|',Math.round(x),'|',Math.round(m),'|',((3500/x-1)*100).toFixed(0)+'%','|',(OD/D).toFixed(2),'| бонус',(BX/X*100).toFixed(1)+'%')}
