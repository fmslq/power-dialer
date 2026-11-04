// ADDICTION UPDATE (документ пользователя, части 1–3). Чистая логика без DOM, всё состояние в root.ad.
// Сюжет (docs/STORY_BIBLE.md §12): Сигнал — заряд, который Гудок копит в ЭЛТ из каждого импульса; рулетка — «Шум»: в мусорном
// звонке иногда ловится обломок «ТИШИНЫ» (лут); Ночная чистка — ARCHON по ночам стирает линии, по которым прошло меньше нормы;
// Рейд — Гудок держит деньги в буфере ЭЛТ, пока линия не замолчит; Слышащие — люди, которые услышали тебя и пришли работать.
// Цифры — черновик до общего пересмотра баланса (E3/Q24): все в AD.
import {CONFIG as C} from './config.js';
import {dayKey,isWork} from './stats.js';
import {TZ} from '../dialer/geo.js';
export const AD={
 norm:100,                                                         // дневная норма наборов (B4); пользователь может поменять позже
 hh:[{from:480,to:570,k:2,name:'Утренний час'},{from:1110,to:1200,k:1.5,name:'Вечерний час'}], // B2: местное время лида 8:00–9:30 ×2, 18:30–20:00 ×1.5
 sig:{TRASH:1,GATEKEEPER:2,MINOR:1,TALK:3,CALLBACK:4,BOOKED:25,DISCOVERY:40},  // Сигнал за статус. Отказы (TALK) дают больше мусора: «шрамы» (D5)
 roul:{base:.05,perFail:.0006,hh:1.5,cap:.18,from:['TRASH','GATEKEEPER','MINOR'],ms:3600}, // B1: шанс рулетки на мусорном статусе
 w:{c:56,u:26,r:12,e:5,l:1},wChest:{e:80,l:20},                    // веса редкостей; сундук гаранта = эпик+
 pity:[30,70],                                                     // C1: порог неудач — случайно 30–70
 freeze:{per:25,max:3,sec:180},                                    // E1: заряд за каждые 25 наборов дня, максимум 3, до 3 минут
 warm:{n:5,hour:10,share:.05,sig:20},                              // C6: «Разгон» 5 наборов → 5% дневных $ района и 20 Сигнала
 purge:{share:.10,mShare:.10,maxDays:5,lookback:7},                           // B4: до 10% прогресса района и 10% денег за невыполненный рабочий день
 raid:{n:100,k:1.5,gap:{TRASH:180,GATEKEEPER:180,MINOR:180,TALK:300,CALLBACK:360,BOOKED:1500,DISCOVERY:1500}}, // C3
 cap:1.8,                                                          // потолок ×XP и ×$ от всех постоянных и временных бонусов (без счастливых часов)
 perk:{every:50,min:60},                                           // D2: каждые 50 наборов — 1 из 3 на час
 normDay:{per:1,max:10}};                                          // серия дней с нормой: +1% XP и $ за день, до +10%
