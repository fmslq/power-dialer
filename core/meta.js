import {CONFIG as C,districtThr} from './config.js';
// Мета-данные THE GRID / HQ. Хранятся в root.meta (вне состояния игры, чтобы Undo их не откатывал).
export const DIST=[ // [название, акцент, тема, босс, подпись босса]
 ['Scrapyard','#c28a4a','industrial','Король Свалки','самодельная броня из холодильников'],['Industrial Zone','#ff7a2b','industrial','Начальник Смены Ржавый','гидравлика вместо рук'],
 ['Neon Docks','#ff2bd6','neon','Контрабандист','неоновая маска, ни слова правды'],['Night Market','#ffb400','neon','Хозяин Ночного Рынка','торгует всем, кроме совести'],
 ['Commercial Hub','#4aa3ff','chrome','Менеджер по Продажам Всего','улыбка в 40 зубов'],['Chrome Plaza','#c9d6e2','chrome','Хромированный Лоббист','отполирован до отказа'],
 ['Cyber-Downtown','#ffc400','blackgold','Киберсамурай-Аудитор','проверяет твои отчёты катаной'],['Financial Spire','#ffd45a','blackgold','Банкир-призрак','проходит сквозь стены и кредиты'],
 ['Sky District','#e8c35a','blackgold','Барон Облаков','владеет погодой и ипотекой'],['Aerospace Ring','#7fd7ff','orbital','Адмирал Орбиты','командует тишиной'],
 ['Orbital Station','#39ff14','orbital','ARCHON','взбесившийся ИИ станции'],['The Summit','#ffffff','blackgold','Председатель Совета','последний, кто никогда не берёт трубку']];
const T=[[.5,'дешёвый'],[1.5,'средний'],[4,'showpiece']],S=[ // [дешёвый,средний,showpiece, слот]
 ['Лампочка на проводе','Стол из двери + ЭЛТ','Дизель «Старый Сергей»'],['Стальная дверь с засовом','Стена из ЭЛТ-мониторов','Пресс «Переговорщик»'],
 ['Неоновая вывеска «BOOKED»','Голо-терминал','Лофт в контейнере'],['Тележка с «корпоративным рамен»','Дроны с фонарями','Телохранитель в очках'],
 ['Кожаное кресло','Стеклянная переговорная','Стол из красного дерева'],['Хромированный фонтан','Робот-секретарь','Голо-билборд с лого'],
 ['Панорамное окно','Стена серверов','Охрана в экзоскелетах'],['Золотой биржевой тикер','Дверь хранилища','Личный лифт на крышу'],
 ['Скайбридж-мост','Сад с карпами кои','Вертолёт на крыше'],['Кресло невесомости','Рой дронов-охраны','Голографический глобус'],
 ['Иллюминатор с Землёй','ИИ-дворецкий','Стол из метеорита'],['Золотой единорог','Голо-совет (кланяется)','Трон CEO']];
export const SHOP_ITEMS=S.flatMap((r,d)=>r.map((name,t)=>({id:`d${d+1}t${t}`,district:d+1,name,tier:T[t][1],mult:T[t][0],slot:d*3+t,
 price:price(d+1,T[t][0]),description:`${DIST[d][0]}: ${T[t][1]}`,imgPath:`img/hq/d${d+1}t${t}.png`,placeholder:true})));
export const COSMETICS=[['trail-cyan','Trail: циан',.5],['trail-magenta','Trail: маджента',.5],['trail-gold','Trail: золото',1],['trail-red','Trail: красный',1],
 ['stamp-iron','Печать: чугун',1],['stamp-neon','Печать: неон',1.5],['stamp-gold','Печать: золото',2]].map(([id,name,m])=>({id,name,price:Math.round(m*C.assumedDailyMoney),applies:true,slot:id.split('-')[0]}));
export function price(d,mult){return Math.round(mult*C.assumedDailyMoney*C.districts[d-1][3])}
export const newMeta=()=>({owned:{},bossIntro:{},staggered:{},captured:{},equip:{}});
// косметика: одна надета в каждом слоте (trail — след фигурки на карте, stamp — материал печати статуса). Покупка сразу надевает.
export const TRAIL_COL={'trail-cyan':'#3ad7ff','trail-magenta':'#ff2bd6','trail-gold':'#ffd45a','trail-red':'#ff1f3d'};
export function equip(meta,id){const it=COSMETICS.find(x=>x.id===id);if(!it||!meta.owned[id])return false;meta.equip=meta.equip||{};meta.equip[it.slot]=meta.equip[it.slot]===id?null:id;return true}
export const equipped=(meta,slot)=>((meta&&meta.equip)||{})[slot]||null;
export const baseStage=d=>d>=11?3:d>=8?2:d>=4?1:0;                 // гараж → лофт → офис → башня
export const available=(s,item)=>item.district<=s.district;
export function buy(s,meta,id){const it=SHOP_ITEMS.find(x=>x.id===id)||COSMETICS.find(x=>x.id===id);if(!it)return{ok:false,why:'нет такого'};
 if(meta.owned[id])return{ok:false,why:'уже куплено'};if(it.district&&!available(s,it))return{ok:false,why:'район закрыт'};
 if(s.money<it.price)return{ok:false,why:'не хватает $'+(it.price-s.money)};
 s.money-=it.price;s.undo.length=0;meta.owned[id]=Date.now();if(it.slot){meta.equip=meta.equip||{};meta.equip[it.slot]=id}return{ok:true,item:it}}   // покупка закрывает Undo (иначе откат вернёт деньги)
export const bossHp=s=>{const t=districtThr(s.district),p=C.bossPhaseShare;return Math.max(0,Math.min(1,(t-s.dxp)/(t*p)))};
export function runMetaTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('косметика: покупка надевает, повтор снимает, чужое не надеть',()=>{const m=newMeta(),g={money:1e6,undo:[],district:1};buy(g,m,'trail-gold');const a=equipped(m,'trail')==='trail-gold';equip(m,'trail-gold');return a&&!equipped(m,'trail')&&!equip(m,'stamp-gold')});
 t('36 предметов, по 3 на район',()=>SHOP_ITEMS.length===36&&SHOP_ITEMS.every(x=>x.price>0));
 t('цены 0.5/1.5/4 дня × yield района',()=>SHOP_ITEMS[2].price===Math.round(4*C.assumedDailyMoney)&&SHOP_ITEMS[3].price===Math.round(.5*C.assumedDailyMoney*1.2));
 t('покупка: район закрыт / не хватает / ок',()=>{const s={district:1,money:0,undo:[1]},m=newMeta();return buy(s,m,'d2t0').why==='район закрыт'&&buy(s,m,'d1t0').why.startsWith('не хватает')&&(s.money=9999,buy(s,m,'d1t0').ok)&&s.undo.length===0&&buy(s,m,'d1t0').why==='уже куплено'});
 t('HP босса = последние 10% шкалы',()=>{const s={district:3,dxp:0};const th=C.districts[2];s.dxp=Math.round(th[2]*C.assumedDailyXp*th[3]*.95);const h=bossHp(s);return h>.45&&h<.55});
 t('база растёт: гараж→лофт→офис→башня',()=>[1,4,8,11].map(baseStage).join()==='0,1,2,3');
 return o}
