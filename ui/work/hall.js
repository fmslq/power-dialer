// E2 «Зал трофеев» (референсы: Smash Bros. Trophy Hoard, DRG Memorial Hall, DOOM Fortress): полки по темам, постаменты,
// закрытые — тёмные силуэты с подсказкой, сверху витрина встреч и легенд. Только показ: награды забираются во вкладке ТРОФЕИ.
import {ACH} from '../../core/achv.js';
import {isClaimed} from '../../core/claim.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SH=[['dial','Наборы',/^(v\d|k\d|early|owl|iw)/],['voice','Голоса',/^(t\d|t5|gk)/],['meet','Встречи',/^(b\d|bper|d\d|b20|b25)/],['heat','Жар и серии',/^(h\d|s\d|od|sss)/],
 ['noise','Шум и рейды',/^(sp1|sp25|ch1|lg1|rl3|rd\d|fz1)$/],['day','Цели дня',/^(wm|hh|tr\d|pk1|nd)/],['scheme','Схема и Слышащие',/^(tree|op|sig)/],['world','Город',/^(c\d|c12|rsb|rap|ret|sp100|show|lvl)/]];
const FIG={dial:'M7 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L17 12l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 5 5a2 2 0 0 1 2-2z',voice:'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8',
 meet:'M6 3h12v5a6 6 0 0 1-12 0zM12 14v4M8 21h8M9 18h6M6 5H3a3 3 0 0 0 3 4M18 5h3a3 3 0 0 1-3 4',heat:'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z',
 noise:'M2 12h3l2-6 3 12 3-9 2 5 2-2h5',day:'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
 scheme:'M12 2l3 6h-6zM9 8l-3 14M15 8l3 14M7 14h10M8 19h8M12 2v20',world:'M3 21V9l5-3v15M8 21V4l7 3v14M15 21V11l6 2v8M2 21h20'};
const RN={c:'Обычная',r:'Редкая',l:'Легендарная'};
export function makeHall({save,toast=()=>{}}){let w=null;
 const shelf=s=>ACH.filter(a=>s[2].test(a.id));
 const ped=(a,cat)=>{const g=(save.ach||{})[a.id],ready=g&&!isClaimed(save,'a',a.id);
  return`<div class="hl-p r-${a.r} ${g?'got':'lock'}${ready?' ready':''}" title="${esc(g?a.n+' — '+a.h:'??? — '+a.h)}"><div class="fig"><svg viewBox="0 0 24 24"><path d="${FIG[cat]}"/></svg></div><i class="base"></i>
   <b>${g?esc(a.n):'???'}</b><span>${esc(a.h)}</span>${g?`<em>${new Date(g).toLocaleDateString('ru',{day:'numeric',month:'short'})}${ready?' · награда ждёт':''}</em>`:`<em>${RN[a.r]||''}</em>`}</div>`};
 const html=()=>{const got=save.ach||{},n=ACH.filter(a=>got[a.id]).length,tr=(save.trophies||[]).slice().reverse(),leg=ACH.filter(a=>a.r==='l'&&got[a.id]);
  const gold=tr.filter(t=>t.kind==='gold').length,pl=tr.length-gold;
  return`<div class="hl" role="dialog" aria-label="Зал трофеев"><header><b>ЗАЛ ТРОФЕЕВ</b><span>${n} из ${ACH.length} · встреч ${gold} · discovery ${pl}</span><button class="x" aria-label="Закрыть (Esc)"><svg viewBox="0 0 16 16" width="14" height="14" stroke="currentColor" stroke-width="2"><path d="M3 3l10 10M13 3L3 13"/></svg></button></header>
   <div class="hl-b"><section class="hl-vit"><h4>Витрина</h4><div class="hl-cups">${tr.slice(0,10).map(t=>`<div class="cup ${t.kind}" title="${esc(t.company)} · ${esc(t.st||'')}"><svg viewBox="0 0 24 24"><path d="${FIG.meet}"/></svg><b>${esc(t.company)}</b><span>${new Date(t.t).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span></div>`).join('')||'<p class="hl-e">Первая встреча встанет сюда золотым кубком.</p>'}</div>
    ${leg.length?`<div class="hl-leg">${leg.map(a=>`<span>★ ${esc(a.n)}</span>`).join('')}</div>`:''}</section>
    ${SH.map(s=>{const L=shelf(s),k=L.filter(a=>got[a.id]).length;return`<section class="hl-sh"><h4>${s[1]} <em>${k}/${L.length}</em></h4><div class="hl-row">${L.map(a=>ped(a,s[0])).join('')}</div><i class="plank"></i></section>`}).join('')}
    <p class="hl-foot">Закрытые ачивки — силуэты: подсказка, как открыть, всегда видна. Награду за открытую забирай во вкладке ТРОФЕИ.</p></div></div>`};
 const kd=e=>{if(!w)return;e.stopPropagation();if(e.code==='Escape'){e.preventDefault();close()}};
 const open=()=>{if(w)return;w=document.createElement('div');w.className='hl-wrap';w.innerHTML=html();document.body.appendChild(w);w.querySelector('.x').onclick=close;w.onclick=e=>{if(e.target===w)close()};addEventListener('keydown',kd,true)};
 const close=()=>{if(!w)return;removeEventListener('keydown',kd,true);w.remove();w=null};
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-hall]');if(b){e.preventDefault();open()}});
 return{open,close,isOpen:()=>!!w,shelves:()=>SH.map(s=>[s[0],shelf(s).length])}}