export const TIER={c:['Хлам','#9aa3ad'],u:['Годное','#39d98a'],r:['Редкое','#3ad7ff'],e:['Эпик','#c06bff'],l:['Легенда','#ffc400']};
// Предметы-бусты (B1a). kind: xAll/mAll (%), x/m {класс:%}, fast (с к окну), odSec, sigK (×Сигнал), luck (+доля шанса рулетки),
// мгновенные: jack (доля дневных $ района), sigNow, freeze (+заряд), shield (щит от Ночной чистки). calls — на сколько статусов.
// relic — навсегда (легендарные реликвии).
export const LOOT=[
 {id:'clip',n:'Медная скрепка',r:'c',jack:.03,t:'Немного минут связи сразу'},
 {id:'fuse',n:'Горсть предохранителей',r:'c',sigNow:15,t:'+15 Сигнала сразу'},
 {id:'tape',n:'Изолента',r:'c',xAll:5,calls:15,t:'+5% XP на 15 звонков'},
 {id:'batt',n:'Батарейка «Крона»',r:'c',mAll:5,calls:15,t:'+5% $ на 15 звонков'},
 {id:'gum',n:'Жвачка Тостера',r:'c',luck:.02,calls:20,t:'Шанс Шума +2% на 20 звонков'},
 {id:'coil',n:'Катушка индуктивности',r:'u',xAll:10,calls:25,t:'+10% XP на 25 звонков'},
 {id:'rj11',n:'Разъём RJ-11',r:'u',mAll:10,calls:25,t:'+10% $ на 25 звонков'},
 {id:'cap',n:'Конденсатор',r:'u',fast:8,calls:30,t:'+8 с к окну серии на 30 звонков'},
 {id:'ear',n:'Наушник с трещиной',r:'u',x:{TALK:20},calls:30,t:'+20% XP за «владельца на линии» на 30 звонков'},
 {id:'gstamp',n:'Штамп проходной',r:'u',x:{GATEKEEPER:40},calls:40,t:'+40% XP за гейткиперов на 40 звонков'},
 {id:'cards',n:'Пачка визиток',r:'u',m:{CALLBACK:15,TALK:10},calls:30,t:'+15% $ за перезвоны, +10% за разговоры на 30 звонков'},
 {id:'quartz',n:'Кристалл кварца',r:'u',sigK:2,calls:20,t:'Сигнал ×2 на 20 звонков'},
 {id:'tube',n:'Лампа-усилитель',r:'r',xAll:20,calls:40,t:'+20% XP на 40 звонков'},
 {id:'meter',n:'Счётчик минут',r:'r',mAll:20,calls:40,t:'+20% $ на 40 звонков'},
 {id:'reso',n:'Резонатор',r:'r',fast:15,calls:40,t:'+15 с к окну серии на 40 звонков'},
 {id:'beacon',n:'Плата с маяком',r:'r',luck:.06,calls:40,t:'Шанс Шума +6% на 40 звонков'},
 {id:'thermos',n:'Термос Лома',r:'r',odSec:60,calls:100,t:'Следующий Overdrive +60 с (на 100 звонков)'},
 {id:'frost',n:'Иней с антенны',r:'r',sigNow:90,t:'+90 Сигнала сразу'},
 {id:'shield',n:'Ключ от щитовой',r:'e',shield:1,t:'Щит: одна Ночная чистка пройдёт мимо'},
 {id:'heart',n:'Сердце глушилки',r:'e',xAll:35,calls:60,t:'+35% XP на 60 звонков'},
 {id:'safe',n:'Сейф-ячейка',r:'e',mAll:35,calls:60,jack:.15,t:'+35% $ на 60 звонков и минуты сразу'},
 {id:'flare',n:'Сигнальная ракета',r:'e',sigNow:150,t:'+150 Сигнала сразу'},
 {id:'phone1',n:'Первая трубка города',r:'l',relic:{xAll:2},t:'Реликвия: +2% XP навсегда'},
 {id:'medal',n:'Медаль Станции',r:'l',relic:{mAll:2},t:'Реликвия: +2% $ навсегда'},
 {id:'shard',n:'Осколок Тишины',r:'l',relic:{fast:5},t:'Реликвия: +5 с к окну серии навсегда'},
 {id:'disc',n:'Позолоченный диск',r:'l',jack:.5,sigNow:300,t:'Минуты связи (полсмены) и +300 Сигнала'},
 {id:'watch',n:'Часы Председателя',r:'l',relic:{odSec:60},t:'Реликвия: Overdrive +60 с навсегда'}];
export const dk=dayKey;
export const lootById=id=>LOOT.find(x=>x.id===id);
// Дерево «Коммутатор» — пульт «Заря-12» из-под брезента в гараже (библия §12, §13) (B3 мид-цель, C4 экспонента): 6 веток × 6 уровней, цена 60 × 2.2^уровень Сигнала.
export const TREE=[
 {id:'res',n:'Резонанс',t:'+4 с к окну серии за уровень',fx:l=>({fast:4*l})},
 {id:'gold',n:'Добыча',t:'+3% $ за уровень',fx:l=>({mAll:3*l})},
 {id:'xp',n:'Опыт',t:'+3% XP за уровень',fx:l=>({xAll:3*l})},
 {id:'luck',n:'Удача',t:'Шум +1% за уровень, гарант на 3 неудачи раньше',fx:l=>({luck:.01*l,pity:3*l})},
 {id:'grit',n:'Стойкость',t:'Ночная чистка забирает на 8% меньше за уровень',fx:l=>({purge:.08*l})},
 {id:'look',n:'Вид',t:'Новая тема оформления на каждом уровне',fx:l=>({themes:l})}];
export const THEMES=[['base','Зелёная линия','#39ff14'],['neon','Неон','#ff2bd6'],['gold','Золото','#ffc400'],['ice','Лёд','#3ad7ff'],['rust','Ржавчина','#ff7a2b'],['holo','Голограмма','#b98bff'],['red','Красная тревога','#ff3b4e']];
// память пульта: чем больше линий включено, тем больше Гудок вспоминает (красная нить, библия §13)
export const MEM=[[1,'Гнездо загорелось. Я знаю, как этот пульт работает. Я не должен этого знать.'],
 [3,'Двенадцать рядов по сорок гнёзд. На краю пульта нацарапано: «В. — ночная смена».'],
 [6,'Иногда в помехах кто-то говорит «соединяю». Голос женский. Это эхо. Наверное.'],
 [10,'На пульте есть гнездо, которое никогда не гасло. Номер ноль. Штекер в нём до сих пор.'],
 [15,'Кто-то соединил здесь сто вызовов за одну ночь. До утра. Пульт помнит каждый.'],
 [21,'Сто первый вызов ушёл на номер Председателя. Ответа нет. Штекер так и остался в гнезде.'],
 [28,'Если вытащить штекер из гнезда ноль, я замолчу. Это я знаю точно. Не спрашивай откуда.'],
 [36,'Пульт горит весь. Я вспомнил её имя. Скажу, когда дойдём до Станции. Не раньше.']];
