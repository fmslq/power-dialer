// E5 v2 / библия §6.1: исход каждого босса — свой. Где-то выбор из двух или трёх, где-то один итог,
// где-то итог зависит от твоих прошлых решений или от того, как ты играл в районе, где-то награда приходит позже.
// Сохранение: save.story.ch['b'+d] = id варианта. Старые сохранения ('ally' / 'trophy') читаются через legacy.
import {CONFIG as C,shiftMoneyAt} from './config.js';
import {bossState} from './engine.js';
import {DIST,SHOP_ITEMS} from './meta.js';
import {DEFECT} from '../story/systems.js';
const chs=save=>((save.story||(save.story={})).ch||(save.story.ch={}));
export const choiceOf=(save,d)=>chs(save)['b'+d]||null;
export const shiftMoney=(d,k)=>Math.round(k*shiftMoneyAt(d));
export const showpieceOf=d=>SHOP_ITEMS.find(x=>x.district===d&&x.tk==='s');
export const DISC=.3;
// дневные слоты Лоббиста (час местного времени игрока)
export const SLOTS={am:[8,12,'утром (8:00–12:00)'],mid:[12,16,'днём (12:00–16:00)'],pm:[16,21,'вечером (16:00–21:00)']};
// eff: x/m — % к XP/$ класса; xAll/mAll — % ко всему; bossX — % XP класса в фазе босса; fast — +с окна серии; odSec; spamK; maxGap;
//      slot — +% XP в часы слота; from — бонус работает с района N; money — доля смены сразу; disc — {itemId:доля}; purgeK — множитель Ночной чистки
// kind: one — один итог; two/three — выбор; cond — итог решает условие; late — награда позже
export const OUT={
 1:{kind:'one',why:'Королю нечего продать и нечего терять. Он просто хотел, чтобы ему позвонили.',opts:[
  {id:'crown',ally:1,t:'Принять гарнитуру',s:'Король отдаёт старую гарнитуру телефонистки с биркой «В.» и становится смотрителем свалки.',eff:{x:{TRASH:3,GATEKEEPER:3}},b:'+3% XP за TRASH и GATEKEEPER'}]},
 2:{kind:'two',why:'Ржавый держит проходную и журнал пропусков. Отдать можно что-то одно.',opts:[
  {id:'gate',ally:1,t:'Оставить проходную открытой',s:'Ржавый пускает всех, кто от тебя. И помогает с антенной для порта.',eff:{bossX:{GATEKEEPER:50}},b:'XP за GATEKEEPER в фазе босса ×1.5 · антенна для порта без денег'},
  {id:'log',t:'Забрать журнал проходной',s:'Лом скупит журнал. В нём есть одна странная строка о той ночи.',eff:{money:.5,disc:{d2t2:DISC}},b:'примерно полсмены денег этого района сразу · −30% на showpiece района'}]},
 3:{kind:'three',why:'Контрабандист торгует чужими номерами. У него три предложения, и одно из них — грязное.',opts:[
  {id:'free',ally:1,t:'Отпустить',s:'Он уходит в туман и иногда прокладывает тебе провод.',eff:{fast:5},b:'+5 с к окну серии'},
  {id:'mask',t:'Взять маску',s:'Подменный номер. Владельцы чаще дослушивают незнакомца.',eff:{m:{TALK:8}},b:'+8% денег за TALK'},
  {id:'sell',t:'Сдать его Совету',s:'Совет платит щедро. Но Совет запомнит, что ты умеешь сдавать.',eff:{money:1},b:'примерно смена денег этого района сразу · последствия в районе 7'}]},
 4:{kind:'late',why:'Хозяин Рынка двадцать лет держит одну линию на удержании. Он просит подержать её за него.',opts:[
  {id:'hold',ally:1,t:'Держать линию',s:'Сейчас ничего. Хозяин вернётся, когда ты пройдёшь Хром-Плазу.',eff:{m:{CALLBACK:20},from:7},b:'с района 7: CALLBACK +20% денег'},
  {id:'drop',t:'Сбросить линию',s:'Хозяин пожимает плечами и платит за свободную линию.',eff:{money:.5},b:'примерно полсмены денег этого района сразу'}]},
 5:{kind:'cond',why:'Менеджер уважает только назначенные встречи. Итог зависит от того, сколько встреч ты назначил в этом районе.',need:3,opts:[
  {id:'deal',ally:1,t:'Менеджер остаётся',s:'Ты назначал встречи — и он это видел. Он отдаёт тебе неотправленное письмо.',eff:{m:{BOOKED:5}},b:'+5% денег за BOOKED'},
  {id:'mail',t:'«Пришлю на почту»',s:'Встреч было мало. Менеджер присылает письмо и маленький чек.',eff:{money:.3},b:'примерно треть смены денег этого района сразу'}]},
 6:{kind:'three',why:'Лоббист живёт по календарю. Он даёт тебе одно окно в сутках — выбери, когда ты звонишь лучше всего.',opts:[
  {id:'am',ally:1,t:'Утро',s:'Он переносит все свои встречи на после обеда.',eff:{slot:['am',10]},b:'+10% XP утром (8:00–12:00)'},
  {id:'mid',ally:1,t:'День',s:'Он отдаёт тебе обеденный перерыв всего района.',eff:{slot:['mid',10]},b:'+10% XP днём (12:00–16:00)'},
  {id:'pm',ally:1,t:'Вечер',s:'Он задерживает охрану до девяти.',eff:{slot:['pm',10]},b:'+10% XP вечером (16:00–21:00)'}]},
 7:{kind:'two',why:'Аудитор хранит каждое слово города. В архиве не хватает одного звонка.',opts:[
  {id:'open',ally:1,t:'Открыть архив городу',s:'Все узнают, что один звонок стёрли. И кто его стёр.',eff:{xAll:5},b:'+5% XP ко всем звонкам'},
  {id:'wipe',t:'Стереть своё досье',s:'Совет теряет твой след. ARCHON ищет тебя хуже.',eff:{purgeK:.5},b:'Ночная чистка забирает вдвое меньше'},
  {id:'snitch',need:'b3:sell',t:'Продать досье Контрабандиста',s:'Аудитор знает, что ты уже сдавал. Он платит за повтор.',eff:{money:1},b:'примерно смена денег этого района · Гудок это запомнит'}]},
 8:{kind:'two',why:'Хранилище обещаний. Внутри золото — и то, что Совет прятал двадцать лет.',opts:[
  {id:'city',ally:1,t:'Открыть хранилище городу',s:'Окна в районах горят ярче. Банкир впервые улыбается.',eff:{mAll:3},b:'+3% денег ко всему · влияет на Высоты'},
  {id:'gold',t:'Забрать золото',s:'Много денег. Банкир молчит. Наверху это услышат.',eff:{money:1.5},b:'примерно полторы смены денег этого района сразу · влияет на Высоты'}]},
 9:{kind:'cond',why:'Барон смотрит на город сверху. Что он увидит, решил твой выбор в Шпиле.',dep:'b8',opts:[
  {id:'down',ally:1,t:'Барон спускается',s:'Хранилище открыто — свет дошёл до Высот. Барон спускается к людям.',eff:{odSec:30},b:'Overdrive +30 с'},
  {id:'flee',t:'Барон улетает',s:'Ты забрал золото. Барон забирает лифт и улетает. Его вертолётная площадка — твоя по дешёвке.',eff:{disc:{d9t2:.5}},b:'−50% на showpiece Высот · Барон ещё появится'}]},
 10:{kind:'two',why:'Адмирал держит частоты эфира. Ему можно вернуть эфир или забрать одну частоту.',opts:[
  {id:'air',ally:1,t:'Вернуть ему эфир',s:'Он ждёт твоих звонков дольше всех.',eff:{maxGap:50},b:'перерыв до сброса серии 50 мин вместо 40'},
  {id:'freq',t:'Забрать частоту',s:'Лом знает, кому продать частоту.',eff:{money:.5,disc:{d10t2:DISC}},b:'примерно полсмены денег этого района сразу · −30% на showpiece района'}]},
 11:{kind:'two',why:'Станция зовёт Гудка домой. Решает не босс. Решаешь ты — вместе с ним.',opts:[
  {id:'go',ally:1,t:'«Иди»',s:'Гудок становится голосом всей сети. В гараже станет тише.',eff:{mAll:5},b:'+5% денег ко всему'},
  {id:'stay',ally:1,t:'«Останься»',s:'Гудок остаётся в ЭЛТ. Город просыпается чуть медленнее, но лампа горит.',eff:{xAll:5},b:'+5% XP ко всем звонкам'}]}};
