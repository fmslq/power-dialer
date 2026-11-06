// АРЕНА БОССА (R3 основа, ТЗ §9.2): полноэкранная сцена района в темноте, летбоксы, свет босса, риг босса,
// шкала HP с 3 фазами, FINISH HIM, реакции на удары по классам статусов, дразнилки, интро и смерть.
// Не блокирует дайлер: статусы ставятся как обычно (клавиши проходят в работу), арена только показывает их.
import {hasArt,artUrl} from '../../art/overrides.js';
import {DIST} from '../../core/meta.js';
import {bossSvg,phaseOf} from '../../art/bosses.js';
import {BOSSES} from '../../story/bosses.js';
import {DISTRICTS} from '../../story/scenes.js';
import {districtLayers} from '../../art/scenes.js';
import {crest} from '../../art/world.js';
import {guideSvg} from '../../art/guide.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
// сила удара по классу статуса (ТЗ §9.2)
export const HIT={TRASH:'scratch',GATEKEEPER:'scratch',MINOR:'scratch',TALK:'hit',CALLBACK:'hit',BOOKED:'crit',DISCOVERY:'crit'};
export const hitOf=(cls,state)=>state==='finish'&&HIT[cls]==='scratch'?'immune':HIT[cls]||'scratch';
import {withCs} from '../../story/callsign.js';
export function makeArena(o){ // o: {mount, fx, sfx, G:()=>G, hp:G=>0..1, state:G=>'scenery'|'boss'|'finish', heat:()=>0..3}
 let el=null,d=0,tauntT=0,nTaunt=0,lastPh=1;
 const reduce=()=>RM.matches||o.fx()==='off';
 const isOpen=()=>!!el;
 const name=d=>DIST[d-1][3];
 const glitch=s=>[...s].map((c,i)=>`<i style="--i:${i}">${esc(c)}</i>`).join('');
 const html=(d,hp,st)=>{const ph=phaseOf(hp),X=DISTRICTS[d-1],ap=`assets/boss/arena${String(d).padStart(2,'0')}.png`;return`<div class="ba-st">${hasArt(ap)?`<div class="ba-l ba-img" style="--z:0;background-image:url('${artUrl(ap)}')"></div>`:districtLayers(d).map((s,i)=>`<div class="ba-l" style="--z:${i}">${s}</div>`).join('')}</div>
  <i class="ba-light"></i><i class="ba-vig"></i>
  <div class="ba-boss" id="ba-boss">${bossSvg(d,{phase:ph})}</div><div class="ba-par" id="ba-par"></div>
  <i class="ba-lb t"></i><i class="ba-lb b"></i>
  <header class="ba-hp"><div class="ba-nm">${crest(d-1,'boss')}<div><b class="ba-name">${glitch(name(d))}</b><span>${esc(DIST[d-1][4])}</span></div></div>
   <div class="ba-bar ${st==='finish'?'fin':''}"><i class="ba-fill" style="--hp:${hp}"></i><i class="ba-seg" style="left:33.3%"></i><i class="ba-seg" style="left:66.6%"></i>
   <em class="ba-fh">FINISH HIM — нужен разговор с ЛПР: Talk / Call Back / Booked / Discovery</em></div><small class="ba-ph">Фаза <b id="ba-phn">${ph}</b> из 3</small></header>
  <div class="ba-bub" id="ba-bub"></div>
  <div class="ba-gk" id="ba-gk"><div class="ba-gkp">${guideSvg('worried')}</div><p>${esc(X.boss.guide)}</p></div>
  <footer class="ba-ft"><span>Статусы ставятся как обычно — арена показывает удары</span><span><kbd>Esc</kbd> назад к работе</span></footer>`};
 const bubble=(t,ms=3200)=>{if(!el)return;t=withCs(t,o.cs&&o.cs());const b=el.querySelector('#ba-bub');b.textContent=t;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(tauntT);tauntT=setTimeout(()=>b&&b.classList.remove('on'),ms)};
 const sync=()=>{if(!el)return;const G=o.G(),hp=o.hp(G),st=o.state(G),ph=phaseOf(hp);el.querySelector('.ba-fill').style.setProperty('--hp',hp);el.querySelector('.ba-bar').classList.toggle('fin',st==='finish');el.classList.toggle('finish',st==='finish');
  if(ph!==lastPh){el.querySelector('.bs').dataset.ph=ph;el.querySelector('#ba-phn').textContent=ph;if(ph>lastPh){el.classList.remove('phase');void el.offsetWidth;el.classList.add('phase');o.sfx&&o.sfx('levelup')}lastPh=ph}};
 const parts=(kind)=>{if(reduce()||!el)return;const box=el.querySelector('#ba-par'),c=BOSSES[d-1].colors,n=kind==='crit'?18:kind==='hit'?8:0;let h='';
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=120+Math.random()*220;h+=`<i class="${kind==='crit'&&i%2?'coin':'shard'}" style="--x:${Math.cos(a)*r}px;--y:${Math.sin(a)*r-80}px;--c:${c[2]};--r:${Math.random()*720-360}deg"></i>`}
  box.innerHTML=h;setTimeout(()=>{if(box)box.innerHTML=''},1100)};
 // удар по классу статуса; state учитывается для IMMUNE
 const hit=(cls)=>{if(!el)return;const G=o.G(),st=o.state(G),k=hitOf(cls,st),bs=el.querySelector('#ba-boss');
  bs.classList.remove('scratch','hit','crit','immune');void bs.offsetWidth;bs.classList.add(k);el.classList.remove('shake','flash');void el.offsetWidth;
  if(k==='crit'){el.classList.add('shake','flash');if(!reduce()){el.classList.add('stop');setTimeout(()=>el&&el.classList.remove('stop'),140)}o.sfx&&o.sfx('stamp')}
  else if(k==='hit'){el.classList.add('shake');o.sfx&&o.sfx('tick')}else if(k==='immune'){o.sfx&&o.sfx('del')}
  parts(k);sync();const X=DISTRICTS[d-1];nTaunt++;
  if(k==='crit')bubble(X.taunt.crit);else if(k==='immune')bubble(X.taunt.immune);else if(nTaunt%4===0)bubble(X.taunt.streak);
  if(o.state(o.G())==='finish'&&!el.dataset.fh){el.dataset.fh=1;setTimeout(()=>bubble(X.finish,4200),900)}};
 const open=(dd,{intro=false}={})=>{if(el)close(true);d=dd;const G=o.G(),hp=o.hp(G),st=o.state(G);lastPh=phaseOf(hp);nTaunt=0;
  el=document.createElement('div');el.className='ba'+(intro&&!reduce()?' intro':' back')+(reduce()?' rm':'');el.dataset.d=d;el.setAttribute('role','dialog');el.setAttribute('aria-label','Арена босса: '+name(d));
  el.innerHTML=html(d,hp,st);o.mount.append(el);el.classList.toggle('finish',st==='finish');
  requestAnimationFrame(()=>el&&el.classList.add('in'));
  if(intro){o.sfx&&o.sfx('fanfare');setTimeout(()=>bubble(DISTRICTS[d-1].boss.line,4200),reduce()?0:1500);setTimeout(()=>el&&el.classList.add('gk-on'),reduce()?0:5200)}
  el.addEventListener('mousemove',e=>{if(reduce())return;el.style.setProperty('--mx',(e.clientX/innerWidth-.5).toFixed(3));el.style.setProperty('--my',(e.clientY/innerHeight-.5).toFixed(3))})};
 // смерть босса: своя у каждого (класс dead + data-d), реплика поражения, дождь монет
 const defeat=(cb)=>{if(!el)return cb&&cb();const X=DISTRICTS[d-1];el.classList.add('dying');o.sfx&&o.sfx('fanfare');bubble(X.defeat,3600);parts('crit');setTimeout(()=>parts('crit'),400);
  setTimeout(()=>{el&&el.classList.add('dead')},reduce()?0:900);setTimeout(()=>{close();cb&&cb()},reduce()?600:4200)};
 const close=(now=false)=>{if(!el)return;clearTimeout(tauntT);const n=el;el=null;n.classList.remove('in');n.classList.add('out');setTimeout(()=>n.remove(),now||reduce()?0:300);o.onClose&&o.onClose()};
 const key=e=>{if(!el)return false;if(e.code==='Escape'){close();return true}return false}; // остальные клавиши — в работу (статусы)
 // показ для Debug: удары всех видов по очереди (прогресс не меняется)
 const demo=()=>{const seq=['TRASH','TALK','GATEKEEPER','BOOKED','CALLBACK','DISCOVERY'];seq.forEach((c,i)=>setTimeout(()=>el&&hit(c),2600+i*1500));
  setTimeout(()=>{if(!el)return;const b=el.querySelector('#ba-boss');b.classList.remove('scratch','hit','crit');void b.offsetWidth;b.classList.add('immune');bubble(DISTRICTS[d-1].taunt.immune)},2600+seq.length*1500)};
 return{open,close,isOpen,hit,sync,defeat,bubble,key,demo,cur:()=>d}}
export function runArenaTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('удары: мусор — царапина, разговор — удар, встреча — крит',()=>hitOf('TRASH','boss')==='scratch'&&hitOf('TALK','boss')==='hit'&&hitOf('BOOKED','boss')==='crit');
 t('FINISH HIM: мусор и гейткипер — IMMUNE, разговор бьёт',()=>hitOf('GATEKEEPER','finish')==='immune'&&hitOf('CALLBACK','finish')==='hit');
 return o}
