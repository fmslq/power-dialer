// I5 (кусок 20): «Час, когда берут» — счастливые часы по поясам лидов.
// Сюжет (STORY_BIBLE §12.3): Гудок считает время по их часам. Рассвет идёт по стране с востока на запад, и вместе с ним
// по проводам катится «волна» — люди просыпаются и берут трубку. Где сейчас утро или вечер, ток идёт легче.
// Здесь: чип в HUD (идёт / через сколько), панель «Волна» (4 пояса, полоса суток, кнопка «Звонить сюда»),
// тосты: начало часа, «осталось 5 минут» и конец (с подсказкой, куда катится волна дальше).
import * as A from '../../core/addict.js';
import {TZ,TZN} from '../../dialer/geo.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const dur=min=>{min=Math.max(0,min);if(min<10){const s=Math.round(min*60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}const h=Math.floor(min/60),m=Math.round(min%60);return h?(h+' ч'+(m?' '+m+' мин':'')):m+' мин'};
const ZRU={Eastern:'Восток',Central:'Центр',Mountain:'Горы',Pacific:'Запад'};
export const tzOfState=st=>{const z=TZ[String(st||'').toUpperCase()];return z?(TZN[z]||null):null};
const SUN='<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M4.2 19.8L7 17M17 7l2.8-2.8" stroke="currentColor" stroke-width="2"/></svg>';
export function makeHH({now=Date.now,toast=()=>{},sfx=()=>{},lead=()=>null,filterTz=()=>'',setTz=null,active=()=>true}){
 let prev=null,warned={},pop=null;
 // чип HUD: идёт — ×k и обратный отсчёт; нет — «через …» для текущего лида
 const chip=()=>{const L=lead(),t=now();if(!L||!L.state)return'';const h=A.happy(L.state,t);
  if(h)return`<button class="adx-c hh${h.left<=5?' hurry':''}" data-hh="1" title="${esc(h.name)} по местному времени лида: XP и $ ×${h.k}, Сигнал ×2, Шум чаще. Клик — волна по поясам">${SUN} ×${h.k} <i>${dur(h.left)}</i></button>`;
  const n=A.hhNext(L.state,t);return n?`<button class="adx-c hh-off" data-hh="1" title="Следующий ${esc(n.name.toLowerCase())} у этого лида через ${dur(n.in)}. Клик — где час идёт сейчас">${SUN} <i>через ${dur(n.in)}</i></button>`:''};
 const sig=()=>{const L=lead(),t=now();if(!L)return'';const h=A.happy(L.state,t);if(h)return'h'+(h.left<10?Math.ceil(h.left*60):Math.ceil(h.left));const n=A.hhNext(L.state,t);return n?'n'+(n.in<10?Math.ceil(n.in*60):Math.ceil(n.in)):''};
 // полоса суток 6:00–22:00 по их часам: окна часа + метка «сейчас»
 const strip=z=>{const F=360,T=1320,W=T-F,pc=m=>((Math.min(T,Math.max(F,m))-F)/W*100).toFixed(2);const wk=z.wd===0||z.wd===6;
  return`<div class="hh-strip${wk?' wk':''}">${A.AD.hh.map(h=>`<i class="w" style="left:${pc(h.from)}%;width:${(pc(h.to)-pc(h.from)).toFixed(2)}%"></i>`).join('')}${z.m!=null?`<b style="left:${pc(z.m)}%"></b>`:''}</div>`};
 const hm=m=>{m=Math.round(m);const h=Math.floor(m/60)%24,mm=m%60,ap=h<12?'AM':'PM';return((h%12)||12)+':'+String(mm).padStart(2,'0')+' '+ap};
 const popHtml=()=>{const t=now(),Z=A.hhZones(t),ft=filterTz(),L=lead(),lz=L&&tzOfState(L.state);
  const best=Z.filter(z=>z.on).sort((a,b)=>b.on.left-a.on.left)[0];
  return`<div class="hhp-h">${SUN}<b>Волна</b><span>час, когда берут</span><button class="hhp-x" aria-label="Закрыть"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
  <p class="hhp-lore">Гудок: «Рассвет идёт с востока на запад. Где у них сейчас утро или вечер — там берут трубку, и ток идёт легче: XP и $ выше, Сигнал вдвое, Шум ловится чаще. Я веду тебя по волне».</p>
  <div class="hhp-l">${Z.map(z=>`<div class="hhp-z${z.on?' on':''}${lz===z.tz?' me':''}"><div class="hz-n"><b>${z.tz}</b><span>${ZRU[z.tz]} · ${z.m!=null?hm(z.m):'—'}</span></div>${strip(z)}
   <div class="hz-s">${z.on?`<b>×${z.on.k}</b> ${esc(z.on.name.toLowerCase())} · ещё ${dur(z.on.left)}`:z.next?`${esc(z.next.name.toLowerCase())} через ${dur(z.next.in)}`:'—'}</div>
   ${setTz?(ft===z.tz?`<button class="hz-go on" data-tz="">Снять фильтр</button>`:`<button class="hz-go${z.on?' hot':''}" data-tz="${z.tz}">Звонить сюда</button>`):''}</div>`).join('')}</div>
  <p class="hhp-f">${best?`Сейчас лучше всего: <b>${best.tz}</b> — ещё ${dur(best.on.left)}.`:'Сейчас час не идёт ни у кого. '+(()=>{const n=Z.filter(z=>z.next).sort((a,b)=>a.next.in-b.next.in)[0];return n?`Ближайший — <b>${n.tz}</b> через ${dur(n.next.in)}.`:''})()} Время — по часам лида; в выходные часа нет.</p>`};
 const close=()=>{if(!pop)return;pop.remove();pop=null;removeEventListener('keydown',kd,true);removeEventListener('pointerdown',od,true)};
 const kd=e=>{if(e.code==='Escape'){e.preventDefault();e.stopPropagation();close()}};
 const od=e=>{if(pop&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-hh]')))close()};
 const draw=()=>{if(!pop)return;pop.innerHTML=popHtml();pop.querySelector('.hhp-x').onclick=close;pop.querySelectorAll('[data-tz]').forEach(b=>b.onclick=()=>{setTz&&setTz(b.dataset.tz);draw()})};
 const open=(anchor)=>{if(pop){close();return}pop=document.createElement('div');pop.className='hhp';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Волна: счастливые часы по поясам');document.body.appendChild(pop);draw();
  const r=anchor&&anchor.getBoundingClientRect&&anchor.getBoundingClientRect(),w=Math.min(520,innerWidth-16);if(r){pop.style.top=Math.round(r.bottom+8)+'px';pop.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)))+'px'}
  addEventListener('keydown',kd,true);addEventListener('pointerdown',od,true)};
 // тосты: начало — для всех поясов; «5 минут» и конец — для пояса текущего лида или фильтра
 const live=()=>{const t=now(),Z=A.hhZones(t),L=lead(),mine=new Set([L&&tzOfState(L.state),filterTz()].filter(Boolean));
  const cur={};Z.forEach(z=>cur[z.tz]=z.on?z.on.name:'');
  if(prev&&active()&&document.visibilityState!=='hidden'){Z.forEach(z=>{const was=prev[z.tz],is=cur[z.tz];const key=z.tz+'|'+(is||was)+'|'+Math.floor(t/864e5);
   if(is&&!was){toast(`☀ ${is} у ${z.tz}: XP и $ ×${z.on.k}, Сигнал ×2. Волна пришла`,'gold');sfx('chime')}
   if(is&&mine.has(z.tz)&&z.on.left<=5&&!warned[key]){warned[key]=1;toast(`☀ ${is} у ${z.tz}: осталось 5 минут`)}
   if(was&&!is&&mine.has(z.tz)){const n=Z.filter(x=>x.on).sort((a,b)=>b.on.left-a.on.left)[0];toast(`${was} у ${z.tz} закончился.`+(n?` Волна ушла дальше: ${n.tz} ещё ${dur(n.on.left)} — «Волна» → «Звонить сюда»`:''))}})}
  prev=cur;if(pop)draw()};
 setInterval(live,1000);
 return{chip,sig,open,close,live,isOpen:()=>!!pop}}
