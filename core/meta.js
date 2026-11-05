import {CONFIG as C,districtThr,shiftMoneyAt,PRICE_GROW} from './config.js';
// Мета-данные THE GRID / HQ. Хранятся в root.meta (вне состояния игры, чтобы Undo их не откатывал).
export const DIST=[ // [название, акцент, тема, босс, подпись босса]
 ['Scrapyard','#c28a4a','industrial','Король Свалки','самодельная броня из холодильников'],['Industrial Zone','#ff7a2b','industrial','Начальник Смены Ржавый','гидравлика вместо рук'],
 ['Neon Docks','#ff2bd6','neon','Контрабандист','неоновая маска, ни слова правды'],['Night Market','#ffb400','neon','Хозяин Ночного Рынка','торгует всем, кроме совести'],
 ['Commercial Hub','#4aa3ff','chrome','Менеджер по Продажам Всего','улыбка в 40 зубов'],['Chrome Plaza','#c9d6e2','chrome','Хромированный Лоббист','отполирован до отказа'],
 ['Cyber-Downtown','#ffc400','blackgold','Киберсамурай-Аудитор','проверяет твои отчёты катаной'],['Financial Spire','#ffd45a','blackgold','Банкир-призрак','проходит сквозь стены и кредиты'],
 ['Sky District','#e8c35a','blackgold','Барон Облаков','владеет погодой и ипотекой'],['Airport Ring','#7fd7ff','orbital','Адмирал Эфира','приказал диспетчерам молчать'],
 ['The Station','#39ff14','orbital','ARCHON','взбесившийся ИИ станции'],['The Summit','#ffffff','blackgold','Председатель Совета','последний, кто никогда не берёт трубку']];
// РЫНОК v2 (кусок 18). Предметы больше не «по 3 на район»: в районе их 2–4, и каждый следующий в среднем заметно сильнее
// прошлого (бонусы — core/buffs.js). Появление полки объясняет сюжет района или конец прошлого (story/systems.js, SHELF).
// id остаются прежними (спрайты, слоты, сохранения), район у части предметов другой: ЭЛТ-стена — с Ночного Рынка (4),
// голо-билборд — трофей Лоббиста, появляется после Хром-Плазы (7). Новые: n9 (Высоты), n12 (Вершина).
// [id, район, ступень, название]; ступень: c — дешёвый, m — средний, m2 — редкий, s — showpiece
export const TIERS={c:[.5,'дешёвый'],m:[1.5,'средний'],m2:[2.2,'редкий'],s:[4,'showpiece']};
const CAT=[
 ['d1t0',1,'c','Лампочка на проводе'],['d1t1',1,'m','Стол из двери + ЭЛТ'],['d1t2',1,'s','Генератор «Ре минор»'],
 ['d2t0',2,'c','Стальная дверь с засовом'],['d2t2',2,'s','Пресс Ржавого'],
 ['d3t0',3,'c','Вывеска «BOOKED»'],['d3t1',3,'m','Голо-терминал'],['d3t2',3,'s','Контейнер-лофт'],
 ['d4t0',4,'c','Тележка с раменом'],['d4t1',4,'m','Дроны с фонарями'],['d2t1',4,'m2','Стена из ЭЛТ-мониторов'],['d4t2',4,'s','Телохранитель в очках'],
 ['d5t0',5,'c','Кожаное кресло'],['d5t1',5,'m','Стеклянная переговорная'],['d5t2',5,'s','Стол из красного дерева'],
 ['d6t0',6,'c','Хромированный фонтан'],['d6t1',6,'s','Робот-секретарь «Соединяю»'],
 ['d7t0',7,'c','Панорамное окно'],['d6t2',7,'m','Голо-билборд'],['d7t1',7,'m2','Стена серверов'],['d7t2',7,'s','Охрана в экзоскелетах'],
 ['d8t0',8,'c','Золотой биржевой тикер'],['d8t1',8,'m','Дверь хранилища'],['d8t2',8,'s','Личный лифт на крышу'],
 ['d9t0',9,'c','Кусок стеклянного моста'],['d9t1',9,'m','Пруд с карпами'],['n9',9,'m2','Метеостанция Барона'],['d9t2',9,'s','Вертолёт на крыше'],
 ['d10t0',10,'c','Кресло пилота'],['d10t1',10,'m','Рой дронов Адмирала'],['d10t2',10,'s','Карта города из диспетчерской'],
 ['d11t0',11,'c','Иллюминатор станции'],['d11t1',11,'m','ИИ-дворецкий'],['d11t2',11,'s','Стол из антенны'],
 ['d12t0',12,'c','Золотой единорог'],['n12',12,'m2','Красный телефон'],['d12t1',12,'m','Голограммы Совета'],['d12t2',12,'s','Кресло Председателя']];