const LEGACY={ally:o=>o.opts.find(x=>x.ally),trophy:()=>null};
export const optOf=(save,d)=>{const v=choiceOf(save,d),o=OUT[d];if(!v||!o)return null;return o.opts.find(x=>x.id===v)||(LEGACY[v]?LEGACY[v](o):null)};
// какие варианты доступны (условие need: 'b3:sell' — только если в районе 3 выбран sell)
export const optsFor=(save,d)=>{const o=OUT[d];if(!o)return[];return o.opts.filter(x=>!x.need||(()=>{const[k,v]=x.need.split(':');return chs(save)[k]===v})())};
// для cond: какой итог выпадает
export function condPick(save,d){const o=OUT[d];if(!o||o.kind!=='cond')return null;
 if(o.dep){const p=optOf(save,8);return p&&p.id==='city'?o.opts[0]:o.opts[1]}
 const r=((save.story.dc||{})[d]);if(!r)return o.opts[0];   // район пройден до учёта (старое сохранение) — в пользу игрока
 return r.met>=o.need?o.opts[0]:o.opts[1]}
// счёт встреч по районам для «cond» (вызывается после статуса)
export function allyTrack(save,G,ev){if(!ev)return;const st=save.story||(save.story={}),dc=st.dc||(st.dc={}),x=dc[G.district]||(dc[G.district]={n:0,met:0});x.n++;if(['BOOKED','DISCOVERY'].includes(ev.cls))x.met++}
export function pendingChoice(save,G){const cap=(save.meta&&save.meta.captured)||{};for(let d=1;d<=11;d++){if((cap[d]||G.district>d)&&!choiceOf(save,d))return d}return null}
export function choose(save,G,d,id){if(choiceOf(save,d))return{ok:false,why:'уже выбрано'};const o=OUT[d];if(!o)return{ok:false,why:'нет выбора'};
 // совместимость со старыми вызовами: 'ally' — первый вариант-союзник, 'trophy' — первый вариант с деньгами
 let opt=o.kind==='cond'||o.kind==='one'?(o.kind==='one'?o.opts[0]:condPick(save,d)):optsFor(save,d).find(x=>x.id===id)||(id==='ally'?o.opts.find(x=>x.ally):id==='trophy'?o.opts.find(x=>x.eff.money):null);
 if(!opt)return{ok:false,why:'нет варианта'};chs(save)['b'+d]=opt.id;const e=opt.eff,r={ok:true,opt,d};
 if(e.money){r.money=shiftMoney(d,e.money);G.money+=r.money}
 {const df=DEFECT[d];if(df&&df.opt===opt.id){const ad=save.ad||(save.ad={}),op=ad.ops||(ad.ops={rooms:0,n:0}),L=op.def||(op.def=[]);if(!L.some(x=>x.nm===df.nm))L.push({nm:df.nm,b:df.b,d});r.def=df.nm}}
 if(e.disc){save.meta=save.meta||{};const dc=save.meta.disc||(save.meta.disc={});for(const[k,v]of Object.entries(e.disc))dc[k]=Math.max(dc[k]||0,v);r.disc=e.disc}
 return r}