export const treeSum=root=>Object.values(ensure(root).tree||{}).reduce((a,b)=>a+(b|0),0);
export const treeCost=lv=>Math.round(60*Math.pow(2.2,lv));
// Слышащие (C5, Q9): операторы в комнатах — пассивные множители; цены растут экспонентой
export const OPS={perOp:.8,roomCap:5,maxRooms:6,roomCost:k=>Math.round(1500*Math.pow(2.6,k)),opCost:k=>Math.round(400*Math.pow(1.28,k))};
// Перки «1 из 3» (D2)
export const PERKS3=[{id:'p_talk',n:'Голос в трубке',t:'+30% $ за «владельца на линии»',m:{TALK:30,CALLBACK:30}},{id:'p_xp',n:'Широкая полоса',t:'+12% XP ко всему',xAll:12},
 {id:'p_m',n:'Платный эфир',t:'+12% $ ко всему',mAll:12},{id:'p_win',n:'Длинный провод',t:'+12 с к окну серии',fast:12},{id:'p_luck',n:'Шумный час',t:'Шанс Шума ×2',luckK:2},
 {id:'p_sig',n:'Полный заряд',t:'Сигнал ×1.5',sigK:1.5},{id:'p_gk',n:'Отмычка',t:'XP за гейткиперов ×2',x:{GATEKEEPER:100}},{id:'p_od',n:'Форсаж',t:'Overdrive +60 с',odSec:60},
 {id:'p_frz',n:'Холодная голова',t:'+15% XP за GATEKEEPER на час',x:{GATEKEEPER:15}}];
