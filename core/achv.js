import {dayKey,ironWeek,rankOf,RANKS} from './stats.js';
// [id, название, подсказка, редкость, проверка(c)]; c={root,G,ev,now,d(день),L(накопительно),rank,meta}
const ad=c=>c.root.ad||{stats:{}},tr=c=>{const a=c.root.ad;return a&&a.tr&&a.tr.k===dayKey(c.now)?a.tr:{hh:0,done:{}}},A=(id,n,h,r,f)=>({id,n,h,r,f}),cnt=(d,k)=>(d.c[k]||0),last10=(root,k,m)=>(root.recent||[]).slice(-10).filter(x=>k.includes(x)).length>=m;
// J5: счётчики по районам. root.dx={cur,by:{N:{n,b,ds,t,gk,days,dk,dn,db,dt,dg,dod,smax,cap,capD}}}
const DX0={n:0,b:0,ds:0,t:0,gk:0,days:0,dk:'',dn:0,db:0,dt:0,dg:0,dod:0,smax:0,cap:0,capD:0};
const dx=(c,n)=>((c.root.dx||{}).by||{})[n]||DX0;
export function dxTrack(root,G,ev,now){if(!ev||ev.spam)return;const X=root.dx||(root.dx={cur:G.district,by:{}}),by=X.by;
 const n=ev.captured?(X.cur===G.district?G.district:G.district-1):G.district,o=by[n]||(by[n]={...DX0}),k=dayKey(now);
 if(o.dk!==k){o.dk=k;o.days++;o.dn=0;o.db=0;o.dt=0;o.dg=0;o.dod=0}
 const cl=ev.cls;o.n++;o.dn++;if(cl==='BOOKED'){o.b++;o.db++}if(cl==='DISCOVERY')o.ds++;if(cl==='TALK'||cl==='CALLBACK'||cl==='BOOKED'||cl==='DISCOVERY'){o.t++;o.dt++}
 if(cl==='GATEKEEPER'){o.gk++;o.dg++}if(ev.odStart)o.dod++;o.smax=Math.max(o.smax,G.streak||0);
 if(ev.captured&&!o.cap){o.cap=now;o.capD=o.days}X.cur=G.district}
