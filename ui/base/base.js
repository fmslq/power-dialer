// БАЗА И ЧЁРНЫЙ РЫНОК (R4, ТЗ §10–11). Полноэкранная сцена базы 2400×1000 (панорама: тянуть / колесо / стрелки),
// 4 стадии по району, купленные предметы на своих слотах (новые падают сверху), Гудок, люк на рынок, рычаг «К работе».
// Рынок: продавец Лом, вкладки районов 1–12 + косметика, карточки в духе Inscryption (арт, тир, лор, где встанет).
import {icon} from '../../art/icons.js';
import {priceFor} from '../../core/allies.js';
import {DIST,SHOP_ITEMS,COSMETICS,buy,baseStage,equip,equipped} from '../../core/meta.js';
import {ITEM_LORE,COSMETIC_LORE} from '../../story/items.js';
import {LINES} from '../../story/guide.js';
import {buffText,itemTotals} from '../../core/buffs.js';
import {guideSvg} from '../../art/guide.js';
import {BW,BH,FLOOR,itemSprite,BASE_SLOTS,STAGES,stageBack,stageFloor,stageLight,LEVER,HATCH,lomSvg,LOM_LINES} from '../../art/base.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const $m=v=>'$'+Math.round(v||0).toLocaleString('ru');
const pick=a=>a[Math.random()*a.length|0];
const ALL=[...SHOP_ITEMS,...COSMETICS];
const byId=id=>ALL.find(x=>x.id===id);
const LAYER={wall:'на стене',floor:'на полу',front:'на переднем плане'};
export const DOOR_X=1810,LEVER_X=70,GK_X=700,MH_X=1500,MH_Y=FLOOR+128;   // MH — люк в коллектор (К24)          // точки интерьера (координаты сцены)
// люк в полу: чугунная крышка, решётка, тёплый свет из щели. Под ним шахта в тоннели «Зари» — она есть под любой базой.
const MANHOLE=`<g class="hq-mh" transform="translate(${MH_X} ${MH_Y})"><ellipse rx="78" ry="20" fill="#0b0806"/><ellipse class="hq-mh-glow" rx="84" ry="22" fill="#ffb347" opacity=".35"/><ellipse rx="64" ry="15" fill="#3a342c" stroke="#050505" stroke-width="3"/>${[-40,-20,0,20,40].map(x=>`<path d="M${x} -12v24" stroke="#1a1714" stroke-width="5" transform="scale(1 .9)"/>`).join('')}<ellipse rx="64" ry="15" fill="none" stroke="#4a443c" stroke-width="2"/><text y="4" text-anchor="middle" font-size="9" font-family="monospace" fill="#a89a84" letter-spacing="3">ЗАРЯ</text></g>`;
const tierCls=it=>it.district?({c:'t0',m:'t1',m2:'t1',s:'t2'}[it.tk]||'t1'):'cos';
const tierName=it=>it.district?it.tier:'косметика';
const loreOf=id=>(ITEM_LORE[id]||COSMETIC_LORE[id]||{});
export const powerOf=n=>n<=0?0:n<10?1:n<40?2:n<80?3:4; // свет базы: 0 / 1–9 / 10–39 / 40–79 / 80+ звонков за сегодня
export function makeBase(o){
 const pw=()=>powerOf(o.today?o.today():20); // o: {mount, save:()=>save, G:()=>G, persist, toast, sfx, fx, dark:()=>bool, onBuy(it), onClose}
 let el=null,bm=null,cam={x:0,s:1,max:0,ty:0},tab=1,gkN=0,bubT=0,lomT=0,drag=null,justDragged=false;
 const reduce=()=>RM.matches||(o.fx&&o.fx()==='off');
 const sv=()=>o.save(),G=()=>o.G();
 const meta=()=>{const s=sv();s.meta=s.meta||{};s.meta.owned=s.meta.owned||{};return s.meta};
 const bs=()=>{const s=sv();s.base=s.base||{stage:0,seenStage:0};s.base.seen=s.base.seen||{};return s.base};
 const stage=()=>baseStage(G().district||1);
 const owned=id=>!!meta().owned[id];
 const isOpen=()=>!!el;
 // ---------- сцена ----------
 const itemG=(id,drop,i)=>{const sl=BASE_SLOTS[id];if(!sl)return'';const[x,y,k]=sl;
  return`<g class="it${drop?' drop':''}" data-id="${id}" style="--i:${i}" transform="translate(${x} ${y}) scale(${k})"><g class="it-in">${itemSprite(id)}</g></g>`};
 const sceneSvg=(st,dark)=>{const own=ALL.filter(x=>owned(x.id)),seen=bs().seen;let n=0;
  const lay=l=>own.filter(x=>BASE_SLOTS[x.id]&&BASE_SLOTS[x.id][3]===l).map(x=>itemG(x.id,!seen[x.id],seen[x.id]?0:n++)).join('');
  const desk=owned('d1t1');
  return`<svg class="hq-svg" viewBox="0 0 ${BW} ${BH}" preserveAspectRatio="xMidYMax slice">
   ${stageBack(st,dark?.03:[.015,.08,.18,.26,.34][pw()],dark||pw()===0,owned('d2t0'))}<g transform="translate(${DOOR_X} ${FLOOR})">${HATCH}</g>${lay('wall')}${stageFloor(st)}
   ${desk?'':`<path d="M${GK_X-70} ${FLOOR}h140v-90h-140z" fill="#4a3a26" stroke="#050505" stroke-width="3"/><path d="M${GK_X-70} ${FLOOR-45}h140" stroke="#2a2016" stroke-width="4"/>`}
   ${lay('floor')}${lay('front')}<g transform="translate(${LEVER_X} ${FLOOR+150}) scale(.9)">${LEVER}</g>${MANHOLE}<g pointer-events="none">${stageLight(st,dark||pw()===0,[0,.5,1,1.35,1.7][pw()])}</g></svg>`};
 const hot=(cls,x,y,w,h,label,k)=>`<button class="hq-hot ${cls}" data-k="${k}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="${esc(label)}"><span class="hq-lbl">${esc(label)}</span></button>`;
 const html=()=>{const st=stage(),dark=o.dark(),S=STAGES[st],gy=owned('d1t1')?FLOOR-200:FLOOR-90;
  return`<div class="hq-vp" id="hq-vp"><div class="hq-cam" id="hq-cam" style="width:${BW}px;height:${BH}px">${sceneSvg(st,dark)}
   <div class="hq-gk${dark||pw()===0?' dark':''}" id="hq-gk" style="left:${GK_X-62}px;top:${gy-128}px">${guideSvg(dark||pw()===0?'whisper':'neutral')}</div>
   ${hot('gk',GK_X-70,gy-140,140,140,'Гудок','gk')}${hot('door',DOOR_X-95,FLOOR-290,190,290,'Чёрный Рынок · M','shop')}${hot('go',LEVER_X-50,FLOOR-20,110,180,'К работе · Esc','go')}${hot('mh',MH_X-80,MH_Y-34,160,64,'Люк · коллектор','under')}
   <div class="hq-bub" id="hq-bub" style="left:${GK_X+40}px;top:${gy-230}px"></div></div></div>
   <i class="hq-edge l"></i><i class="hq-edge r"></i>
   <header class="hq-top"><div class="hq-ttl"><small>БАЗА · стадия ${st+1} из 4</small><b>${esc(S[0])}</b><span>${esc(S[1])}</span></div>
    <div class="hq-money"><small>деньги</small><b id="hq-money">${$m(G().money)}</b><span>${ALL.filter(x=>owned(x.id)).length} из ${ALL.length} предметов</span>${(()=>{const t=itemTotals(meta().owned,99,12),p=[];if(t.xAll)p.push('XP +'+t.xAll+'%');if(t.mAll)p.push('$ +'+t.mAll+'%');if(t.fast)p.push('окно +'+t.fast+' с');const c=Object.keys(t.x).length+Object.keys(t.m).length;if(c)p.push(c+' бонус'+(c===1?'':c<5?'а':'ов')+' к статусам');return p.length?`<em class="hq-buffs" title="Бонусы купленных предметов">⚡︎ ${p.join(' · ')}</em>`:''})()}</div>
    <nav class="hq-nav"><button data-k="shop" class="hq-b mk">Чёрный Рынок <kbd>M</kbd></button><button data-k="ins" class="hq-b">Осмотр <kbd>I</kbd></button><button data-k="go" class="hq-b go">К работе <kbd>Esc</kbd></button></nav></header>
   <p class="hq-hint">Тяни, крути колесо или жми ← →. Нажми на предмет — прочитать.</p>
   <div class="hq-tip" id="hq-tip"></div>${dark?`<div class="hq-darkmsg">Свет отключили. Ты снова <b>Nobody</b>. Позвони — и лампа вернётся.</div>`:''}`};
 const apply=(anim)=>{const c=el&&el.querySelector('#hq-cam');if(!c)return;cam.x=Math.max(0,Math.min(cam.max,cam.x));
  c.classList.toggle('anim',!!anim);c.style.transform=`translate(${-cam.x}px,${cam.ty}px) scale(${cam.s})`;
  el.querySelector('.hq-edge.l').classList.toggle('on',cam.x>4);el.querySelector('.hq-edge.r').classList.toggle('on',cam.x<cam.max-4)};
 const layout=()=>{if(!el)return;const vp=el.querySelector('#hq-vp'),vw=vp.clientWidth,vh=vp.clientHeight;
  cam.s=Math.max(vh/BH,vw/BW);cam.max=Math.max(0,BW*cam.s-vw);cam.ty=Math.min(0,(vh-BH*cam.s)*.7);apply()};
 const center=sx=>{cam.x=sx*cam.s-el.querySelector('#hq-vp').clientWidth/2};
 const bubble=(t,ms=4200)=>{const b=el&&el.querySelector('#hq-bub');if(!b)return;b.textContent=t;b.classList.add('on');clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('on'),ms)};
 const gk=()=>{gkN++;const dark=o.dark(),L=dark?LINES.baseDark:gkN%5===0?LINES.egg:LINES.base;const g=el.querySelector('#hq-gk');
  g.innerHTML=guideSvg(dark?'whisper':gkN%5===0?'sarcastic':'talking');g.classList.remove('bob');void g.offsetWidth;g.classList.add('bob');bubble(pick(L));o.sfx&&o.sfx('tick')};
 const tip=(e,id)=>{const t=el.querySelector('#hq-tip');if(!id){t.classList.remove('on');return}const it=byId(id);
  t.innerHTML=`<b>${esc(it.name)}</b><span>${it.district?esc(DIST[it.district-1][0])+' · ':''}${esc(tierName(it))}</span>`;t.style.left=e.clientX+'px';t.style.top=e.clientY+'px';t.classList.add('on')};
 // ---------- карточка (общая для рынка и осмотра) ----------
 const where=it=>{const sl=BASE_SLOTS[it.id];return it.district?`встанет ${LAYER[sl[3]]} базы · переезжает с тобой`:it.slot==='trail'?'след фигурки на карте мира · и на стене трофеев':'материал печати статуса на карточке · и на стене трофеев'};
 const card=(it0,st)=>{const pr=priceFor(sv(),it0),disc=pr<it0.price,it={...it0,price:pr},L=loreOf(it.id),lk=st==='lk',cl=tierCls(it),g=G();const short=!lk&&st!=='own'&&g.money<it.price;
  const on=!it.district&&equipped(meta(),it.slot)===it.id;
  const btn=lk?`<span class="crd-lk">Откроется в районе ${it.district}</span>`:st==='own'&&!it.district?`<button class="crd-eq${on?' on':''}" data-eq="${it.id}">${on?'Надето ✓ · снять':'Надеть'}</button>`:st==='own'?`<span class="crd-own">У тебя на базе</span>`:
   `<button class="crd-buy${short?' short':''}" data-buy="${it.id}"${short?' aria-disabled="true"':''}>${short?`не хватает ${$m(it.price-g.money)}`:`Купить · ${$m(it.price)}`}</button>`;
  return`<article class="crd ${cl} ${st}" data-id="${it.id}"><div class="crd-fr"><header class="crd-hd"><b>${lk?'???':esc(it.name)}</b><em>${lk?'':(disc&&st!=='own'?`<s>${$m(it0.price)}</s> `:'')+$m(it.price)}</em></header>
   <div class="crd-art"><svg class="crd-svg" viewBox="-200 -400 400 420"><g class="crd-g">${itemSprite(it.id)}</g></svg>${lk?'<i class="crd-q">?</i>':''}${cl==='t2'&&!lk?'<i class="crd-shine"></i>':''}</div>
   <div class="crd-tier"><span>${esc(tierName(it))}</span>${it.district?`<span>${esc(DIST[it.district-1][0])}</span>`:''}</div>
   <p class="crd-lore">${lk?'Лом держит это под брезентом. Захвати район — покажет.':esc(L.lore||it.description||'')}</p>
   ${buffText(it.id)?`<p class="crd-buff"><i>⚡︎</i><span>${esc(buffText(it.id))}</span></p>`:''}<p class="crd-where">${lk?'':esc(where(it))}</p><footer>${btn}</footer>${st==='own'||st==='sold'?'<i class="crd-stamp">КУПЛЕНО</i>':''}</div></article>`};
 const fit=root=>root.querySelectorAll('.crd-svg').forEach(s=>{try{const b=s.querySelector('.crd-g').getBBox();if(!b.width)return;const p=Math.max(b.width,b.height)*.08;
  s.setAttribute('viewBox',`${b.x-p} ${b.y-p} ${b.width+2*p} ${b.height+2*p}`)}catch(e){}});
 const showCard=id=>{const it=byId(id);if(!it)return;const w=document.createElement('div');w.className='hq-card';
  w.innerHTML=`<div class="hq-card-in">${card(it,'own')}<p class="hq-card-x">Esc или клик — закрыть</p></div>`;w.onclick=()=>w.remove();w.querySelectorAll('.crd-stamp').forEach(x=>x.remove());w.querySelectorAll('.crd-eq').forEach(x=>x.replaceWith(Object.assign(document.createElement('span'),{className:'crd-own',textContent:'Надеть — на Чёрном Рынке'})));el.appendChild(w);fit(w);o.sfx&&o.sfx('tick')};
 // ---------- рынок ----------
 const stOf=it=>owned(it.id)?'own':it.district&&it.district>(G().district||1)?'lk':'';
 const lom=(mood,t)=>{if(!bm)return;bm.querySelector('#bm-lom').innerHTML=lomSvg(mood);const b=bm.querySelector('#bm-say');b.textContent=t;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
  clearTimeout(lomT);if(mood!=='welcome')lomT=setTimeout(()=>bm&&(bm.querySelector('#bm-lom').innerHTML=lomSvg('welcome')),2600)};
 const tabs=()=>{const d=G().district||1;return Array.from({length:12},(_,i)=>{const n=i+1,lk=n>d,all=SHOP_ITEMS.filter(x=>x.district===n),k=all.filter(x=>owned(x.id)).length;
  return`<button class="bm-tab${tab===n?' on':''}${lk?' lk':''}" data-tab="${n}" title="${esc(DIST[i][0])}"><b>${n}</b><span>${lk?icon('lock','ic-in'):k+'/3'}</span></button>`}).join('')+
  `<button class="bm-tab cos${tab==='cos'?' on':''}" data-tab="cos"><b>КОСМ</b><span>${COSMETICS.filter(x=>owned(x.id)).length}/${COSMETICS.length}</span></button>`+
  (o.dev&&o.dev.on()?(()=>{const S=o.dev.stock();return`<button class="bm-tab dev${tab==='dev'?' on':''}${S.open?' hot':''}" data-tab="dev" title="Девайсы для связистов (D)"><b>ДЕВ</b><span>${S.open?S.items.filter(x=>!x.sold).length+' шт':icon('lock','ic-in')}</span></button>`})():'')};
 const list=()=>tab==='cos'?COSMETICS:tab==='dev'?[]:SHOP_ITEMS.filter(x=>x.district===tab);
 // I4: девайсы для связистов — Лом приносит ящик только в день с 50+ звонками; один девайс в день каждого вида
 const devGrid=()=>{const S=o.dev.stock();return`<div class="bm-sub"><b>Девайсы для связистов</b><span>${S.open?'Сегодняшний ящик. Каждый — один раз. Надеть — в Коллекторе, одному связисту.':`Ящик закрыт. «Девайс — не сувенир. Отработай полсотни звонков — спущусь». Сегодня ещё ${S.need}.`}</span></div>
  <div class="bm-grid bm-devs">${S.items.map(d=>`<div class="bm-dev${S.open?'':' lk'}${d.sold?' sold':''}" style="--dc:${o.dev.tc(d.r)}"><i class="dvi"></i><b>${S.open?esc(d.n):'???'}</b><span>${S.open?esc(d.t):'Лом держит ящик закрытым.'}</span><em>${S.open?'+'+d.b+'% одному связисту':''}</em>
   ${d.sold?'<button disabled>куплено</button>':S.open?`<button data-dev="${d.id}" ${G().money<d.cost?'class="short"':''}>${$m(d.cost)}</button>`:'<button disabled aria-label="Закрыто">'+icon('lock','ic-in')+'</button>'}</div>`).join('')}</div>`};
 const grid=()=>{if(tab==='dev'&&o.dev)return devGrid();const L=list(),lk=tab!=='cos'&&tab>(G().district||1);
  return`<div class="bm-sub">${tab==='cos'?'<b>Косметика</b><span>След фигурки на карте и материал печати статуса. Надето — одно из каждого вида.</span>':`<b>${tab}. ${esc(DIST[tab-1][0])}</b><span>${lk?'Район ещё не твой — только силуэты.':'Три вещи района: дешёвая, средняя, showpiece.'}</span>`}</div>
   <div class="bm-grid">${L.map(it=>card(it,stOf(it))).join('')}</div>`};
 const drawShop=()=>{if(!bm)return;bm.querySelector('#bm-tabs').innerHTML=tabs();bm.querySelector('#bm-body').innerHTML=grid();bm.querySelector('#bm-money').textContent=$m(G().money);fit(bm);
  const t=bm.querySelector('.bm-tab.on');t&&t.scrollIntoView&&t.scrollIntoView({block:'nearest',inline:'nearest'})};
 const setTab=t=>{if(t==='dev'&&!(o.dev&&o.dev.on()))return;tab=t;drawShop();if(t==='dev'){const S=o.dev.stock();lom(S.open?'welcome':'closed',S.open?'Свеженькое, из-под «Зари». Своим ушастым — не жалей.':'Сегодня ты мало звонил. Ящик не открою.');return}const lk=t!=='cos'&&t>(G().district||1),L=list();
  if(lk)lom('closed',pick(LOM_LINES.locked));else if(ALL.every(x=>owned(x.id)))lom('happy',LOM_LINES.empty[0]);else if(L.every(x=>owned(x.id)))lom('welcome','Тут ты всё забрал. Глянь другой район.')};
 const doBuy=id=>{const it=byId(id),r=buy(G(),meta(),id);
  if(!r.ok){if(r.why.startsWith('не хватает')){lom('haggle',pick(LOM_LINES.short));o.sfx&&o.sfx('del')}else lom('closed',r.why);return}
  o.persist&&o.persist();o.sfx&&o.sfx('ching');lom('happy',loreOf(id).lom||pick(LOM_LINES.sold));drawShop();
  const c=bm.querySelector(`.crd[data-id="${id}"]`);if(c){c.classList.add('sold');!reduce()&&c.classList.add('just')}
  const mo=el&&el.querySelector('#hq-money');mo&&(mo.textContent=$m(G().money));o.onBuy&&o.onBuy(it)};
 const openShop=()=>{if(!el)open();if(bm)return;const d=G().district||1;o.pre&&o.pre(['shelf-'+Math.min(d,12)],d);tab=Math.min(d,12);
  bm=document.createElement('div');bm.className='bm';
  bm.innerHTML=`<div class="bm-in"><header class="bm-hd"><div class="bm-lom" id="bm-lom">${lomSvg('welcome')}</div>
   <div class="bm-talk"><small>ЧЁРНЫЙ РЫНОК · продавец Лом</small><p class="bm-say" id="bm-say"></p></div>
   <div class="bm-wal"><small>у тебя</small><b id="bm-money"></b></div><button class="bm-x" data-k="close" aria-label="Закрыть">×</button></header>
   <nav class="bm-tabs" id="bm-tabs"></nav><section class="bm-body" id="bm-body"></section>
   <p class="bm-foot">1–9, 0 — район · C — косметика${o.dev&&o.dev.on()?' · D — девайсы':''} · Esc — на базу</p></div>`;
  el.appendChild(bm);bm.onclick=e=>{const b=e.target.closest('[data-buy],[data-tab],[data-k],[data-dev]');if(!b)return;
   if(b.dataset.dev){const r=o.dev.buy(b.dataset.dev);if(!r.ok){lom(r.why.startsWith('нужно')?'haggle':'closed',r.why.startsWith('нужно')?pick(LOM_LINES.short):r.why);o.sfx&&o.sfx('del')}else{o.persist&&o.persist();o.sfx&&o.sfx('ching');lom('happy',`${r.dev.n}. В ящик Коллектора. Надень кому-нибудь, а то пылится.`);drawShop();const mo=el&&el.querySelector('#hq-money');mo&&(mo.textContent=$m(G().money))}return}
   if(b.dataset.eq){equip(meta(),b.dataset.eq);o.persist&&o.persist();o.onEquip&&o.onEquip();o.sfx&&o.sfx('tick');lom('welcome',equipped(meta(),byId(b.dataset.eq).slot)?'Носи с гордостью. И не мой.':'Снял? Ну и ладно. Я не обиделся.');drawShop();return}
   if(b.dataset.buy)doBuy(b.dataset.buy);else if(b.dataset.tab)setTab(b.dataset.tab==='cos'||b.dataset.tab==='dev'?b.dataset.tab:+b.dataset.tab);else if(b.dataset.k==='close')closeShop()};
  drawShop();lom('welcome',pick(LOM_LINES.welcome));requestAnimationFrame(()=>bm&&bm.classList.add('in'));o.sfx&&o.sfx('tick')};
 const closeShop=()=>{if(!bm)return;const b=bm;bm=null;b.classList.remove('in');setTimeout(()=>b.remove(),reduce()?0:220);if(el)refresh()};
 // ---------- открыть / закрыть ----------
 const refresh=()=>{if(!el)return;const x=cam.x;el.innerHTML=html();bind();layout();cam.x=x;apply();markSeen()};
 const markSeen=()=>{const s=bs();let ch=false;ALL.forEach(x=>{if(owned(x.id)&&!s.seen[x.id]){s.seen[x.id]=Date.now();ch=true}});ch&&o.persist&&o.persist()};
 const banner=st=>{const S=STAGES[st],b=document.createElement('div');b.className='hq-ban';
  b.innerHTML=`<small>НОВАЯ БАЗА</small><b>${esc(S[0])}</b><span>${esc(S[1])}. Всё, что ты купил, переехало с тобой.</span>`;el.appendChild(b);setTimeout(()=>b.remove(),reduce()?2500:4200);o.sfx&&o.sfx('levelup')};
 const bind=()=>{const vp=el.querySelector('#hq-vp');
  vp.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,cx:cam.x,moved:false,id:e.pointerId}};
  vp.onpointermove=e=>{if(drag){const dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)>5){drag.moved=true;try{vp.setPointerCapture(drag.id)}catch(_){}}if(drag.moved){cam.x=drag.cx-dx;apply()}}
   const g=e.target.closest&&e.target.closest('.it');tip(e,!drag?.moved&&g?g.dataset.id:null)};
  vp.onpointerup=()=>{justDragged=!!drag?.moved;drag=null};vp.onpointerleave=()=>tip(null,null);
  vp.onwheel=e=>{e.preventDefault();cam.x+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?32:1);apply()};
  el.onclick=e=>{if(justDragged){justDragged=false;return}if(bm&&bm.contains(e.target))return;const k=e.target.closest('[data-k]');
   if(k){const v=k.dataset.k;if(v==='gk')gk();else if(v==='shop')openShop();else if(v==='go')close();else if(v==='ins')el.classList.toggle('ins');else if(v==='under'){o.sfx&&o.sfx('tick');o.onUnder&&o.onUnder()}return}
   const it=e.target.closest('.it');if(it&&!e.target.closest('.hq-card'))showCard(it.dataset.id)}};
 function open(){if(el){return}o.pre&&o.pre(['sys-base']);const m=o.mount||document.body;el=document.createElement('div');el.className='hq pw'+pw()+(o.dark()?' dark':'')+(reduce()?' rm':'');el.innerHTML=html();m.appendChild(el);
  bind();layout();center(innerWidth<700?GK_X+120:1200);apply();addEventListener('resize',layout);requestAnimationFrame(()=>el&&el.classList.add('in'));
  const s=bs(),st=stage();s.stage=st;if((s.seenStage??0)<st){s.seenStage=st;banner(st);o.persist&&o.persist()}
  setTimeout(()=>{if(!el)return;bubble(pick(o.dark()?LINES.baseDark:pw()===0?LINES.baseOff:pw()>=3&&Math.random()<.5?LINES.baseLit:LINES.base));markSeen()},reduce()?50:900)}
 function close(){if(!el)return;if(bm){bm.remove();bm=null}const e=el;el=null;removeEventListener('resize',layout);e.classList.remove('in');setTimeout(()=>e.remove(),reduce()?0:260);o.onClose&&o.onClose()}
 const toggle=()=>isOpen()?close():open();
 const key=e=>{if(!el)return false;const c=e.code;
  if(el.querySelector('.hq-card')&&(c==='Escape'||c==='Enter'||c==='Space')){el.querySelector('.hq-card').remove();return true}
  if(bm){if(c==='Escape'||c==='KeyM'){closeShop();return true}const n=/^Digit(\d)$/.exec(c);if(n){setTab(+n[1]||10);return true}
   if(c==='Minus'){setTab(11);return true}if(c==='Equal'){setTab(12);return true}if(c==='KeyC'){setTab('cos');return true}if(c==='KeyD'&&o.dev&&o.dev.on()){setTab('dev');return true}
   if(c==='ArrowLeft'||c==='ArrowRight'){const t=tab==='cos'||tab==='dev'?13:tab,nt=Math.max(1,Math.min(13,t+(c==='ArrowLeft'?-1:1)));setTab(nt===13?'cos':nt);return true}return true}
  if(c==='Escape'){if(el.classList.contains('ins'))el.classList.remove('ins');else close();return true}
  if(c==='KeyM'){openShop();return true}if(c==='KeyI'){el.classList.toggle('ins');return true}if(c==='KeyG'){gk();return true}
  if(c==='ArrowLeft'||c==='ArrowRight'){cam.x+=(c==='ArrowLeft'?-1:1)*Math.max(200,innerWidth*.4);apply(!reduce());return true}
  return true}; // база модальная: остальные клавиши не уходят в дайлер
 return{open,close,isOpen,key,openShop,closeShop,toggle,refresh,_cam:cam,_tab:()=>tab}}
