// E4 / библия §5: проходы на границах (в коде — keys). Без ключа район открыт, XP и $ идут как обычно, но прогресс района копится в G.keyHold
// и засчитывается сразу, как только ключ получен. Каждая граница — своё условие и своя сцена.
import {CONFIG as C,shiftMoneyAt,PRICE_GROW} from './config.js';
import {SHOP_ITEMS} from './meta.js';
const S=(who,t)=>({who,t});
// v2 (кусок 16): это не «ключи», а проходы — у каждой границы своя вещь, свой человек и свой кусок общей тайны (библия §5, §13).
export const KEYS=[
 {id:'k1',d:3,n:'Антенна на крышу',kind:'Вещь',who:'Лом',how:'buy',req:{money:1,TALK:10},act:'Поставить антенну',
  why:'Сигнал из гаража не дотягивается до порта. Нужна антенна повыше. Лом знает, где её взять. Если Ржавый на твоей стороне — денег не надо.',
  sc:[S('Лом','Порт? Оттуда тебя не слышно. Гараж низкий, крыши нет.'),S('Лом','Антенна есть. Стояла на проходной Ржавого с тех времён, когда тут была «Заря». Двадцать лет никто не снимал.'),S('Гудок','«Заря»… Слово знакомое. Не помню откуда. Ладно. Десять настоящих разговоров — и Лом поверит, что ты умеешь говорить с людьми.'),S('Гудок','Антенна стоит. Слышишь? Порт отвечает помехами. Значит, слышит.')]},
 {id:'k2',d:5,n:'Пропуск охранника',kind:'Человек',who:'Охранник Хаба',how:'gift',req:{GATEKEEPER:15},act:'Забрать пропуск',
  why:'В деловой центр пускают только по пропуску. Охранник на входе не берёт денег. Ему нужно другое.',
  sc:[S('Охранник Хаба','Денег не надо. Я двадцать лет на дверях. Раньше стоял у «Зари», в ту самую ночь. Знаешь, кто мне звонит с тех пор? Никто.'),S('Охранник Хаба','Прозвони пятнадцать таких, как я. Секретарш, ресепшен. Тех, кто стоит у двери. Скажи им «здравствуйте» по-человечески.'),S('Гудок','Он хочет, чтобы кто-то вспомнил о тех, кто стоит у двери. Это мы умеем.'),S('Охранник Хаба','Пятнадцать. Я слышал каждого. Держи пропуск. И… если найдёшь, кто звонил в ту ночь последним, — скажи мне.')]},
 {id:'k3',d:7,n:'Ключ-карта Совета',kind:'Обмен',who:'Лом',how:'swap',req:{swap:['d5t0','d5t1','d5t2','d6t0','d6t1','d6t2'],money:.5},act:'Отдать вещь Лому',
  why:'В стеклянный центр не пускают без карты Совета. Карту не купишь — её собирают из хрома. Из твоего. Если Менеджер или Лоббист на твоей стороне — без денег.',
  sc:[S('Лом','Карту Совета не купишь. Её собирают из хрома и чужого бейджа.'),S('Лом','Отдай одну вещь с базы — из Хаба или Плазы. Разберу. Обратно не соберу.'),S('Гудок','Жалко. Но вещи — это ток, который застыл. Он снова потечёт.'),S('Лом','…Я когда-то уже паял такую. Для одной девчонки с «Зари». Не спрашивай. Держи карту.')]},
 {id:'k4',d:9,n:'Приглашение наверх',kind:'Встреча',who:'Лифтёр',how:'buy',req:{money:.8,BOOKED:1},act:'Подняться',
  why:'В Высоты ведёт один лифт. Лифтёр поднимает только тех, кого наверху ждут.',
  sc:[S('Лифтёр','Наверх ездят те, кого ждут. Тебя кто-нибудь ждёт?'),S('Гудок','Одна назначенная встреча. Одна — и он поверит.'),S('Лифтёр','Встреча есть. Билет оплачен. Последний раз я так поднимал Председателя. Двадцать лет назад, утром после «Зари». Он молчал всю дорогу.')]},
 {id:'k5',d:10,n:'Позывной',kind:'Имя',who:'Гудок',how:'gift',req:{od:1},act:'Выбрать позывной',cs:['Звонарь','Полночь','Эхо'],
  why:'В эфир Аэропорта не выйти без позывного. Его не продают. Его дают — и выбирают.',
  sc:[S('Гудок','Чтобы выйти в эфир, нужен позывной. Я долго думал, как тебя звать.'),S('Гудок','Покажи мне Overdrive. Двадцать пять подряд и голос владельца. Тогда я пойму, кто ты.'),S('Гудок','…Вот. «Заря, соединяю»… Стоп. Почему я это сказал? Неважно. Выбирай имя.')]},
 {id:'k6',d:12,n:'Трубка Лома',kind:'Память',who:'Лом',how:'gift',req:{day:100},act:'Взять трубку',
  why:'На вершину ведёт одна линия. Трубка, с которой она начиналась, двадцать лет лежит у Лома.',
  sc:[S('Лом','Это трубка с пульта «Зари». Я снял её той ночью, когда всё рухнуло. Сто вызовов она соединила до утра. Сто первый не взяли.'),S('Лом','Сто звонков за один день. Ровно как она тогда. Сделаешь — отдам. Чтобы знал, что ты не бросишь на полпути.'),S('Лом','Сто. Держи. Скажи ему то, что не сказал я. И то, что не успела сказать она.')]}];
