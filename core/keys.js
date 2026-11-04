// E4 / библия §5: ключи на границах. Без ключа район открыт, XP и $ идут как обычно, но прогресс района копится в G.keyHold
// и засчитывается сразу, как только ключ получен. Каждая граница — своё условие и своя сцена.
import {CONFIG as C} from './config.js';
import {SHOP_ITEMS} from './meta.js';
const S=(who,t)=>({who,t});
export const KEYS=[
 {id:'k1',d:3,n:'Антенна на крышу',who:'Лом',how:'buy',req:{money:1,TALK:10},act:'Купить у Лома',
  why:'Сигнал из гаража не дотягивается до порта. Нужна антенна повыше.',
  sc:[S('Лом','Порт? Оттуда тебя не слышно, малыш. Гараж низкий, крыши нет.'),S('Лом','Есть у меня антенна. Снял с проходной Ржавого, пока он считал пропуска.'),S('Гудок','Он берёт деньги. И хочет услышать, что ты умеешь говорить с людьми. Десять настоящих разговоров.'),S('Лом','Держи. Ставь на крышу. Теперь порт услышит.')]},
 {id:'k2',d:5,n:'Пропуск охранника',who:'Охранник Хаба',how:'gift',req:{GATEKEEPER:15},act:'Забрать пропуск',
  why:'В деловой центр пускают только по пропуску. Охранник на входе не берёт денег.',
  sc:[S('Охранник Хаба','Денег не надо. Я двадцать лет на проходной. Знаешь, кто мне звонит? Никто.'),S('Охранник Хаба','Прозвони пятнадцать таких, как я. Секретарш, ресепшен. Тех, кто стоит у двери.'),S('Гудок','Он хочет, чтобы кто-то поговорил с привратниками. Это честная цена.'),S('Охранник Хаба','Пятнадцать. Слышал каждого. Проходи. И… звони иногда.')]},
 {id:'k3',d:7,n:'Ключ-карта Совета',who:'Лом',how:'swap',req:{swap:['d5t0','d5t1','d5t2','d6t0','d6t1','d6t2'],money:.5},act:'Обменять предмет',
  why:'В стеклянный центр не пускают без карты Совета. Лом соберёт её — но из твоего хрома.',
  sc:[S('Лом','Карту Совета не купишь. Её собирают. Из хрома и чужого бейджа.'),S('Лом','Отдай одну вещь с базы — из Хаба или Плазы. Я её разберу. Обратно не соберу.'),S('Гудок','Жалко. Но вещи — это просто ток, который застыл. Он снова потечёт.'),S('Лом','Вот. Пахнет кабинетом. Не потеряй.')]},
 {id:'k4',d:9,n:'Код лифта Шпиля',who:'Лифтёр',how:'buy',req:{money:.8,BOOKED:1},act:'Купить код',
  why:'В небесный район ведёт один лифт. Лифтёр открывает его только тем, кто уже назначал встречу.',
  sc:[S('Лифтёр','Наверх ездят те, кого ждут. Тебя кто-нибудь ждёт?'),S('Гудок','Одна встреча. Одна назначенная встреча — и он поверит.'),S('Лифтёр','Встреча есть. Деньги есть. Код — семь-семь-ноль. Не говори никому.')]},
 {id:'k5',d:10,n:'Позывной',who:'Гудок',how:'gift',req:{od:1},act:'Принять позывной',
  why:'В эфир Аэропорта не выйти без позывного. Его не продают — его дают.',
  sc:[S('Гудок','Чтобы выйти в эфир, нужен позывной. Я долго думал, как тебя называть.'),S('Гудок','Покажи мне Overdrive. Двадцать пять подряд и голос владельца. Тогда я пойму, кто ты.'),S('Гудок','…Вот. Теперь я знаю твоё имя. Это и есть позывной.')]},
 {id:'k6',d:12,n:'Трубка Лома',who:'Лом',how:'gift',req:{day:100},act:'Взять трубку',
  why:'На вершину ведёт одна линия. Трубка, с которой она начиналась, у Лома.',
  sc:[S('Лом','Двадцать лет я её не трогал. Сто звонков за день — и я отдам. Чтобы знал, что ты не бросишь на полпути.'),S('Лом','Сто. Ровно как тогда. Держи. Скажи ему то, что не сказал я.')]}];
