// I4 (кусок 20): КОЛЛЕКТОР — база связистов под «Зарёй». Кабельные тоннели старой станции: вся медь сети лежит здесь,
// и голос по ней идёт чище — поэтому связисты живут внизу, у главного кабеля (STORY_BIBLE §12.4).
// Участок (у Лома) → здания разной вместимости в слотах → Связисты занимают места → у каждого может быть ОДИН девайс.
// Девайсы продаёт Лом (магазин базы, вкладка «Девайсы»), и только в день, когда сделано 50+ звонков: «отработай — спущусь».
// Состояние: root.ad.ops = {rooms,n,def, plot, bld:[ид здания по слотам], dev:{номерСвязиста:идДевайса}, inv:{идДевайса:шт}, shop:{k,got:[]}}
// Старые «комнаты» (rooms) превращаются в «Каморки» на первом участке — ничего не теряется.
export const COL={perOp:.8,
 plots:[{n:'Главный кабель',cost:1200,slots:6,d:1,t:'Первый тоннель под твоей базой. Здесь лежит главный кабель «Зари»: от него идут линии во все районы.'},
  {n:'Дальний тоннель',cost:9000,slots:6,d:6,t:'Тоннель уходит под весь город. Его давно засыпало, но кабель внутри целый.'},
  {n:'Узел «Зари»',cost:38000,slots:6,d:10,t:'Самый нижний уровень. Сюда сходятся все тоннели города, и все линии «Зари» встречаются в одном зале.'}],
 BLD:[{id:'tent',n:'Палатка связиста',cap:2,cost:600,d:1,t:'Брезент, две раскладушки, полевой телефон на ящике.'},
  {id:'room',n:'Каморка',cap:5,cost:1500,d:1,t:'Бывшая будка обходчика. Пятеро, плечом к плечу, у одного провода.'},
  {id:'hall',n:'Аппаратная',cap:10,cost:5200,d:3,t:'Зал со стойками «Зари». Десять мест у живых гнёзд.'},
  {id:'node',n:'Узловая',cap:20,cost:16000,d:6,t:'Перекрёсток четырёх тоннелей. Двадцать голосов на одном кабеле.'}],
 DEV:[{id:'hs',n:'Наушники «Заря»',r:'u',b:.5,cost:300,t:'Старые, в коже. Слышат тише шёпота.'},
  {id:'mic',n:'Угольный микрофон',r:'u',b:.6,cost:380,t:'Трещит, но не врёт.'},
  {id:'amp',n:'Ламповый усилитель',r:'r',b:1.1,cost:950,t:'Греется, гудит, тянет слабую несущую.'},
  {id:'flt',n:'Шумовой фильтр',r:'r',b:1.3,cost:1200,t:'Самодельный. Убирает из линии шум, который подмешивает ARCHON, и голос становится чище.'},
  {id:'qz',n:'Кварцевый приёмник',r:'e',b:2,cost:2600,t:'Кристалл с крыши «Зари». Берёт голос с того края города, где ламповый уже сдаётся.'},
  {id:'cord',n:'Шнур из гнезда ноль',r:'l',b:3.5,cost:7000,t:'Лом клянётся, что это не тот самый. Гудок молчит.'}],
 devDay:50,stockN:3,
 // К24: обучение связиста. Каждый уровень — ещё +per% к XP и $. Потолок уровня растёт с районами: в районах 1–2 — уровень 1, 3–4 — 2, … 11–12 — 6.
 train:{per:.3,max:6,cost:lv=>Math.round(350*Math.pow(1.85,lv))}};
export const lvCap=d=>Math.max(1,Math.min(COL.train.max,Math.ceil((d|0)/2)));
export const lvFromD=lv=>2*lv+1;     // с какого района можно поднять связиста до уровня lv+1
export const lvOf=(o,i)=>((o.lv||{})[i]|0);
const H=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const W={u:6,r:3,e:1.4,l:.5};
export const bldOf=id=>COL.BLD.find(x=>x.id===id)||null;
export const devOf=id=>COL.DEV.find(x=>x.id===id)||null;
// миграция и дефолты (a — уже ensure-нутый root.ad)
export function colEnsure(a){const o=a.ops||(a.ops={rooms:0,n:0});if(!Array.isArray(o.bld)){o.bld=Array.from({length:Math.min(o.rooms|0,COL.plots[0].slots)},()=>'room');o.plot=o.bld.length?1:(o.plot|0)}
 while(o.bld.filter(Boolean).length<(o.rooms|0)&&o.bld.length<COL.plots[0].slots)o.bld.push('room');if(o.bld.some(Boolean)&&!o.plot)o.plot=1;   // старый код мог прибавить rooms напрямую
 o.dev=o.dev||{};o.lv=o.lv||{};o.inv=o.inv||{};o.shop=o.shop||{k:'',got:[]};o.plot=o.plot|0;o.rooms=o.bld.filter(Boolean).length;return o}