export const SHOP_ITEMS=CAT.map(([id,d,tk,name],slot)=>({id,district:d,name,tk,tier:TIERS[tk][1],mult:TIERS[tk][0],slot,
 price:price(d,TIERS[tk][0]),description:`${DIST[d-1][0]}: ${TIERS[tk][1]}`,imgPath:`img/hq/${id}.png`,placeholder:true}));
export const showpiece=d=>SHOP_ITEMS.find(x=>x.district===d&&x.tk==='s');
export const COSMETICS=[['trail-cyan','След: голубой',.5],['trail-magenta','След: розовый',.5],['trail-gold','След: золотой',1],['trail-red','След: красный',1],
 ['stamp-iron','Печать: чугун',1],['stamp-neon','Печать: неон',1.5],['stamp-gold','Печать: золото',2]].map(([id,name,m])=>({id,name,price:Math.round(m*C.assumedDailyMoney),applies:true,slot:id.split('-')[0]}));
export function price(d,mult){return Math.round(mult*shiftMoneyAt(d)*PRICE_GROW(d))}
export const newMeta=()=>({owned:{},bossIntro:{},staggered:{},captured:{},equip:{}});
// косметика: одна надета в каждом слоте (trail — след фигурки на карте, stamp — материал печати статуса). Покупка сразу надевает.
export const TRAIL_COL={'trail-cyan':'#3ad7ff','trail-magenta':'#ff2bd6','trail-gold':'#ffd45a','trail-red':'#ff1f3d'};
export function equip(meta,id){const it=COSMETICS.find(x=>x.id===id);if(!it||!meta.owned[id])return false;meta.equip=meta.equip||{};meta.equip[it.slot]=meta.equip[it.slot]===id?null:id;return true}
export const equipped=(meta,slot)=>((meta&&meta.equip)||{})[slot]||null;
export const baseStage=d=>d>=11?3:d>=8?2:d>=4?1:0;                 // гараж → лофт → офис → башня
export const available=(s,item)=>item.district<=s.district;
export function buy(s,meta,id){const it=SHOP_ITEMS.find(x=>x.id===id)||COSMETICS.find(x=>x.id===id);if(!it)return{ok:false,why:'нет такого'};
 if(meta.owned[id])return{ok:false,why:'уже куплено'};if(it.district&&!available(s,it))return{ok:false,why:'район закрыт'};
 const pr=Math.round(it.price*(1-((meta.disc||{})[id]||0)));if(s.money<pr)return{ok:false,why:'не хватает $'+(pr-s.money)};
 s.money-=pr;s.undo.length=0;meta.owned[id]=Date.now();if(it.slot){meta.equip=meta.equip||{};meta.equip[it.slot]=id}return{ok:true,item:it}}   // покупка закрывает Undo (иначе откат вернёт деньги)
export const bossHp=s=>{const t=districtThr(s.district),p=C.bossPhaseShare;return Math.max(0,Math.min(1,(t-s.dxp)/(t*p)))};
export function runMetaTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('косметика: покупка надевает, повтор снимает, чужое не надеть',()=>{const m=newMeta(),g={money:1e6,undo:[],district:1};buy(g,m,'trail-gold');const a=equipped(m,'trail')==='trail-gold';equip(m,'trail-gold');return a&&!equipped(m,'trail')&&!equip(m,'stamp-gold')});
 t('38 предметов, в районе от 2 до 4, у каждого района один showpiece',()=>{const n=d=>SHOP_ITEMS.filter(x=>x.district===d).length;return SHOP_ITEMS.length===38&&SHOP_ITEMS.every(x=>x.price>0)&&Array.from({length:12},(_,i)=>n(i+1)).every(v=>v>=2&&v<=4)&&new Set(Array.from({length:12},(_,i)=>n(i+1))).size>=3&&Array.from({length:12},(_,i)=>showpiece(i+1)).every(Boolean)});
 t('цены 0.5/1.5/2.2/4 дня дохода района × рост усилия',()=>SHOP_ITEMS[2].price===Math.round(4*C.assumedDailyMoney)&&SHOP_ITEMS[3].price===Math.round(.5*shiftMoneyAt(2)*PRICE_GROW(2))&&SHOP_ITEMS.find(x=>x.id==='d2t1').price===Math.round(2.2*shiftMoneyAt(4)*PRICE_GROW(4)));
 t('покупка: район закрыт / не хватает / ок',()=>{const s={district:1,money:0,undo:[1]},m=newMeta();return buy(s,m,'d2t0').why==='район закрыт'&&buy(s,m,'d1t0').why.startsWith('не хватает')&&(s.money=9999,buy(s,m,'d1t0').ok)&&s.undo.length===0&&buy(s,m,'d1t0').why==='уже куплено'});
 t('HP босса = последние 10% шкалы',()=>{const s={district:3,dxp:0};s.dxp=Math.round(districtThr(3)*.95);const h=bossHp(s);return h>.45&&h<.55});
 t('база растёт: гараж→лофт→офис→башня',()=>[1,4,8,11].map(baseStage).join()==='0,1,2,3');
 return o}
