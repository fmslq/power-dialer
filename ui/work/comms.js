// «РАЦИЯ» на рабочем экране (STORY_BIBLE §7): мир говорит с тобой между звонками. Гудок, Лом, Голос Совета, жители района.
// Не модальная карточка слева внизу, сама гаснет. Пока ты на линии или открыт оверлей — ждёт в очереди.
// Частота: S.chat = 'often' (по умолчанию, Q8) | 'rare' | 'off'. События района (beats) показываются всегда, кроме 'off'.
import {guideSvg} from '../../art/guide.js';
import {lomSvg} from '../../art/base.js';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COUNCIL=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 26h10l16-12v36L20 38H10z" fill="#1a0d10" stroke="#ff1f3d" stroke-width="3" stroke-linejoin="round"/><path d="M44 22q6 10 0 20M50 16q11 16 0 32" fill="none" stroke="#ff1f3d" stroke-width="3" stroke-linecap="round" class="cm-wave"/></svg>`;
const LOCAL=c=>`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="11" fill="#0d1110" stroke="${c}" stroke-width="3"/><path d="M12 58q2-20 20-20t20 20" fill="#0d1110" stroke="${c}" stroke-width="3"/><path d="M41 18h8v14" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`;
export function makeComms(o){ // o: {mount, busy:()=>bool, mode:()=>'often'|'rare'|'off', accent:()=>'#hex', sfx(name)}
 const q=[];let el=null,t=0,last={};
 const box=document.createElement('div');box.className='cm';box.setAttribute('aria-live','polite');(o.mount||document.body).appendChild(box);
 const face=m=>m.who==='guide'?guideSvg(m.mood||'talking'):m.who==='lom'?lomSvg(m.mood||'welcome'):m.who==='council'?COUNCIL:m.who==='boss'?LOCAL('#ff1f3d'):LOCAL(o.accent?o.accent():'#39ff14');
 const label=m=>m.who==='guide'?'ГУДОК':m.who==='lom'?'ЛОМ':m.who==='council'?'ГОЛОС СОВЕТА':(m.name||'НА ЛИНИИ').toUpperCase();
 const show=m=>{el=document.createElement('div');el.className='cm-c k-'+m.who;
  el.innerHTML=`<div class="cm-f">${face(m)}</div><div class="cm-tx"><b>${esc(label(m))}</b><p></p><i class="cm-bar"><i></i></i></div><button class="cm-x" aria-label="Закрыть">×</button>`;
  box.appendChild(el);const p=el.querySelector('p');let i=0;const txt=m.text,dur=Math.max(5200,Math.min(11000,2600+txt.length*55));
  el.style.setProperty('--dur',dur+'ms');requestAnimationFrame(()=>el&&el.classList.add('in'));o.sfx&&o.sfx(m.who==='council'?'tick':'tick');
  const type=()=>{if(!el)return;i=Math.min(txt.length,i+2);p.textContent=txt.slice(0,i);if(i<txt.length)setTimeout(type,18)};type();
  const x=el;x.querySelector('.cm-x').onclick=()=>hide(x);clearTimeout(t);t=setTimeout(()=>hide(x),dur)};
 const hide=x=>{if(!x)return;x.classList.remove('in');x.classList.add('out');setTimeout(()=>x.remove(),400);if(el===x){el=null;setTimeout(pump,700)}};
 const pump=()=>{if(el||!q.length)return;if(o.busy&&o.busy()){clearTimeout(pump._t);pump._t=setTimeout(pump,4000);return}show(q.shift())};
 // say: m={who,mood,name,text}; kind — ключ анти-повтора; cd — пауза между репликами этого вида (мс)
 const say=(m,kind,cd=0)=>{const mode=o.mode?o.mode():'often';if(mode==='off')return false;const now=Date.now();
  if(kind&&cd&&last[kind]&&now-last[kind]<cd*(mode==='often'?.4:1))return false;if(kind)last[kind]=now;
  if(q.length>3)q.splice(0,q.length-3);q.push(m);pump();return true};
 return{say,pump,isOpen:()=>!!el,clear:()=>{q.length=0;if(el)hide(el)}}}