// Кусок 22: ачивок «с дедлайном» нет. Всё, что можно навсегда упустить (захват за k дней, «только в районе N»), убрано.
// Районная ачивка = «район N и дальше»: условие засчитывается в районе N или в любом следующем (счётчики каждого района копятся).
// Ачивки по времени суток — по часам компьютера, их можно выполнить в любой рабочий день.
const sumH=(h,a,b)=>{let n=0;if(h)for(let i=a;i<b;i++)n+=h[i]||0;return n},maxH=h=>h?Math.max(0,...Object.values(h)):0;
// [id, название, подсказка, сложность c лёгкая | r средняя | l сложная, (o=счётчики района, c)=>bool, day: true — проверка по дню (c.d), не по району]
const DXA=[
 ['x1e','Утренний заход','Район 1 и дальше: 10 питчей до 12:00 за один день','c',(o,c)=>sumH(c.d.ph,0,12)>=10,1],
 ['x1b','Ни шагу назад','Район 1 и дальше: серия 40 статусов','r',o=>o.smax>=40],
 ['x1c','Свой на свалке','Район 1 и дальше: владелец на линии 15 раз','c',o=>o.t>=15],
 ['x2a','Сменщик','Район 2 и дальше: 120 звонков за один день','r',o=>o.dn>=120],
 ['x2b','Проходная','Район 2 и дальше: 20 гейткиперов за один день','r',o=>o.dg>=20],
 ['x2c','Цех подписал','Район 2 и дальше: 2 встречи за один день','l',o=>o.db>=2],
 ['x2e','До обеда','Район 2 и дальше: 60 звонков до 12:00 за один день','r',(o,c)=>sumH(c.d.h,0,12)>=60,1],
 ['x3a','Ночная смена','Район 3 и дальше: 150 звонков за один день','r',o=>o.dn>=150],
 ['x3b','Разговор у причала','Район 3 и дальше: проведи discovery-звонок','r',o=>o.ds>=1],
 ['x3c','Канат держит','Район 3 и дальше: серия 50 статусов','l',o=>o.smax>=50],
 ['x4a','Торг уместен','Район 4 и дальше: 5 встреч','r',o=>o.b>=5],
 ['x4b','Рынок не спит','Район 4 и дальше: 3 Overdrive за один день','l',o=>o.dod>=3],
 ['x4c','Двадцать голосов','Район 4 и дальше: владелец на линии 20 раз за один день','l',o=>o.dt>=20],
 ['x5a','Без обеда','Район 5 и дальше: 175 звонков за один день','r',o=>o.dn>=175],
 ['x5b','Три подписи','Район 5 и дальше: 3 встречи за один день','l',o=>o.db>=3],
 ['x5e','Встреча к кофе','Район 5 и дальше: встреча до 11:00','r',(o,c)=>sumH(c.d.bh,0,11)>=1,1],
 ['x6a','Ни царапины','Район 6 и дальше: серия 60 статусов','l',o=>o.smax>=60],
 ['x6b','Двести на площади','Район 6 и дальше: 200 звонков за один день','r',o=>o.dn>=200],
 ['x6c','Десять на хроме','Район 6 и дальше: 10 встреч','l',o=>o.b>=10],
 ['x7a','Три разбора','Район 7 и дальше: 3 discovery-звонка','l',o=>o.ds>=3],
 ['x7b','Через все ресепшены','Район 7 и дальше: 30 гейткиперов за один день','r',o=>o.dg>=30],
 ['x7e','Час силы','Район 7 и дальше: 40 звонков за один час по часам (например, с 10:00 до 11:00)','r',(o,c)=>maxH(c.d.h)>=40,1],
 ['x8a','Длинный день','Район 8 и дальше: 225 звонков за один день','l',o=>o.dn>=225],
 ['x8b','Пятнадцать встреч','Район 8 и дальше: 15 встреч','l',o=>o.b>=15],
 ['x8c','С порога','Район 8 и дальше: встреча в первые 15 звонков дня','r',(o,c)=>c.ev.cls==='BOOKED'&&c.d.n<=15,1],
 ['x9a','Высота','Район 9 и дальше: серия 75 статусов','l',o=>o.smax>=75],
 ['x9b','Четыре за день','Район 9 и дальше: 4 встречи за один день','l',o=>o.db>=4],
 ['x9c','Все взяли трубку','Район 9 и дальше: владелец на линии 25 раз за один день','r',o=>o.dt>=25],
 ['x10a','Без посадки','Район 10 и дальше: 250 звонков за один день','l',o=>o.dn>=250],
 ['x10b','Пять разборов','Район 10 и дальше: 5 discovery-звонков','l',o=>o.ds>=5],
 ['x10e','Вечерний рывок','Район 10 и дальше: 30 питчей после 17:00 за один день','l',(o,c)=>sumH(c.d.ph,17,24)>=30,1],
 ['x11a','Двадцать встреч','Район 11 и дальше: 20 встреч','l',o=>o.b>=20],
 ['x11b','Пять Overdrive','Район 11 и дальше: 5 Overdrive за один день','l',o=>o.dod>=5],
 ['x11c','Триста','Район 11 и дальше: 300 звонков за один день','l',o=>o.dn>=300],
 ['x12a','Сотня подряд','Район 12: серия 100 статусов','l',o=>o.smax>=100],
 ['x12b','Пять за день','Район 12: 5 встреч за один день','l',o=>o.db>=5],
 ['x12e','Утро вершины','Район 12: 2 встречи до 13:00 за один день','l',(o,c)=>sumH(c.d.bh,0,13)>=2,1]];
