// ИГРОВОЕ МЕНЮ на ☰ и Esc (ТЗ R1): стиль Persona 5 — косые полосы, крупные пункты, выделение белой плашкой с цветной тенью.
// Меню НЕ ставит дайлер на паузу: звонок и таймеры идут как шли (игра первична, но работа не должна останавливаться от меню).
import {icon} from '../../art/icons.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const MENU=[['resume','Продолжить','play','Esc'],['settings','Настройки','settings',''],['map','Карта','map','⇧G'],['base','База','base','⇧H'],['journal','Журнал','book',''],['cstats','Статистика звонков','dossier',''],['tutorial','Обучение','info',''],
 ['debug','Debug','bug','`'],['export','Экспорт сохранения','export',''],['home','В главное меню','home','']];
export function makeGameMenu(o){ // o: {run(id), vol:{get,set}, info:()=>({rank,lvl,money,streak})}
 let el=null,sel=0;
 const isOpen=()=>!!el;
 const draw=()=>{const v=o.vol.get(),inf=o.info();
  return`<div class="gm-bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i><span class="gm-word">UPLINK</span></div>
  <div class="gm-in"><div class="gm-h"><b>МЕНЮ</b><span>смена идёт · звонок не прерывается</span></div>
   <nav class="gm-list" role="menu">${MENU.map(([k,t,ic,kb],i)=>`<button class="gm-i ${i===sel?'on':''}" role="menuitem" data-k="${k}" style="--i:${i}"><span class="sh"></span><span class="tx">${icon(ic)}<b>${esc(t)}</b>${kb?`<kbd>${kb}</kbd>`:''}</span></button>`).join('')}</nav>
   <aside class="gm-card"><div class="r"><span>Ранг</span><b>${esc(inf.rank)}</b></div><div class="r"><span>Уровень</span><b>${esc(inf.lvl)}</b></div><div class="r"><span>Баланс</span><b class="m">${esc(inf.money)}</b></div><div class="r"><span>Серия</span><b>${esc(inf.streak)}</b></div>
    <div class="gm-vol"><label>${icon('sfx')}<span>Звуки</span><input type="range" min="0" max="100" data-vol="sfx" value="${Math.round(v.sfx*100)}" style="--v:${Math.round(v.sfx*100)}%"></label>
    <label>${icon('music')}<span>Музыка</span><input type="range" min="0" max="100" data-vol="music" value="${Math.round(v.music*100)}" style="--v:${Math.round(v.music*100)}%"></label></div></aside>
   <div class="gm-ft"><kbd>↑</kbd><kbd>↓</kbd> выбор · <kbd>Enter</kbd> открыть · <kbd>Esc</kbd> закрыть</div></div>`};
 const mark=()=>{if(!el)return;el.querySelectorAll('.gm-i').forEach((b,i)=>b.classList.toggle('on',i===sel));const b=el.querySelectorAll('.gm-i')[sel];if(b)b.focus({preventScroll:true})};
 const open=()=>{if(el)return;sel=0;el=document.createElement('div');el.className='gm';el.setAttribute('role','dialog');el.setAttribute('aria-label','Игровое меню');el.innerHTML=draw();document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('.gm-i');if(b)return pick(b.dataset.k);if(e.target.closest('.gm-bg')||e.target===el||e.target.classList.contains('gm-in'))close()});
  el.addEventListener('mousemove',e=>{const b=e.target.closest('.gm-i');if(!b)return;const i=[...el.querySelectorAll('.gm-i')].indexOf(b);if(i!==sel){sel=i;mark()}});
  el.addEventListener('input',e=>{const t=e.target;if(t.dataset.vol){o.vol.set(t.dataset.vol,t.value/100);t.style.setProperty('--v',t.value+'%')}});
  requestAnimationFrame(()=>{el&&el.classList.add('in');mark()})};
 // прогрев: первый показ меню на Mac давал микролаг (стили, шрифты, иконки). Рисуем его один раз невидимо в простое.
 const warm=()=>{try{const w=document.createElement('div');w.className='gm in';w.setAttribute('aria-hidden','true');w.style.cssText='visibility:hidden;pointer-events:none;contain:strict';w.innerHTML=draw();document.body.appendChild(w);void w.offsetHeight;requestAnimationFrame(()=>requestAnimationFrame(()=>w.remove()))}catch(_){}};
 (self.requestIdleCallback||(f=>setTimeout(f,1500)))(warm,{timeout:4000});
 const close=()=>{if(!el)return;const x=el;el=null;x.classList.remove('in');x.classList.add('out');setTimeout(()=>x.remove(),260);o.onClose&&o.onClose()};
 const pick=k=>{close();if(k!=='resume')setTimeout(()=>o.run(k),k==='home'?0:120)};
 // клавиши, пока меню открыто: возвращает true, если клавиша съедена
 const key=e=>{if(!el)return false;const n=MENU.length;
  if(e.code==='Escape'){close();return true}
  if(e.code==='ArrowDown'){sel=(sel+1)%n;mark();return true}
  if(e.code==='ArrowUp'){sel=(sel+n-1)%n;mark();return true}
  if(e.code==='Enter'||e.code==='Space'){if(e.target&&e.target.type==='range')return true;pick(MENU[sel][0]);return true}
  if(e.code==='Tab')return false;return true};
 return{open,close,isOpen,key,toggle:()=>el?close():open()}}