export const allyCount=save=>{let n=0;for(let d=1;d<=11;d++){const p=optOf(save,d);if(p&&p.ally)n++}return n};
export const allyDistricts=save=>{const o=[];for(let d=1;d<=11;d++){const p=optOf(save,d);if(p&&p.ally)o.push(d)}return o};
export const purgeK=save=>{let k=1;for(let d=1;d<=11;d++){const p=optOf(save,d);if(p&&p.eff.purgeK)k*=p.eff.purgeK}return k};
// модификаторы исходов (поверх директивы и предметов, до Addiction)
export function withAllies(mods,save,G,now=Date.now()){const r={...mods,x:{...(mods.x||{})},m:{...(mods.m||{})}};const boss=G&&bossState(G)==='boss',hr=new Date(now).getHours();
 for(let d=1;d<=11;d++){const p=optOf(save,d);if(!p)continue;const a=p.eff;if(a.from&&(!G||G.district<a.from))continue;
  for(const[k,v]of Object.entries(a.x||{}))r.x[k]=(r.x[k]||1)*(1+v/100);for(const[k,v]of Object.entries(a.m||{}))r.m[k]=(r.m[k]||1)*(1+v/100);
  if(boss)for(const[k,v]of Object.entries(a.bossX||{}))r.x[k]=(r.x[k]||1)*(1+v/100);
  if(a.xAll)r.xAll=(r.xAll||1)*(1+a.xAll/100);if(a.mAll)r.mAll=(r.mAll||1)*(1+a.mAll/100);
  if(a.slot){const[s0,s1]=SLOTS[a.slot[0]];if(hr>=s0&&hr<s1)r.xAll=(r.xAll||1)*(1+a.slot[1]/100)}
  if(a.fast)r.fast=(r.fast||0)+a.fast;if(a.odSec)r.odSec=(r.odSec||0)+a.odSec;
  if(a.spamK)r.spamK=Math.max(r.spamK||0,a.spamK);if(a.maxGap)r.maxGap=Math.max(r.maxGap||0,a.maxGap)}
 return r}
export const priceFor=(save,it)=>Math.round(it.price*(1-(((save.meta||{}).disc||{})[it.id]||0)));
export const bossName=d=>DIST[d-1][3];
// совместимость: старое имя
export const trophyMoney=d=>shiftMoney(d,.5);
