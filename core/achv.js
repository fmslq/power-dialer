import {dayKey,ironWeek,rankOf,RANKS} from './stats.js';
// [id, название, подсказка, редкость, проверка(c)]; c={root,G,ev,now,d(день),L(накопительно),rank,meta}
const ad=c=>c.root.ad||{stats:{}},tr=c=>{const a=c.root.ad;return a&&a.tr&&a.tr.k===dayKey(c.now)?a.tr:{hh:0,done:{}}},A=(id,n,h,r,f)=>({id,n,h,r,f}),cnt=(d,k)=>(d.c[k]||0),last10=(root,k,m)=>(root.recent||[]).slice(-10).filter(x=>k.includes(x)).length>=m;
export const ACH=[
 A('v50','Разогрев','50 звонков за день','c',c=>c.d.n>=50),A('v100','Iron Standard','100 звонков за день','c',c=>c.d.n>=100),A('v150','Полторашка','150 звонков за день','r',c=>c.d.n>=150),
 A('v200','Berserker','200 звонков за день','r',c=>c.d.n>=200),A('v300','Unhinged','300 звонков за день','l',c=>c.d.n>=300),
 A('gk15','Мастер ресепшена','15 гейткиперов за день','c',c=>cnt(c.d,'GATEKEEPER')>=15),A('gk50','Gatekeeper Slayer','50 гейткиперов всего','r',c=>c.L.gk>=50),
 A('t10','Говорун','Владелец на линии 10 раз за день','c',c=>cnt(c.d,'TALK')+cnt(c.d,'CALLBACK')>=10),A('t3','Хет-трик голосов','Владелец на линии 3 звонка подряд','r',c=>(c.root.recent||[]).slice(-3).length===3&&(c.root.recent||[]).slice(-3).every(x=>x==='TALK'||x==='CALLBACK')),
 A('t5in10','Горячая десятка','5 раз владелец на линии в пределах 10 звонков','r',c=>last10(c.root,['TALK','CALLBACK','BOOKED','DISCOVERY'],5)),
 A('b1','First Blood','Первый Booked','c',c=>c.L.booked>=1),A('b2','Double Tap','2 встречи за день','r',c=>cnt(c.d,'BOOKED')>=2),A('b3','Hat-trick','3 встречи за день','l',c=>cnt(c.d,'BOOKED')>=3),
 A('b20','Быстрый старт','Booked в первые 20 звонков дня','r',c=>c.ev.cls==='BOOKED'&&c.d.n<=20),A('bper','Persistence','Booked после 50+ звонков без встреч','r',c=>c.ev.cls==='BOOKED'&&c.sinceBefore>=50),
 A('d1','Discovery','Первый Discovery Call','r',c=>c.L.disc>=1),A('b10','Десятка','10 Booked всего','r',c=>c.L.booked>=10),
 A('h2','Раскалённый','Heat x2.0 впервые','c',c=>c.ev.step>=3||c.G.step>=3),A('s30','Серия 30','30 статусов без срыва','r',c=>c.G.streak>=30),
 A('od1','Overdrive','Первый Overdrive','r',c=>c.ev.odStart||c.d.od>=1&&c.L.calls>0&&c.root.ach&&!c.root.ach.od1),A('od3','Берсерк-режим','3 Overdrive за день','l',c=>c.d.od>=3),
 A('iw','Iron Week','5 рабочих дней подряд по 100+ звонков','l',c=>ironWeek(c.root,c.now)>=5),
 A('rsb','Syndicate Boss','Достигни ранга Syndicate Boss','r',c=>c.rank>=3),A('rap','Apex Predator','Достигни ранга Apex Predator','l',c=>c.rank>=4),
 A('ret','Возвращение','Вернись из Nobody в Rookie+','r',c=>c.rank>=1&&c.root.wasNobody),
 A('c1','Первый район','Захвати район 1','c',c=>c.G.district>=2||c.ev.captured),A('c5','Пятый район','Захвати 5 районов','r',c=>c.G.district>=6),A('c12','The Summit','Захвати все 12 районов','l',c=>c.G.district>=12&&c.G.dxp>=1e5),
 A('sp100','Деньги в дело','Потрать $100k','r',c=>c.L.spent>=1e5),A('show','Showpiece','Купи showpiece-предмет','r',c=>Object.keys(c.meta.owned).some(k=>k.endsWith('t2'))),
 A('early','Жаворонок','Первый звонок дня до 9:00','c',c=>new Date(c.d.first).getHours()<9),A('k1','Тысячник','1000 звонков за всё время','r',c=>c.L.calls>=1000),A('k5','Пять тысяч','5000 звонков за всё время','l',c=>c.L.calls>=5000),
 A('lvl5','Pickup Hunter','Достигни 5-го уровня аккаунта','c',c=>c.lvl>=4),
 // Addiction update (кусок 15): наборы, Шум, рейд, цели дня, Коммутатор, Слышащие, нормы
 A('v75','Три четверти','75 звонков за день','c',c=>c.d.n>=75),A('v250','Мясорубка','250 звонков за день','l',c=>c.d.n>=250),
 A('k2','Две тысячи','2000 звонков за всё время','r',c=>c.L.calls>=2000),A('k10','Десять тысяч','10 000 звонков за всё время','l',c=>c.L.calls>=10000),
 A('gk100','Ключник','100 гейткиперов всего','r',c=>c.L.gk>=100),A('b25','Четверть сотни','25 Booked всего','l',c=>c.L.booked>=25),A('d5','Пять discovery','5 Discovery Call всего','r',c=>c.L.disc>=5),
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
 A('nd5','Пять норм','5 рабочих дней с нормой подряд','r',c=>(ad(c).normDays||0)>=5),A('sig5k','Пять тысяч Сигнала','Накопи 5000 Сигнала за всё время','r',c=>(ad(c).sigLife||0)>=5000)];
export function evaluate(ctx){const got=ctx.root.ach||(ctx.root.ach={}),out=[];for(const a of ACH)if(!got[a.id]){try{if(a.f(ctx)){got[a.id]=ctx.now;out.push(a)}}catch(e){}}return out}
export function runAchvTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('30+ ачивок',()=>ACH.length>=30&&new Set(ACH.map(a=>a.id)).size===ACH.length);
 t('Double Tap и Hat-trick',()=>{const d={n:30,c:{BOOKED:3},od:0,first:Date.now()},root={ach:{}};const g=evaluate({root,G:{step:0,streak:0,district:1,dxp:0},ev:{cls:'BOOKED'},now:Date.now(),d,L:{booked:3,gk:0,disc:0,calls:30,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});return g.some(a=>a.id==='b2')&&g.some(a=>a.id==='b3')&&g.some(a=>a.id==='b1')});
 t('ачивка выдаётся один раз',()=>{const root={ach:{v50:1}};const g=evaluate({root,G:{step:0,streak:0,district:1,dxp:0},ev:{cls:'TRASH'},now:Date.now(),d:{n:60,c:{},od:0,first:Date.now()},L:{booked:0,gk:0,disc:0,calls:60,spent:0},rank:0,meta:{owned:{}},lvl:0,sinceBefore:0});return !g.some(a=>a.id==='v50')});
 return o}
