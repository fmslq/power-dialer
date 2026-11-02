import {newState,apply,undo,pause,resume,talkBonus,bossState} from './engine.js';
import {CONFIG as C,districtThr} from './config.js';
const R=[],t=(n,f)=>{try{R.push([n,!!f()])}catch(e){R.push([n+' ('+e.message+')',false])}},S=1000;
const run=(ids,gaps)=>{const s=newState(0);let n=0;ids.forEach((id,i)=>{n+=(gaps[i]??30)*S;apply(s,id,n)});return[s,n]};
export function runTests(){R.length=0;
 t('heat x1.25 на 4-м',()=>run([0,0,0,0],[]).at(0).step===1);
 t('heat x1.5 на 10-м',()=>run(Array(10).fill(0),[]).at(0).step===2);
 t('heat x2.0 на 20-м',()=>run(Array(20).fill(0),[]).at(0).step===3);
 t('срыв окна: ступень вниз, серия=порог',()=>{const[s]=run(Array(21).fill(0),Array(21).fill(30).map((v,i)=>i==20?100:v));return s.step===2&&s.streak===10});
 t('CRM-надбавка: после TALK 120с ок',()=>{const[s]=run([2,0,0,0,0],[30,120,30,30,30]);return s.streak===5});
 t('>40 мин: сброс',()=>{const[s]=run([0,0,0,0,0],[30,30,30,30,2500]);return s.streak===1&&s.step===0});
 t('антиспам: 50% и серия не растёт',()=>{const s=newState(0);apply(s,4+0,1000);const a=s.xp,e=apply(s,0,2000);return e.spam&&s.streak===1});
 t('Ульта: 5 статусов на x2.0 после BOOKED',()=>{const s=newState(0);apply(s,4,30*S);const e=apply(s,0,1000*S);return e.mult.m===2&&s.ulta===4});
 t('Ульта сгорает >40 мин',()=>{const s=newState(0);apply(s,4,30*S);apply(s,0,3000*S);return s.ulta===0});
 t('Overdrive на 25-й серии',()=>{const[s]=run(Array(25).fill(0),[]);return !!s.od});
 t('OD: TALK $x3, мусор x2',()=>{const[s,n]=run(Array(25).fill(0),[]);const a=apply(s,2,n+30*S),b=apply(s,0,n+60*S);return a.mult.m===3&&b.mult.m===2});
 t('Undo (full) возвращает всё',()=>{const s=newState(0);apply(s,0,30*S);const snap=JSON.stringify([s.xp,s.money,s.streak]);apply(s,4,60*S);undo(s,70*S);return JSON.stringify([s.xp,s.money,s.streak])===snap});
 t('Undo старого: только ресурсы',()=>{const s=newState(0);apply(s,0,30*S);apply(s,0,60*S);apply(s,0,90*S);const st=s.streak;undo(s,500*S,0);return s.streak===st&&s.xp>0});
 t('пауза >10 мин сбрасывает серию',()=>{const s=newState(0);apply(s,0,30*S);apply(s,0,60*S);pause(s,70*S);resume(s,900*S);return s.streak===0});
 t('пауза короткая сдвигает окна',()=>{const s=newState(0);apply(s,0,30*S);pause(s,40*S);resume(s,340*S);const e=apply(s,0,360*S);return !e.pen});
 t('бонус времени: 120с = 2 интервала',()=>{const s=newState(0),e=apply(s,3,30*S),u=s.undo[0],b=talkBonus(s,u,120);return b.x===7&&b.m===5});
 t('бонус времени не для мусора',()=>{const s=newState(0);apply(s,0,30*S);return talkBonus(s,s.undo[0],600).x===0});
 t('OD не перезапускается сразу',()=>{const s=newState(0);let n=0;for(let i=0;i<25;i++)apply(s,0,(n+=30)*S);apply(s,0,(n+=500)*S);let st=0;for(let i=0;i<10;i++){if(apply(s,0,(n+=30)*S).odStart)st++}return st===0});
 t('район 1 захватывается и открывает 2',()=>{const s=newState(0);s.dxp=districtThr(1)-5;apply(s,0,30*S);return s.district===2&&s.dxp===3});
 t('босс: мусор IMMUNE, добивает TALK',()=>{const s=newState(0);s.district=3;s.dxp=districtThr(3)-1;const e=apply(s,0,30*S);const f=bossState(s)==='finish';apply(s,2,60*S);return e.immune&&f&&s.district===4});
 t('босс-фаза с 90%',()=>{const s=newState(0);s.district=3;s.dxp=districtThr(3)*.92;return bossState(s)==='boss'});
 return R}
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('tests.js')){const r=runTests();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL')}
import {resolveKey} from './hotkeys.js';
export function runKeyTests(){const o=[],t=(n,f)=>o.push([n,!!f()]),k=(c,x)=>resolveKey({menu:false,...c},x);
 t('Space/Enter звонят',()=>k({},'Space').a==='dial'&&k({},'Enter').a==='dial');
 t('Enter подтверждает подсказку',()=>{const r=k({suggest:7},'Enter');return r.a==='status'&&r.id===7});
 t('T без меню = шпаргалка, в меню = DISCOVERY',()=>k({},'KeyT').a==='pad'&&k({menu:true},'KeyT').id===14);
 t('1..6 и 7 8 9 0 Q W E R = статусы',()=>['Digit1','Digit6','Digit7','Digit0','KeyQ','KeyR'].every((x,i)=>k({},x).a==='status')&&k({},'Digit5').id===4&&k({},'KeyR').id===13);
 t('S Z X P / M N',()=>['S','Z','X','P','M','N'].every(x=>k({},'Key'+x).a)&&k({},'Slash').a==='picker');
 t('при вводе текста горячие клавиши молчат',()=>k({typing:true},'Digit1')===null&&k({typing:true},'Escape').a==='blur');
 return o}
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('tests.js')){const r=runKeyTests();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL (keys)')}
import {runMetaTests} from './meta.js';
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('tests.js')){const r=runMetaTests();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL (meta)')}
import {bagPick,pickPool,stateOf} from './music.js';
export function runMusicTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('shuffle-bag: все по разу, без повтора подряд на границе',()=>{const all=['a','b','c'],bag=[],seen=[];let last=null;for(let i=0;i<9;i++){last=bagPick(bag,all,last);seen.push(last)}return seen.slice(0,3).sort().join()==='a,b,c'&&seen.every((x,i)=>i===0||x!==seen[i-1])});
 t('пул: свой → calm той же темы → любой по состоянию → любой',()=>{const p={'neon/calm':[1],'industrial/action':[2]};return pickPool(p,'neon','action')==='neon/calm'&&pickPool(p,'blackgold','action')==='industrial/action'&&pickPool({},'neon','calm')===null});
 t('состояния музыки',()=>stateOf({paused:1})==='standby'&&stateOf({od:1})==='overdrive'&&stateOf({step:2})==='action'&&stateOf({step:0})==='calm');
 return o}
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('tests.js')){const r=runMusicTests();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL (music)')}