export const keyFor=d=>KEYS.find(k=>k.d===d)||null;
const st=save=>save.keys||(save.keys={});
// первый запуск после обновления: ключи районов, до которых игрок уже дошёл, выдаются (без задним числом блокировок)
export function keysInit(save,G){if(save.keys)return;const K=st(save);for(const k of KEYS)if(k.d<=G.district)K[k.id]={open:0,c:{},od:0,day:0,got:Date.now(),grand:1}}
export const needKey=(save,G)=>{const k=keyFor(G.district);if(!k)return null;const s=st(save)[k.id];return s&&s.got?null:k};
export const keyMoney=(k)=>Math.round((k.req.money||0)*shiftMoneyAt(k.d-1)*PRICE_GROW(k.d-1));
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
 let m=R.money?keyMoney(k):0;if(k.id==='k3'&&(['ally','deal'].includes(ally.b5)||['ally','am','mid','pm'].includes(ally.b6)))m=0;   // библия: бесплатно, если Менеджер или Лоббист на твоей стороне
 if(k.id==='k1'&&['ally','gate'].includes(ally.b2))m=0;   // Ржавый с проходной помогает с антенной
 if(m)L.push({t:'Деньги',v:Math.min(m,Math.max(0,Math.round(G.money))),n:m,money:1});
 return{list:L,ok:L.every(x=>x.v>=x.n),money:m}}
export function takeKey(save,G,id,swapId,cs){const k=KEYS.find(x=>x.id===id);if(!k)return{ok:false,why:'нет ключа'};const s=keyState(save,k);if(s.got)return{ok:false,why:'уже есть'};
 const q=keyReqs(save,G,k);if(!q.ok)return{ok:false,why:'условия не выполнены'};
 if(k.req.swap){const it=swapId&&k.req.swap.includes(swapId)&&save.meta.owned[swapId]?swapId:(q.list.find(x=>x.swap)||{swap:[]}).swap[0];if(!it)return{ok:false,why:'нечего обменять'};
  delete save.meta.owned[it];if(save.meta.equip)for(const sl in save.meta.equip)if(save.meta.equip[sl]===it)save.meta.equip[sl]=null;s.swapped=it}
 if(q.money){G.money-=q.money;G.undo.length=0}                           // как покупка: закрывает Undo
 if(k.cs){const st=save.story||(save.story={}),c=st.ch||(st.ch={});c.cs=k.cs.includes(cs)?cs:k.cs[0]}
 s.got=Date.now();const h=G.keyHold||0;G.dxp+=h;G.keyHold=0;return{ok:true,key:k,released:h,swapped:s.swapped?SHOP_ITEMS.find(x=>x.id===s.swapped):null}}