export const slotsOf=o=>COL.plots.slice(0,o.plot|0).reduce((s,p)=>s+p.slots,0);
export const capOf=o=>(o.bld||[]).reduce((s,b)=>s+((bldOf(b)||{}).cap||0),0)+(Array.isArray(o.bld)?0:(o.rooms|0)*5);
// бонус всех связистов: perOp каждому + девайс (если надет) + перебежчики (как раньше, perOp)
export function opsBonus(a){const o=a.ops||{};let b=((o.n|0)+(o.def||[]).length)*COL.perOp;for(const k in o.dev||{}){if(+k<(o.n|0)){const d=devOf(o.dev[k]);if(d)b+=d.b}}for(const k in o.lv||{})if(+k<(o.n|0))b+=(o.lv[k]|0)*COL.train.per;return b}
// прибавка одного связиста: база + уровни + прибор
export const opGain=(o,i)=>{const d=devOf((o.dev||{})[i]);return COL.perOp+lvOf(o,i)*COL.train.per+(d?d.b:0)};
// обучить связиста i: +1 уровень, если позволяет район
export function trainOp(a,G,i,district=1){const o=colEnsure(a);if(i<0||i>=(o.n|0))return{ok:false,why:'нет такого связиста'};const lv=lvOf(o,i);
 if(lv>=COL.train.max)return{ok:false,why:'это самый высокий уровень'};if(lv>=lvCap(district))return{ok:false,why:`следующий уровень — с района ${lvFromD(lv)}`};
 const c=COL.train.cost(lv);if(G.money<c)return{ok:false,why:'нужно $'+c};G.money-=c;o.lv[i]=lv+1;return{ok:true,cost:c,lv:lv+1}}
// кто где сидит: связисты по порядку заполняют здания по слотам
export function seating(o){const out=[];let i=0;(o.bld||[]).forEach((b,s)=>{const B=bldOf(b);if(!B)return;const seats=[];for(let k=0;k<B.cap;k++){seats.push(i<(o.n|0)?i:null);if(i<(o.n|0))i++}out.push({slot:s,b:B,seats})});return out}
// покупки
export function buyPlot(a,G,district=1){const o=colEnsure(a),p=COL.plots[o.plot|0];if(!p)return{ok:false,why:'все участки куплены'};if(district<p.d)return{ok:false,why:`«${p.n}» откроется в районе ${p.d}`};
 if(G.money<p.cost)return{ok:false,why:'нужно $'+p.cost};G.money-=p.cost;o.plot=(o.plot|0)+1;return{ok:true,cost:p.cost,plot:p}}
export function build(a,G,slot,id,district=99){const o=colEnsure(a),B=bldOf(id);if(!B)return{ok:false,why:'нет такого здания'};if(district<(B.d||1))return{ok:false,why:`«${B.n}» откроется в районе ${B.d}`};if(slot<0||slot>=slotsOf(o))return{ok:false,why:'слот не на твоём участке'};
 const cur=bldOf(o.bld[slot]);if(cur&&cur.cap>=B.cap)return{ok:false,why:'тут уже стоит не меньше'};const c=cur?Math.max(0,B.cost-Math.round(cur.cost*.5)):B.cost;
 if(G.money<c)return{ok:false,why:'нужно $'+c};G.money-=c;while(o.bld.length<slot)o.bld.push(null);o.bld[slot]=id;o.rooms=o.bld.filter(Boolean).length;return{ok:true,cost:c,b:B}}
export const buildCost=(o,slot,id)=>{const B=bldOf(id),cur=bldOf((o.bld||[])[slot]);return B?(cur?Math.max(0,B.cost-Math.round(cur.cost*.5)):B.cost):0};
// витрина Лома на сегодня: 3 девайса по весам редкости, от дня (одинаковая весь день); открыта только при dayN ≥ 50
export function devStock(a,k,dayN){const o=colEnsure(a);if(o.shop.k!==k)o.shop={k,got:[]};const open=dayN>=COL.devDay;let seed=H('dev'+k);const rnd=()=>(seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296;
 const ids=[];let guard=0;while(ids.length<COL.stockN&&guard++<50){const tot=COL.DEV.reduce((s,d)=>s+W[d.r],0);let r=rnd()*tot,pick=COL.DEV[0];for(const d of COL.DEV){r-=W[d.r];if(r<=0){pick=d;break}}if(!ids.includes(pick.id))ids.push(pick.id)}
 return{open,need:Math.max(0,COL.devDay-dayN),items:ids.map(id=>({...devOf(id),sold:o.shop.got.includes(id)}))}}
export function buyDev(a,G,id,k,dayN){const s=devStock(a,k,dayN);if(!s.open)return{ok:false,why:`Лом спустится, когда сегодня будет ${COL.devDay} звонков (ещё ${s.need})`};
 const it=s.items.find(x=>x.id===id);if(!it)return{ok:false,why:'сегодня этого нет'};if(it.sold)return{ok:false,why:'уже купил сегодня'};if(G.money<it.cost)return{ok:false,why:'нужно $'+it.cost};
 const o=colEnsure(a);G.money-=it.cost;o.shop.got.push(id);o.inv[id]=(o.inv[id]|0)+1;return{ok:true,cost:it.cost,dev:it}}
// надеть девайс связисту i (один на человека; старый возвращается в ящик)
export function equipDev(a,i,id){const o=colEnsure(a);if(i<0||i>=(o.n|0))return{ok:false,why:'нет такого связиста'};if(!devOf(id))return{ok:false,why:'нет такого девайса'};if(!(o.inv[id]>0))return{ok:false,why:'в ящике нет'};
 const old=o.dev[i];o.inv[id]--;if(!o.inv[id])delete o.inv[id];if(old)o.inv[old]=(o.inv[old]|0)+1;o.dev[i]=id;return{ok:true,old}}
export function unequipDev(a,i){const o=colEnsure(a),d=o.dev[i];if(!d)return{ok:false};delete o.dev[i];o.inv[d]=(o.inv[d]|0)+1;return{ok:true}}
// Ночная чистка увела последнего: его девайс возвращается в ящик
export function opLeft(a){const o=colEnsure(a),i=o.n|0,d=o.dev[i];delete o.lv[i];if(d){delete o.dev[i];o.inv[d]=(o.inv[d]|0)+1}}
