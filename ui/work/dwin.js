// ОКНО В РАЙОН (ТЗ §9.1–9.2): верхняя полоса рабочего экрана со сценой текущего района (параллакс, огни, частицы).
// В фазе босса полоса разворачивается: сцена темнеет, по краям летбоксы, справа босс с риггом, снизу шкала HP по фазам,
// каждый статус бьёт босса прямо здесь (царапина / удар / крит / IMMUNE). Клик — сцена во весь экран (карта или арена).
import {DIST} from '../../core/meta.js';
import {districtLayers} from '../../art/scenes.js';
import {bossSvg,phaseOf} from '../../art/bosses.js';
import {crest} from '../../art/world.js';
import {hitOf} from '../boss/arena.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function makeDistrictWindow(o){ // o: {el, G:()=>G, state:G=>..., hp:G=>0..1, prog:G=>0..1, on:()=>bool, fx:()=>..., onOpen(kind)}
 const el=o.el;let key='',ph=0,lastHit=0;
 const draw=(d,st)=>{const G=o.G(),boss=st!=='scenery',hp=o.hp(G);ph=phaseOf(hp);
  el.innerHTML=`<div class="dw-sc">${districtLayers(d).map((s,i)=>boss||i!==4?`<div class="dw-l" style="--z:${i}">${[0,1,2,3,4].map(k=>`<div class="dw-t${k%2?' m':''}">${s}</div>`).join('')}</div>`:'').join('')}</div><i class="dw-shade"></i>
   ${boss?`<i class="dw-lb t"></i><i class="dw-lb b"></i><div class="dw-boss" id="dw-boss">${bossSvg(d,{phase:ph})}</div><div class="dw-fxl" id="dw-fx"></div>`:''}
   <div class="dw-info">${crest(d-1,boss?'boss':'cur')}<div><small>РАЙОН ${d} ИЗ 12${boss?' · БОСС':''}</small><b>${esc(DIST[d-1][0])}</b>
    ${boss?`<span class="dw-bn">${esc(DIST[d-1][3])}</span>`:`<span class="dw-pr">до босса <em id="dw-pr"></em></span>`}</div></div>
   ${boss?`<div class="dw-hp ${st==='finish'?'fin':''}"><i class="dw-hpf" id="dw-hpf"></i><i class="dw-seg" style="left:33.3%"></i><i class="dw-seg" style="left:66.6%"></i><em>${st==='finish'?'FINISH HIM — нужен разговор с ЛПР':'HP'}</em></div>`:''}
   <button class="dw-open" data-dw="open" title="${boss?'Смотреть арену':'Открыть карту'}">${boss?'Арена ⤢':'Карта ⤢'}</button>`;
  el.dataset.st=st};
 const sync=()=>{const on=o.on();el.classList.toggle('off',!on);if(!on)return;const G=o.G(),d=G.district||1,st=o.state(G),k=d+'|'+st,hp=o.hp(G);
  if(k!==key||(st!=='scenery'&&phaseOf(hp)!==ph)){key=k;draw(d,st)}
  el.classList.toggle('boss',st!=='scenery');el.classList.toggle('fin',st==='finish');
  const f=el.querySelector('#dw-hpf');if(f)f.style.setProperty('--hp',hp);
  const pr=el.querySelector('#dw-pr');if(pr)pr.textContent=Math.round(Math.min(1,o.prog(G))*100)+'%'};
 const hit=cls=>{if(!el.classList.contains('boss'))return;const kind=hitOf(cls,o.state(o.G())),b=el.querySelector('#dw-boss'),fx=el.querySelector('#dw-fx');if(!b)return;
  const off=o.fx()==='off';b.classList.remove('h-scratch','h-hit','h-crit','h-immune');void b.offsetWidth;b.classList.add('h-'+kind);
  if(fx&&!off){const t=document.createElement('i');t.className='dw-pop '+kind;t.textContent={scratch:'царапина',hit:'УДАР',crit:'КРИТ!',immune:'IMMUNE'}[kind];fx.appendChild(t);setTimeout(()=>t.remove(),1100)}
  if(kind==='crit'&&!off){el.classList.remove('crit');void el.offsetWidth;el.classList.add('crit')}lastHit=Date.now()};
 el.addEventListener('click',e=>{if(e.target.closest('[data-dw]')||e.target.closest('.dw-sc,.dw-boss'))o.onOpen(el.classList.contains('boss')?'arena':'map')});
 // вход босса после интро: окно «вспыхивает», босс въезжает справа (арена закрылась сама — дайлер снова под рукой)
 const enter=()=>{if(o.fx()==='off')return;el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');setTimeout(()=>el.classList.remove('enter'),1600)};
 return{sync,hit,enter,el,_key:()=>key}}