const dN=id=>+id.slice(1).replace(/\D+$/,'');
// район N и дальше: по дню — достаточно быть в районе ≥N; по счётчикам — любой район ≥N
const dxOk=(c,id,f,day)=>{const N=dN(id),cur=c.G.district|0;if(day)return cur>=N&&f(DX0,c);for(let m=N;m<=Math.max(cur,N);m++){const o=dx(c,m);if(o!==DX0&&f(o,c))return true}return false};
export const ACH=[
 A('v50','Разогрев','50 звонков за день','c',c=>c.d.n>=50),A('v100','Iron Standard','100 звонков за день','c',c=>c.d.n>=100),A('v150','Полторашка','150 звонков за день','r',c=>c.d.n>=150),
 A('v200','Berserker','200 звонков за день','r',c=>c.d.n>=200),A('v300','Unhinged','300 звонков за день','l',c=>c.d.n>=300),
 A('gk15','Мастер ресепшена','15 гейткиперов за день','c',c=>cnt(c.d,'GATEKEEPER')>=15),A('gk50','Gatekeeper Slayer','50 гейткиперов всего','r',c=>c.L.gk>=50),
 A('t10','Говорун','Владелец на линии 10 раз за день','c',c=>cnt(c.d,'TALK')+cnt(c.d,'CALLBACK')>=10),A('t3','Хет-трик голосов','Владелец на линии 3 звонка подряд','r',c=>(c.root.recent||[]).slice(-3).length===3&&(c.root.recent||[]).slice(-3).every(x=>x==='TALK'||x==='CALLBACK')),
 A('t5in10','Горячая десятка','5 раз владелец на линии в пределах 10 звонков','r',c=>last10(c.root,['TALK','CALLBACK','BOOKED','DISCOVERY'],5)),
 A('b1','First Blood','Первая встреча (CALL BOOKED)','c',c=>c.L.booked>=1),A('b2','Double Tap','2 встречи за день','r',c=>cnt(c.d,'BOOKED')>=2),A('b3','Hat-trick','3 встречи за день','l',c=>cnt(c.d,'BOOKED')>=3),
 A('b20','Быстрый старт','Встреча в первые 20 звонков дня','r',c=>c.ev.cls==='BOOKED'&&c.d.n<=20),A('bper','Persistence','Встреча после 50+ звонков без встреч','r',c=>c.ev.cls==='BOOKED'&&c.sinceBefore>=50),
 A('d1','Discovery','Первый discovery-звонок','r',c=>c.L.disc>=1),A('b10','Десятка','10 встреч всего','r',c=>c.L.booked>=10),
 A('h2','Раскалённый','Множитель x2 впервые','c',c=>c.ev.step>=3||c.G.step>=3),A('s30','Серия 30','30 статусов без срыва','r',c=>c.G.streak>=30),
 A('od1','Overdrive','Первый Overdrive','r',c=>c.ev.odStart||c.d.od>=1&&c.L.calls>0&&c.root.ach&&!c.root.ach.od1),A('od3','Берсерк-режим','3 Overdrive за день','l',c=>c.d.od>=3),
 A('iw','Iron Week','5 рабочих дней подряд по 100+ звонков','l',c=>ironWeek(c.root,c.now)>=5),
 A('rsb','Syndicate Boss','Достигни ранга Syndicate Boss','r',c=>c.rank>=3),A('rap','Apex Predator','Достигни ранга Apex Predator','l',c=>c.rank>=4),
 A('ret','Возвращение','Вернись из Nobody в Rookie+','r',c=>c.rank>=1&&c.root.wasNobody),
 A('c1','Первый район','Захвати район 1','c',c=>c.G.district>=2||c.ev.captured),A('c5','Пятый район','Захвати 5 районов','r',c=>c.G.district>=6),A('c12','The Summit','Захвати все 12 районов','l',c=>c.G.district>=12&&c.G.dxp>=1e5),
 A('sp100','Деньги в дело','Потрать $100k','r',c=>c.L.spent>=1e5),A('show','Showpiece','Купи главный предмет витрины (второй уровень)','r',c=>Object.keys(c.meta.owned).some(k=>k.endsWith('t2'))),
 A('early','Жаворонок','Первый звонок дня до 9:00','c',c=>new Date(c.d.first).getHours()<9),A('k1','Тысячник','1000 звонков за всё время','r',c=>c.L.calls>=1000),A('k5','Пять тысяч','5000 звонков за всё время','l',c=>c.L.calls>=5000),
 A('lvl5','Pickup Hunter','Достигни 5-го уровня аккаунта','c',c=>c.lvl>=4),
 // Addiction update (кусок 15): наборы, Шум, рейд, цели дня, Коммутатор, Слышащие, нормы
 A('v75','Три четверти','75 звонков за день','c',c=>c.d.n>=75),A('v250','Мясорубка','250 звонков за день','l',c=>c.d.n>=250),
 A('k2','Две тысячи','2000 звонков за всё время','r',c=>c.L.calls>=2000),A('k10','Десять тысяч','10 000 звонков за всё время','l',c=>c.L.calls>=10000),
 A('gk100','Ключник','100 гейткиперов всего','r',c=>c.L.gk>=100),A('b25','Четверть сотни','25 встреч всего','l',c=>c.L.booked>=25),A('d5','Пять discovery','5 discovery-звонков всего','r',c=>c.L.disc>=5),
 A('s50','Серия 50','50 статусов без срыва','l',c=>c.G.streak>=50),A('sss','Ранг SSS','15 статусов за 15 минут','r',c=>(c.G.undo||[]).filter(u=>u.t>c.now-9e5&&!u.spam).length>=15),
 A('owl','Сова','Звонок после 19:00','c',c=>new Date(c.now).getHours()>=19),
 A('sp1','Шум на линии','Поймай первый Шум','c',c=>ad(c).stats.spins>=1),A('sp25','Ловец Шума','25 раз поймай Шум','r',c=>ad(c).stats.spins>=25),
 A('ch1','Гарант','Открой сундук гаранта','c',c=>ad(c).stats.chests>=1),A('lg1','Легенда','Поймай легендарный предмет','r',c=>ad(c).stats.legend>=1),
 A('rl3','Хранитель реликвий','Собери 3 реликвии','l',c=>Object.keys(ad(c).relic||{}).length>=3),
 A('rd1','Рейдер','Выведи первый рейд','r',c=>(ad(c).stats.raids||0)>=1),A('rd5','Пять рейдов','Выведи 5 рейдов','l',c=>(ad(c).stats.raids||0)>=5),
 A('fz1','Холодная голова','Включи Заморозку','c',c=>(ad(c).stats.frz||0)>=1),A('wm','Прогрев','Пройди «Разгон» дня','c',c=>!!(ad(c).warm||{}).done),
 A('hh10','Ранняя пташка','10 наборов в счастливый час за день','c',c=>tr(c).hh>=10),A('hh40','Золотой час','40 наборов в счастливые часы за день','r',c=>tr(c).hh>=40),
 A('tr2','По плану','2 цели дня за день','c',c=>Object.keys(tr(c).done||{}).length>=2),A('tr4','Все цели','Все 4 цели дня за день','l',c=>Object.keys(tr(c).done||{}).length>=4),
 A('pk1','Выбор','Выбери первый перк','c',c=>!!(ad(c).perk||{}).pick),
 A('tree1','Первое гнездо','Зажги первое гнездо в Коммутаторе','c',c=>Object.values(ad(c).tree||{}).some(v=>v>=1)),A('tree6','Ветка до конца','Прокачай ветку до 6','r',c=>Object.values(ad(c).tree||{}).some(v=>v>=6)),
 A('tree36','Пульт горит','Все линии Коммутатора до конца','l',c=>Object.values(ad(c).tree||{}).reduce((a,b)=>a+b,0)>=36),
 A('op1','Первый Слышащий','Возьми первого Слышащего','c',c=>((ad(c).ops||{}).n||0)>=1),A('op10','Десять голосов','10 Слышащих на базе','r',c=>((ad(c).ops||{}).n||0)>=10),A('op30','Полный дом','30 Слышащих','l',c=>((ad(c).ops||{}).n||0)>=30),
 // J5 (кусок 21): районные ачивки. Считаются только статусы, поставленные в этом районе; захватный статус — району, который он закрыл.
 ...DXA.map(([id,n,h,r,f,day])=>A(id,n,h,r,c=>dxOk(c,id,f,day))),
 // Кусок 22: питчи и время суток (по часам компьютера) — лёгкие, средние и сложные; выполнимы в любой день
 A('p10','Десять питчей','10 питчей за один день','c',c=>(c.d.p||0)>=10),A('p25','Двадцать пять питчей','25 питчей за один день','r',c=>(c.d.p||0)>=25),A('p50','Полсотни питчей','50 питчей за один день','l',c=>(c.d.p||0)>=50),
 A('am20','Утренний набор','20 звонков до 11:00 за один день','c',c=>sumH(c.d.h,0,11)>=20),A('am50','Полсотни до обеда','50 звонков до 12:00 за один день','r',c=>sumH(c.d.h,0,12)>=50),A('am100','Сотня до полудня','100 звонков до 12:00 за один день','l',c=>sumH(c.d.h,0,12)>=100),
 A('hr20','Плотный час','20 звонков за один час по часам (например, с 14:00 до 15:00)','c',c=>maxH(c.d.h)>=20),A('hr60','Час без передышки','60 звонков за один час по часам','l',c=>maxH(c.d.h)>=60),
 A('cb1','Перезвоню','Первый CALLBACK — владелец просит перезвонить','c',c=>cnt(c.d,'CALLBACK')>=1),A('bam2','Утренний дубль','2 встречи до 12:00 за один день','l',c=>sumH(c.d.bh,0,12)>=2),
 A('nd5','Пять норм','5 рабочих дней с нормой подряд','r',c=>(ad(c).normDays||0)>=5),A('sig5k','Пять тысяч Сигнала','Накопи 5000 Сигнала за всё время','r',c=>(ad(c).sigLife||0)>=5000)];
