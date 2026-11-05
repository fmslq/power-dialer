// ОКНО В РАЙОН (ТЗ §9.1–9.2): верхняя полоса рабочего экрана со сценой текущего района (параллакс, огни, частицы).
// В фазе босса полоса разворачивается: сцена темнеет, по краям летбоксы, справа босс с риггом, снизу шкала HP по фазам,
// каждый статус бьёт босса прямо здесь (царапина / удар / крит / IMMUNE). Клик — сцена во весь экран (карта или арена).
import {DIST} from '../../core/meta.js';
import {districtLayers} from '../../art/scenes.js';
import {bossSvg,phaseOf} from '../../art/bosses.js';
import {crest} from '../../art/world.js';
import {hitOf} from '../boss/arena.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// I6 (кусок 20): высота регулируется (10–100% от «полного» окна) — ручка снизу (тянуть; двойной клик — свернуть), кнопка ⌃ свернуть.
// Свёрнутое окно — тонкая «губа» с кнопкой развернуть; подпись района улетает влево и возвращается при разворачивании.
// o.k()→0.1..1, o.setK(k,save), o.setOn(bool), o.later()→bool (бой отложен), o.onLater() — «Начать бой» из губы.
export const DW_K0=.4;
export const dwMaxPx=(vw=innerWidth,vh=innerHeight)=>vw<=700?Math.max(110,Math.min(180,vh*.22)):Math.max(120,Math.min(280,vh*.3));
export function makeDistrictWindow(o){ // o: {el, G:()=>G, state:G=>..., hp:G=>0..1, prog:G=>0..1, on:()=>bool, fx:()=>..., onOpen(kind)}
 const el=o.el;let key='',ph=0,lastHit=0;
 const draw=(d,st)=>{const G=o.G(),boss=st!=='scenery',hp=o.hp(G);ph=phaseOf(hp);
  el.innerHTML=`<div class="dw-sc">${districtLayers(d).map((s,i)=>boss||i!==4?`<div class="dw-l" style="--z:${i}">${[0,1,2,3,4].map(k=>`<div class="dw-t${k%2?' m':''}">${s}</div>`).join('')}</div>`:'').join('')}</div><i class="dw-shade"></i>
   ${boss?`<i class="dw-lb t"></i><i class="dw-lb b"></i><div class="dw-boss" id="dw-boss">${bossSvg(d,{phase:ph})}</div><div class="dw-fxl" id="dw-fx"></div>`:''}
   <div class="dw-info">${crest(d-1,boss?'boss':'cur')}<div><small>РАЙОН ${d} ИЗ 12${boss?' · БОСС':''}</small><b>${esc(DIST[d-1][0])}</b>
    ${boss?`<span class="dw-bn">${esc(DIST[d-1][3])}</span>`:`<span class="dw-pr">до босса <em id="dw-pr"></em></span>`}</div></div>
   ${boss?`<div class="dw-hp ${st==='finish'?'fin':''}"><i class="dw-hpf" id="dw-hpf"></i><i class="dw-seg" style="left:33.3%"></i><i class="dw-seg" style="left:66.6%"></i><em>${st==='finish'?'FINISH HIM — нужен разговор с ЛПР':'HP'}</em></div>`:''}
   <button class="dw-open" data-dw="open" title="${boss?'Смотреть арену':'Открыть карту'}">${boss?'Арена ⤢':'Карта ⤢'}</button>
   <button class="dw-ctl" data-dwc="fold" title="Свернуть окно района" aria-label="Свернуть окно района"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 10l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
   <div class="dw-grip" data-dwc="grip" role="slider" tabindex="0" aria-label="Высота окна района" title="Тяни — высота окна. Двойной клик — свернуть"><i></i></div>
   <button class="dw-lip" data-dwc="lip"><svg class="dl-a" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="dl-n"></span></button>`;
  el.dataset.st=st};
 const kOf=()=>Math.max(.1,Math.min(1,o.k?o.k():DW_K0));
 const lip=()=>{const n=el.querySelector('.dl-n');if(!n)return;const G=o.G(),d=G.district||1,st=o.state(G),D=DIST[d-1],w=st!=='scenery'&&!!(o.later&&o.later());
  const t=st==='scenery'?`${D[0]} · до босса ${Math.round(Math.min(1,o.prog(G))*100)}% · развернуть`:w?`БОСС ЖДЁТ: ${D[3]} · начать бой`:`Босс: ${D[3]} · развернуть`;
  if(n.textContent!==t)n.textContent=t;el.classList.toggle('wait',w)};
 const sync=()=>{const on=o.on();el.style.setProperty('--dwk',kOf().toFixed(3));el.classList.toggle('off',!on);el.classList.toggle('mini',on&&kOf()<.3);
  if(!el.firstChild){const G=o.G();key=(G.district||1)+'|'+o.state(G);draw(G.district||1,o.state(G))}lip();if(!on){el.classList.toggle('boss',o.state(o.G())!=='scenery');return}const G=o.G(),d=G.district||1,st=o.state(G),k=d+'|'+st,hp=o.hp(G);
  if(k!==key||(st!=='scenery'&&phaseOf(hp)!==ph)){key=k;draw(d,st)}
  el.classList.toggle('boss',st!=='scenery');el.classList.toggle('fin',st==='finish');
  const f=el.querySelector('#dw-hpf');if(f)f.style.setProperty('--hp',hp);
  const pr=el.querySelector('#dw-pr');if(pr)pr.textContent=Math.round(Math.min(1,o.prog(G))*100)+'%'};
 const fold=on=>{if(o.fx()!=='off'){el.classList.add('anim');setTimeout(()=>el.classList.remove('anim'),800)}o.setOn&&o.setOn(on);sync()};
 let drag=null;
 el.addEventListener('pointerdown',e=>{const g=e.target.closest('[data-dwc="grip"]');if(!g)return;e.preventDefault();e.stopPropagation();drag={y:e.clientY,k:kOf(),max:dwMaxPx()};el.classList.add('drag');try{g.setPointerCapture(e.pointerId)}catch(_){}});
 el.addEventListener('pointermove',e=>{if(!drag)return;const k=Math.max(.1,Math.min(1,drag.k+(e.clientY-drag.y)/drag.max));o.setK&&o.setK(k,false);el.style.setProperty('--dwk',k.toFixed(3));el.classList.toggle('mini',k<.3)});
 const end=()=>{if(!drag)return;drag=null;el.classList.remove('drag');o.setK&&o.setK(kOf(),true)};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 el.addEventListener('dblclick',e=>{if(e.target.closest('[data-dwc="grip"]')){e.stopPropagation();fold(false)}});
 el.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('[data-dwc="grip"]');if(!g)return;const st={ArrowUp:-.1,ArrowDown:.1}[e.key];if(st){e.preventDefault();e.stopPropagation();o.setK&&o.setK(Math.max(.1,Math.min(1,kOf()+st)),true);sync()}});
 const hit=cls=>{if(!el.classList.contains('boss'))return;const kind=hitOf(cls,o.state(o.G())),b=el.querySelector('#dw-boss'),fx=el.querySelector('#dw-fx');if(!b)return;
  const off=o.fx()==='off';b.classList.remove('h-scratch','h-hit','h-crit','h-immune');void b.offsetWidth;b.classList.add('h-'+kind);
  if(fx&&!off){const t=document.createElement('i');t.className='dw-pop '+kind;t.textContent={scratch:'царапина',hit:'УДАР',crit:'КРИТ!',immune:'IMMUNE'}[kind];fx.appendChild(t);setTimeout(()=>t.remove(),1100)}
  if(kind==='crit'&&!off){el.classList.remove('crit');void el.offsetWidth;el.classList.add('crit')}lastHit=Date.now()};
 el.addEventListener('click',e=>{const c=e.target.closest('[data-dwc]');if(c){e.stopPropagation();const k=c.dataset.dwc;if(k==='fold')fold(false);else if(k==='lip'){if(el.classList.contains('wait')&&o.onLater)o.onLater();else fold(true)}return}if(el.classList.contains('off'))return;if(e.target.closest('[data-dw]')||e.target.closest('.dw-sc,.dw-boss'))o.onOpen(el.classList.contains('boss')?'arena':'map')});
 // вход босса после интро: окно «вспыхивает», босс въезжает справа (арена закрылась сама — дайлер снова под рукой)
 const enter=()=>{if(o.fx()==='off')return;el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');setTimeout(()=>el.classList.remove('enter'),1600)};
 return{sync,hit,enter,el,fold,_key:()=>key}}