export const keyFor=d=>KEYS.find(k=>k.d===d)||null;
const st=save=>save.keys||(save.keys={});
// первый запуск после обновления: ключи районов, до которых игрок уже дошёл, выдаются (без задним числом блокировок)
export function keysInit(save,G){if(save.keys)return;const K=st(save);for(const k of KEYS)if(k.d<=G.district)K[k.id]={open:0,c:{},od:0,day:0,got:Date.now(),grand:1}}
export const needKey=(save,G)=>{const k=keyFor(G.district);if(!k)return null;const s=st(save)[k.id];return s&&s.got?null:k};
export const keyMoney=(k)=>Math.round((k.req.money||0)*C.assumedDailyMoney*C.districts[k.d-2][3]);
export function keyState(save,k){const K=st(save);return K[k.id]||(K[k.id]={open:Date.now(),c:{},od:0,day:0,got:0})}
// счёт условий (вызывается после статуса, когда ключ нужен)
export function keyTrack(save,G,ev,dayN){const k=needKey(save,G);if(!k||!ev)return null;const s=keyState(save,k);s.c[ev.cls]=(s.c[ev.cls]||0)+1;if(ev.odStart)s.od++;s.day=Math.max(s.day,dayN||0);return k}
export function keyReqs(save,G,k){const s=keyState(save,k),R=k.req,L=[];const ally=save.story&&save.story.ch||{};
 if(R.TALK)L.push({t:'Разговоров с владельцем',v:Math.min(R.TALK,(s.c.TALK||0)+(s.c.CALLBACK||0)+(s.c.BOOKED||0)+(s.c.DISCOVERY||0)),n:R.TALK});
 if(R.GATEKEEPER)L.push({t:'Гейткиперов',v:Math.min(R.GATEKEEPER,s.c.GATEKEEPER||0),n:R.GATEKEEPER});
 if(R.BOOKED)L.push({t:'Назначенных встреч',v:Math.min(R.BOOKED,(s.c.BOOKED||0)+(s.c.DISCOVERY||0)),n:R.BOOKED});
 if(R.od)L.push({t:'Overdrive',v:Math.min(R.od,s.od),n:R.od});
 if(R.day)L.push({t:'Наборов за один день',v:Math.min(R.day,s.day),n:R.day});
 if(R.swap){const own=R.swap.filter(id=>save.meta&&save.meta.owned&&save.meta.owned[id]);L.push({t:'Предмет на обмен (Хаб или Плаза)',v:own.length?1:0,n:1,swap:own})}
 let m=R.money?keyMoney(k):0;if(k.id==='k3'&&(ally.b5==='ally'||ally.b6==='ally'))m=0;   // библия: скидка, если отпустил Менеджера или Лоббиста
 if(m)L.push({t:'Деньги',v:Math.min(m,Math.max(0,Math.round(G.money))),n:m,money:1});
 return{list:L,ok:L.every(x=>x.v>=x.n),money:m}}
export function takeKey(save,G,id,swapId){const k=KEYS.find(x=>x.id===id);if(!k)return{ok:false,why:'нет ключа'};const s=keyState(save,k);if(s.got)return{ok:false,why:'уже есть'};
 const q=keyReqs(save,G,k);if(!q.ok)return{ok:false,why:'условия не выполнены'};
 if(k.req.swap){const it=swapId&&k.req.swap.includes(swapId)&&save.meta.owned[swapId]?swapId:(q.list.find(x=>x.swap)||{swap:[]}).swap[0];if(!it)return{ok:false,why:'нечего обменять'};
  delete save.meta.owned[it];if(save.meta.equip)for(const sl in save.meta.equip)if(save.meta.equip[sl]===it)save.meta.equip[sl]=null;s.swapped=it}
 if(q.money){G.money-=q.money;G.undo.length=0}                           // как покупка: закрывает Undo
 s.got=Date.now();const h=G.keyHold||0;G.dxp+=h;G.keyHold=0;return{ok:true,key:k,released:h,swapped:s.swapped?SHOP_ITEMS.find(x=>x.id===s.swapped):null}}