export function evaluate(ctx){try{dxTrack(ctx.root,ctx.G,ctx.ev,ctx.now)}catch(e){}const got=ctx.root.ach||(ctx.root.ach={}),out=[];for(const a of ACH)if(!got[a.id]){try{if(a.f(ctx)){got[a.id]=ctx.now;out.push(a)}}catch(e){}}return out}
export function runAchvTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('30+ ачивок',()=>ACH.length>=30&&new Set(ACH.map(a=>a.id)).size===ACH.length);
 t('Double Tap и Hat-trick',()=>{const d={n:30,c:{BOOKED:3},od:0,first:Date.now()},root={ach:{}};const g=evaluate({root,G:{step:0,streak:0,district:1,dxp:0},ev:{cls:'BOOKED'},now:Date.now(),d,L:{booked:3,gk:0,disc:0,calls:30,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});return g.some(a=>a.id==='b2')&&g.some(a=>a.id==='b3')&&g.some(a=>a.id==='b1')});
 t('ачивка выдаётся один раз',()=>{const root={ach:{v50:1}};const g=evaluate({root,G:{step:0,streak:0,district:1,dxp:0},ev:{cls:'TRASH'},now:Date.now(),d:{n:60,c:{},od:0,first:Date.now()},L:{booked:0,gk:0,disc:0,calls:60,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});return !g.some(a=>a.id==='v50')});
 t('J5: районные ачивки считают только свой район',()=>{const root={ach:{}},G={district:2,streak:0,step:0,dxp:0},now=Date.now(),L={booked:0,gk:0,disc:0,calls:0,spent:0},c=ev=>evaluate({root,G,ev,now,d:{n:1,c:{},od:0,first:now},L,rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});
  root.dx={cur:2,by:{1:{...DX0,n:5,dk:'',smax:10}}};let g=[];for(let i=0;i<20;i++)g=g.concat(c({cls:'GATEKEEPER'}));const ok2=g.some(a=>a.id==='x2b')&&!g.some(a=>a.id==='x1b');
  G.district=3;c({cls:'BOOKED',captured:true});return ok2&&root.dx.by[2].b===1&&root.dx.by[2].cap>0&&!root.dx.by[3]});
 t('J5: 100+ ачивок, районных 3+ на каждый район',()=>ACH.length>=100&&[1,2,3,4,5,6,7,8,9,10,11,12].every(n=>DXA.filter(x=>dN(x[0])===n).length>=3));
 t('кусок 22: нет ачивок с дедлайном (захват за k дней)',()=>!DXA.some(x=>/за (один|два|три|пять|семь) рабоч|за неделю/.test(x[2]))&&!ACH.some(a=>['x1a','x2d','x5c','x7c','x10c','x12c'].includes(a.id)));
 t('кусок 22: районная ачивка выполнима и в следующем районе',()=>{const root={ach:{},dx:{cur:5,by:{5:{...DX0,smax:45}}}},G={district:5,streak:45,step:0,dxp:0},now=Date.now();const g=evaluate({root,G,ev:{cls:'TRASH'},now,d:{n:1,c:{},od:0,first:now},L:{booked:0,gk:0,disc:0,calls:0,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});return g.some(a=>a.id==='x1b')&&!g.some(a=>a.id==='x6a')});
 t('кусок 22: «10 питчей до 12:00» по часам дня',()=>{const now=Date.now(),mk=ph=>evaluate({root:{ach:{}},G:{district:1,streak:0,step:0,dxp:0},ev:{cls:'TALK'},now,d:{n:12,p:10,c:{},od:0,first:now,h:{},ph},L:{booked:0,gk:0,disc:0,calls:0,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});
  return mk({9:6,11:4}).some(a=>a.id==='x1e')&&!mk({9:6,12:4}).some(a=>a.id==='x1e')});
 t('кусок 22: у каждой ачивки сложность c/r/l, лёгких 15+, сложных 15+',()=>ACH.every(a=>'crl'.includes(a.r))&&ACH.filter(a=>a.r==='c').length>=15&&ACH.filter(a=>a.r==='l').length>=15);
 return o}