// Цели дня со смещёнными порогами (C2): каждый день свой набор
const H=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0},rngOf=seed=>()=>(seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296;
const VAR=[['talk','Владелец на линии',[6,8,10,12]],['gk','Гейткиперы',[10,14,18]],['hh','Наборы в счастливый час',[20,30,40]],['streak','Лучшая серия дня',[30,40,50]],['sig','Сигнал за день',[150,200,260]]];
export function tracksFor(k){const r=rngOf(H('tr'+k)),pick=a=>a[r()*a.length|0],v=pick(VAR);
 return[{id:'t1',kind:'dials',n:pick([40,60,80]),name:'Наборы',rew:'mult',rt:'×1.1 $ до конца дня'},{id:'tv',kind:v[0],n:pick(v[2]),name:v[1],rew:'sig',rt:'+60 Сигнала'},
  {id:'t2',kind:'dials',n:pick([130,150,170]),name:'Наборы',rew:'chest',rt:'Редкий сундук'},{id:'t3',kind:'dials',n:300,name:'Берсерк',rew:'epic',rt:'Эпический сундук и +200 Сигнала'}]}
export const DEF=()=>({sig:0,sigLife:0,tree:{},inv:{},act:[],relic:{},pity:{n:0,at:0},frz:{ch:0,got:0,k:'',on:0,at:0},shield:0,warm:{k:'',done:0},
 tr:{k:'',done:{}},perk:{k:'',at:0,opts:null,pick:null,until:0},raid:null,purge:{chk:'',log:[]},normDays:0,ops:{rooms:0,n:0},theme:'base',drops:[],stats:{spins:0,chests:0,legend:0}});
export const ensure=root=>{const a=root.ad||(root.ad=DEF()),d=DEF();for(const k in d)if(a[k]===undefined)a[k]=d[k];return a};
// местное время лида по штату → минуты от полуночи
export function leadMin(state,now){const z=TZ[String(state||'').toUpperCase()];if(!z)return null;try{const p=new Intl.DateTimeFormat('en-US',{timeZone:z,hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date(now));
 const h=+p.find(x=>x.type==='hour').value%24,m=+p.find(x=>x.type==='minute').value;return h*60+m}catch(e){return null}}
export function happy(state,now){const m=leadMin(state,now);if(m==null)return null;const w=new Date(now).getDay();if(w===0||w===6)return null;const h=AD.hh.find(x=>m>=x.from&&m<x.to);return h?{...h,min:m,left:h.to-m}:null}
// сумма бонусов Addiction (дерево, реликвии, активные бусты, перк, Слышащие, серия норм) → {xAll,mAll (доли), x,m {cls:%}, fast, odSec, luck, sigK}
export function adTotals(root,now){const a=ensure(root),t={xAll:0,mAll:0,x:{},m:{},fast:0,odSec:0,luck:0,luckK:1,sigK:1,pity:0,purge:0,frz:0,themes:0};
 const add=b=>{if(!b)return;t.xAll+=b.xAll||0;t.mAll+=b.mAll||0;t.fast+=b.fast||0;t.odSec+=b.odSec||0;t.luck+=b.luck||0;t.pity+=b.pity||0;t.purge+=b.purge||0;t.frz+=b.frz||0;t.themes+=b.themes||0;
  if(b.sigK)t.sigK*=b.sigK;if(b.luckK)t.luckK*=b.luckK;for(const[k,v]of Object.entries(b.x||{}))t.x[k]=(t.x[k]||0)+v;for(const[k,v]of Object.entries(b.m||{}))t.m[k]=(t.m[k]||0)+v};
 for(const n of TREE){const l=a.tree[n.id]|0;if(l)add(n.fx(l))}
 for(const id in a.relic){const L=lootById(id);if(L&&L.relic)add(L.relic)}
 for(const x of a.act){const L=lootById(x.id);if(L&&x.left>0)add({xAll:L.xAll,mAll:L.mAll,x:L.x,m:L.m,fast:L.fast,odSec:L.odSec,luck:L.luck,sigK:L.sigK})}
 if(a.perk&&a.perk.pick&&now<a.perk.until){const p=PERKS3.find(x=>x.id===a.perk.pick);if(p)add(p)}
 const ops=a.ops.n*OPS.perOp;t.xAll+=ops;t.mAll+=ops;
 const nd=Math.min(AD.normDay.max,a.normDays*AD.normDay.per);t.xAll+=nd;t.mAll+=nd;return t}
// слить в модификаторы движка (после директивы и предметов): потолок AD.cap на итоговые ×XP/×$, затем счастливый час
export function withAd(mods,root,now,state,dayN=0){const t=adTotals(root,now),hh=happy(state,now),r={...mods,m:{...(mods.m||{})},x:{...(mods.x||{})}};
 r.xAll=Math.min(AD.cap,(mods.xAll||1)*(1+t.xAll/100));r.mAll=Math.min(AD.cap,(mods.mAll||1)*(1+t.mAll/100));
 for(const k in t.x)r.x[k]=(r.x[k]||1)*(1+t.x[k]/100);for(const k in t.m)r.m[k]=(r.m[k]||1)*(1+t.m[k]/100);
 const a=ensure(root),k=dayKey(now);if(a.tr.k===k&&a.tr.done.t1)r.mAll*=1.1;          // награда цели «Наборы I»: ×1.1 $ до конца дня
 if(hh){r.xAll*=hh.k;r.mAll*=hh.k;r.hh=hh}r.fast=(mods.fast||0)+t.fast;r.odSec=(mods.odSec||0)+t.odSec;return r}
const rollTier=(w,rnd)=>{const tot=Object.values(w).reduce((a,b)=>a+b,0);let x=rnd()*tot;for(const[k,v]of Object.entries(w)){if((x-=v)<0)return k}return'c'};
export function pickLoot(tier,rnd=Math.random){const p=LOOT.filter(x=>x.r===tier);return p[rnd()*p.length|0]}
// выдать предмет: мгновенные срабатывают сразу, бусты в рюкзак, реликвии навсегда (повтор реликвии = Сигнал)
export function grant(root,G,id,y=1){const a=ensure(root),L=lootById(id),out={id,instant:[]};if(!L)return out;
 if(L.relic){if(a.relic[id]){a.sig+=200;a.sigLife+=200;out.instant.push('+200 Сигнала (реликвия уже есть)')}else{a.relic[id]=Date.now();out.instant.push('реликвия навсегда')}a.stats.legend++;return out}
 if(L.jack){const m=Math.round(L.jack*C.assumedDailyMoney*y);G.money+=m;out.money=m;out.instant.push('+$'+m)}
 if(L.sigNow){a.sig+=L.sigNow;a.sigLife+=L.sigNow;out.instant.push('+'+L.sigNow+' Сигнала')}
 if(L.freeze){a.frz.ch=Math.min(AD.freeze.max+adTotals(root,0).frz+1,a.frz.ch+L.freeze);out.instant.push('+1 Заморозка')}
 if(L.shield){a.shield+=L.shield;out.instant.push('щит от Ночной чистки')}
 if(L.calls)a.inv[id]=(a.inv[id]||0)+1;if(L.r==='l')a.stats.legend++;return out}
export function activate(root,id){const a=ensure(root),L=lootById(id);if(!L||!L.calls||!(a.inv[id]>0))return{ok:false,why:'нет в рюкзаке'};
 if(a.act.filter(x=>x.left>0).length>=3)return{ok:false,why:'Активно уже 3 буста'};a.inv[id]--;if(!a.inv[id])delete a.inv[id];a.act.push({id,left:L.calls});return{ok:true}}
// ВСЁ, что происходит после засчитанного статуса. Возвращает события для интерфейса. rnd — для тестов.
export function adAfter(root,G,ev,now,{state,dayN=0,lead='',rnd=Math.random,hhMods=null}={}){const a=ensure(root),k=dayKey(now),y=C.districts[G.district-1][3],cls=ev.cls,o={};
 const t=adTotals(root,now),hh=happy(state,now);
 // Сигнал
 const sg=Math.round((AD.sig[cls]||1)*(hh?2:1)*t.sigK);a.sig+=sg;a.sigLife+=sg;o.sig=sg;
 // активные бусты тратят заряд
 for(const x of a.act)if(x.left>0)x.left--;a.act=a.act.filter(x=>x.left>0);
 // заморозка: заряд за каждые 25 наборов дня
 if(a.frz.k!==k){a.frz.k=k;a.frz.got=0}const shouldHave=Math.floor(dayN/AD.freeze.per);if(shouldHave>a.frz.got){const mx=AD.freeze.max+t.frz;const add=shouldHave-a.frz.got;a.frz.got=shouldHave;const b=a.frz.ch;a.frz.ch=Math.min(mx,a.frz.ch+add);if(a.frz.ch>b)o.freeze=a.frz.ch}
 // разгон
 if(a.warm.k!==k)a.warm={k,done:0};if(!a.warm.done&&dayN>=AD.warm.n){a.warm.done=now;const m=Math.round(AD.warm.share*C.assumedDailyMoney*y);G.money+=m;a.sig+=AD.warm.sig;a.sigLife+=AD.warm.sig;o.warm={money:m,sig:AD.warm.sig}}
 // гарант
 if(!a.pity.at)a.pity.at=AD.pity[0]+Math.floor(rnd()*(AD.pity[1]-AD.pity[0]+1));
 const win=cls==='BOOKED'||cls==='DISCOVERY';if(win)a.pity.n=0;else a.pity.n++;
 if(!win&&a.pity.n>=Math.max(10,a.pity.at-t.pity)){a.pity.n=0;a.pity.at=AD.pity[0]+Math.floor(rnd()*(AD.pity[1]-AD.pity[0]+1));const tier=rollTier(AD.wChest,rnd),it=pickLoot(tier,rnd);o.spin={chest:1,tier,id:it.id,got:grant(root,G,it.id,y)};a.stats.chests++}
 // рулетка Шума
 else if(AD.roul.from.includes(cls)){const ch=Math.min(AD.roul.cap,(AD.roul.base+a.pity.n*AD.roul.perFail+t.luck)*(hh?AD.roul.hh:1)*t.luckK);
  if(rnd()<ch){const tier=rollTier(AD.w,rnd),it=pickLoot(tier,rnd);o.spin={chest:0,tier,id:it.id,got:grant(root,G,it.id,y)};a.stats.spins++}}
 if(o.spin){a.drops.unshift({t:now,id:o.spin.id,tier:o.spin.tier,chest:o.spin.chest});a.drops=a.drops.slice(0,40)}
 // цели дня
 if(a.tr.k!==k)a.tr={k,done:{},hh:0,sig0:a.sigLife-sg};if(hh)a.tr.hh=(a.tr.hh||0)+1;
 const d=(root.days||{})[k]||{n:0,c:{}},val=x=>x.kind==='dials'?dayN:x.kind==='talk'?(d.c.TALK||0)+(d.c.CALLBACK||0)+(d.c.BOOKED||0)+(d.c.DISCOVERY||0):x.kind==='gk'?(d.c.GATEKEEPER||0):x.kind==='hh'?a.tr.hh:x.kind==='streak'?(d.bs||0):a.sigLife-(a.tr.sig0||0);
 o.tracks=[];for(const x of tracksFor(k))if(!a.tr.done[x.id]&&val(x)>=x.n){a.tr.done[x.id]=now;const r={...x};
  if(x.rew==='sig'){a.sig+=60;a.sigLife+=60}else if(x.rew==='chest'||x.rew==='epic'){const tier=x.rew==='epic'?rollTier(AD.wChest,rnd):rollTier({r:70,e:25,l:5},rnd),it=pickLoot(tier,rnd);r.spin={chest:1,tier,id:it.id,got:grant(root,G,it.id,y)};if(x.rew==='epic'){a.sig+=200;a.sigLife+=200}}
  o.tracks.push(r)}
 if(!o.spin){const c=o.tracks.find(x=>x.spin);if(c)o.spin=c.spin}
 // перк 1 из 3
 if(a.perk.k!==k)a.perk={k,at:0,opts:null,pick:null,until:0};
 if(dayN>0&&dayN%AD.perk.every===0&&a.perk.at!==dayN){const pool=PERKS3.slice(),opts=[];while(opts.length<3)opts.push(pool.splice(rnd()*pool.length|0,1)[0].id);a.perk.at=dayN;a.perk.opts=opts;o.perk=opts}
 // рейд
 if(a.raid&&a.raid.on){const R=a.raid;if(now>R.dl){o.raid={burned:R.m,n:R.n};a.raid=null;a.stats.burn=(a.stats.burn||0)+1}
  else{R.n++;R.m+=ev.m||0;G.money-=ev.m||0;o.raidM=ev.m||0;R.dl=now+(AD.raid.gap[cls]||180)*1000;if(R.n>=AD.raid.n){const pay=Math.round(R.m*R.k);G.money+=pay;o.raid={extracted:pay,base:R.m,n:R.n};a.raid=null;a.stats.raids=(a.stats.raids||0)+1}}}
 return o}
// 1 из 3: выбрать
export function pickPerk(root,id,now){const a=ensure(root),p=PERKS3.find(x=>x.id===id);if(!p||!a.perk.opts||!a.perk.opts.includes(id))return{ok:false};
 a.perk.pick=id;a.perk.until=now+AD.perk.min*60000;a.perk.opts=null;if(p.freeze)a.frz.ch=Math.min(AD.freeze.max+adTotals(root,now).frz+1,a.frz.ch+1);return{ok:true,p}}
// дерево
export function buyTree(root,id){const a=ensure(root),n=TREE.find(x=>x.id===id);if(!n)return{ok:false};const l=a.tree[id]|0;if(l>=6)return{ok:false,why:'ветка закрыта до конца'};
 const c=treeCost(l);if(a.sig<c)return{ok:false,why:'нужно '+c+' Сигнала'};a.sig-=c;a.tree[id]=l+1;return{ok:true,lv:l+1,cost:c}}
// Слышащие
export function buyRoom(root,G){const a=ensure(root);if(a.ops.rooms>=OPS.maxRooms)return{ok:false,why:'все комнаты построены'};const c=OPS.roomCost(a.ops.rooms);if(G.money<c)return{ok:false,why:'нужно $'+c};G.money-=c;a.ops.rooms++;return{ok:true,cost:c}}
export function hireOp(root,G){const a=ensure(root);if(a.ops.n>=a.ops.rooms*OPS.roomCap)return{ok:false,why:'нет места: построй комнату'};const c=OPS.opCost(a.ops.n);if(G.money<c)return{ok:false,why:'нужно $'+c};G.money-=c;a.ops.n++;return{ok:true,cost:c}}
// заморозка
export function freezeOn(root,now){const a=ensure(root);if(a.frz.on)return{ok:false,why:'уже заморожено'};if(a.frz.ch<1)return{ok:false,why:a.frz.got?'заряды кончились':'первый заряд — после 25 наборов'};a.frz.ch--;a.frz.on=1;a.frz.at=now;a.stats.frz=(a.stats.frz||0)+1;return{ok:true}}
export function freezeOff(root,now){const a=ensure(root);if(!a.frz.on)return 0;const d=Math.min(now-a.frz.at,AD.freeze.sec*1000);a.frz.on=0;if(a.raid&&a.raid.on)a.raid.dl+=d;return d}
// рейд
export function raidStart(root,now){const a=ensure(root);if(a.raid&&a.raid.on)return{ok:false};a.raid={on:1,start:now,n:0,m:0,k:AD.raid.k,dl:now+15*60000};return{ok:true}}
export function raidCheck(root,G,now){const a=ensure(root),R=a.raid;if(!R||!R.on)return null;if(now>R.dl){const r={burned:R.m,n:R.n};a.raid=null;a.stats.burn=(a.stats.burn||0)+1;return r}return null}
export function raidHold(root,now,sec=60){const R=ensure(root).raid;if(R&&R.on)R.dl=Math.max(R.dl,now+sec*1000)}
// Ночная чистка (B4): рабочие дни после последней проверки до вчера включительно
export function nightly(root,G,now){const a=ensure(root),today=dayKey(now),days=root.days||{},out=[];
 if(!a.purge.chk){a.purge.chk=dayKey(now-864e5);return out}               // первый запуск после обновления: задним числом не наказываем
 const played=Object.keys(days).filter(k=>days[k]&&days[k].n>0).sort(),first=played[0]||'9999';   // дни до первого звонка вообще не считаются
 let t=now-864e5,keys=[];for(let i=0;i<AD.purge.lookback;i++,t-=864e5){const k=dayKey(t);if(k<=a.purge.chk||k<first)break;keys.push([k,t])}keys.reverse();
 const anyPlay=played.length>0;
 for(const[k,t]of keys){if(!isWork(t)||!anyPlay)continue;const n=(days[k]||{n:0}).n;
  if(n>=AD.norm){a.normDays++;continue}
  const f=1-n/AD.norm,red=Math.max(0,1-adTotals(root,now).purge)*(root.story&&root.story.ch&&root.story.ch.b7==='wipe'?.5:1);if(a.shield>0){a.shield--;out.push({k,n,shield:1});a.normDays=0;continue}
  if(out.filter(x=>!x.shield).length>=AD.purge.maxDays)continue;
  const dx=Math.round((G.dxp||0)*AD.purge.share*f*red),dm=Math.round(Math.max(0,G.money)*AD.purge.mShare*f*red),op=f>=.5&&a.ops.n>0?1:0;
  G.dxp=Math.max(0,(G.dxp||0)-dx);G.money-=dm;if(op)a.ops.n--;const lostStreak=a.normDays;a.normDays=0;out.push({k,n,f,dx,dm,op,lostStreak})}
 a.purge.chk=dayKey(now-864e5);if(out.length){a.purge.log.unshift(...out.map(x=>({...x,at:now})));a.purge.log=a.purge.log.slice(0,30)}return out}
// Сравнения v3 (кусок 17): личные рекорды и «обычный ты», прямо после статуса, когда внимание свободно.
// Рекорды (save.gh.rec): f20 — самые быстрые 20 наборов подряд (мс), b10 — лучшие 10 минут, b60 — лучший час, p100 — больше всего
// питчей (TALK…DISCOVERY) на последние 100 наборов, ft — меньше всего наборов до первого питча дня, day — рекорд наборов за день.
// Порядок показа: побит рекорд (золото, звук) → питч/встреча (как идёшь против обычного) → «идёшь на рекорд» → темп против обычного дня.
const TALKC=['TALK','CALLBACK','BOOKED','DISCOVERY'],MEETC=['BOOKED','DISCOVERY'];
const slotOf=now=>Math.floor((now-new Date(new Date(now).toDateString()).getTime())/6e5);
export const mmssR=ms=>{const t=Math.round(ms/1000);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const REC_N={f20:'Быстрые 20 наборов',b10:'Лучшие 10 минут',b60:'Лучший час',p100:'Питчей на 100 наборов',ft:'Первый питч дня',day:'Наборов за день'};
export function ghostRec(root,now,cls){const g=root.gh||(root.gh={k:'',t:[],bestH:0,days:{}}),k=dayKey(now);g.rec=g.rec||{};
 if(g.k!==k){g.k=k;g.t=[];g.ms=[];g.tl=0;g.mt=0;g.ft=0;g.rec0={...g.rec};g.shown={}}
 g.rec0=g.rec0||{...g.rec};g.shown=g.shown||{};g.tk=g.tk||{};g.t.push(now);const isT=TALKC.includes(cls);if(isT){g.tl=(g.tl||0)+1;if(!g.ft)g.ft=g.t.length}if(MEETC.includes(cls))g.mt=(g.mt||0)+1;
 g.r100=((g.r100||'')+(isT?'1':'0')).slice(-100);
 const T=g.t,n=T.length,h=T.filter(x=>x>now-36e5).length,m10=T.filter(x=>x>now-6e5).length,f20=n>=20?now-T[n-20]:null,p100=g.r100.length>=100?[...g.r100].filter(c=>c==='1').length:null;
 g.bestH=Math.max(g.bestH||0,h);
 const slot=slotOf(now),day=g.days[k]||(g.days[k]={});day[slot]=n;const tk=g.tk[k]||(g.tk[k]={});tk[slot]=g.tl||0;
 const ks=Object.keys(g.days).sort();for(const x of ks.slice(0,-31)){delete g.days[x];delete g.tk[x]}
 // обновить рекорды; объявлять, только если побит рекорд прошлых дней (а не тот, что сам поставил минуту назад) и не чаще раза в 10 мин на рекорд
 const cur={b10:m10,b60:h,day:n,f20,p100,ft:isT&&g.tl===1?g.ft:null},better={b10:(a,b)=>a>b,b60:(a,b)=>a>b,day:(a,b)=>a>b,p100:(a,b)=>a>b,f20:(a,b)=>a<b,ft:(a,b)=>a<b};
 const min={b10:8,b60:20,day:30,p100:3,f20:1,ft:1},ms=[];
 for(const id in cur){const v=cur[id];if(v==null)continue;const old=g.rec[id];if(old==null||better[id](v,old))g.rec[id]=v;
  const r0=g.rec0[id];if(r0!=null&&better[id](v,r0)&&(id==='f20'||id==='ft'||v>=min[id])&&(!g.shown[id]||now-g.shown[id]>6e5)){g.shown[id]=now;
   const fm=x=>id==='f20'?mmssR(x):x;ms.push({k:'win',id,t:`РЕКОРД · ${REC_N[id]}: ${fm(v)}${id==='ft'?' набора':''} (был ${fm(r0)})`});g.rec0[id]=v}}
 const wc=weekCheck(root,now);if(wc)ms.push(wc);
 return{h,m10,f20,p100,slot,n,cls,ms}}
const cumAt=(day,slot)=>{let v=0;for(const s in day)if(+s<=slot)v=Math.max(v,day[s]);return v};
const sg=v=>(v>0?'+':v<0?'−':'±')+Math.abs(v);
// «обычный ты»: среднее по последним 5 дням с наборами к этому же времени
const usual=(src,k,slot)=>{const P=Object.entries(src||{}).filter(([x])=>x<k).slice(-5).map(([,d])=>cumAt(d,slot)).filter(v=>v>0);return P.length?Math.round(P.reduce((a,b)=>a+b,0)/P.length):0};
export function ghostLine(root,now,i=0,rec=null){const g=root.gh;if(!g||!g.t.length)return null;if(rec&&rec.ms&&rec.ms.length)return rec.ms[0];
 const k=dayKey(now),slot=slotOf(now),n=g.t.length,R=g.rec0||{},tm=new Date(now).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
 const cls=rec&&rec.cls,m10=rec?rec.m10:g.t.filter(x=>x>now-6e5).length,h=rec?rec.h:g.t.filter(x=>x>now-36e5).length;
 if(cls&&MEETC.includes(cls))return{k:'up',t:`Встреча №${g.mt} сегодня · на ${n} наборов`};
 if(cls&&TALKC.includes(cls)){const p=rec&&rec.p100;if(p!=null&&R.p100)return{k:p>=R.p100?'up':p>=R.p100-2?'near':'down',t:`Питч №${g.tl} · на последние 100 наборов ${p} питчей, рекорд ${R.p100}`};
  const u=usual(g.tk,k,slot);return u?{k:g.tl>=u?'up':'down',t:`Питч №${g.tl} · обычно к ${tm} у тебя ${u} (${sg(g.tl-u)})`}:{k:'up',t:`Питч №${g.tl} сегодня`}}
 const L=[];
 // идёшь на рекорд
 if(R.b10>=8&&m10>=R.b10-3&&m10<=R.b10)L.push({k:'near',t:`10 минут: ${m10} наборов · рекорд ${R.b10} — ещё ${R.b10-m10+1} и он твой`});
 if(R.f20){const inWin=g.t.filter(x=>x>now-R.f20).length;if(inWin>=14&&inWin<20)L.push({k:'near',t:`Темп рекорда: ${inWin} из 20 за ${mmssR(R.f20)} — держи`})}
 if(R.b60>=20&&h>=R.b60*.85&&h<=R.b60)L.push({k:'near',t:`Час: ${h} наборов · рекорд часа ${R.b60}, осталось ${R.b60-h+1}`});
 if(L.length)return L[i%L.length];
 const u=usual(g.days,k,slot);if(u>0)L.push({k:n>=u?'up':'down',t:`Обычно к ${tm} у тебя ${u} наборов · сегодня ${n} (${sg(n-u)})`});
 if(R.b10)L.push({k:'down',t:`Последние 10 минут: ${m10} · рекорд 10 минут ${R.b10}`});
 return L.length?L[i%L.length]:null}
// неделя: раз в неделю, когда неделя обгоняет лучшую из прошлых (по понедельникам счёт с нуля)
export function weekCheck(root,now){const g=root.gh;if(!g)return null;const days=root.days||{},d=new Date(now),dow=(d.getDay()+6)%7;let w=0;for(let i=0;i<=dow;i++)w+=((days[dayKey(now-i*864e5)]||{}).n||0);
 const wk=dayKey(now-dow*864e5);g.wk=g.wk||{best:0,k:'',told:''};if(g.wk.k!==wk){if(g.wk.k&&g.wk.cur>g.wk.best)g.wk.best=g.wk.cur;g.wk.k=wk;g.wk.b0=g.wk.best}g.wk.cur=w;
 if(g.wk.b0>=50&&w>g.wk.b0&&g.wk.told!==wk){g.wk.told=wk;return{k:'win',t:`Эта неделя уже лучшая: ${w} наборов (прошлый рекорд ${g.wk.b0})`}}return null}
// ранг стиля (D3) по темпу за 15 минут и «владельцу на линии»
export const styleRank=(rate,talk15)=>rate>=60||(rate>=45&&talk15)?'SSS':rate>=50?'SS':rate>=40?'S':rate>=30?'A':rate>=20?'B':rate>=10?'C':'D';
