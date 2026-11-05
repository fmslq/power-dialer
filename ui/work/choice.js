// E5 v2: исход после босса. У каждого босса свой: выбор из 2–3, один итог, итог по прошлым решениям или по игре в районе, награда позже.
// На каждой карточке — что будет по сюжету и какой бонус (цифрами).
import {OUT,optsFor,condPick,choose,bossName,shiftMoney} from '../../core/allies.js';
import {DIST} from '../../core/meta.js';
import {PRE} from '../../story/shelves.js';
import {DEFECT} from '../../story/systems.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $m=v=>'$'+Math.round(v).toLocaleString('ru');
const KIND={one:'ИТОГ',two:'ВЫБОР',three:'ВЫБОР ИЗ ТРЁХ',cond:'ИТОГ ПО ТВОИМ ДЕЛАМ',late:'ВЫБОР С ОТЛОЖЕННОЙ НАГРАДОЙ'};
export function showChoice({d,save,G,persist,toast,sfx=()=>{}}){return new Promise(res=>{
 const O=OUT[d],acc=DIST[d-1][1]||'#39ff14',nm=bossName(d);if(!O){res(null);return}
 const single=O.kind==='one'||O.kind==='cond',list=single?[O.kind==='one'?O.opts[0]:condPick(save,d)]:optsFor(save,d);
 let why='';if(O.kind==='cond'){if(O.dep){const v=(save.story.ch||{})[O.dep];why=v==='city'?'В Шпиле ты открыл хранилище городу.':'В Шпиле ты забрал золото.'}
  else{const r=(save.story.dc||{})[d];why=r?`Встреч в этом районе: ${r.met} (нужно ${O.need}).`:'Район пройден до учёта встреч — засчитано в твою пользу.'}}
 const card=(o,i)=>{const mny=o.eff.money?` (≈${$m(shiftMoney(d,o.eff.money))})`:'',df=DEFECT[d]&&DEFECT[d].opt===o.id?DEFECT[d]:null;
  return`<button data-c="${o.id}" class="${o.ally?'al':'tr'}"><em>${single?'ИТОГ':(o.ally?'СОЮЗ':'СДЕЛКА')}</em><b>${esc(o.t)}</b><p>${esc(o.s)}</p>
   <ul><li><span>Бонус</span>${esc(o.b)}${mny}</li>${o.eff.from?`<li><span>Когда</span>с района ${o.eff.from}</li>`:''}${o.ally?'<li><span>Потом</span>выходит на связь в рации</li>':''}${df?`<li><span>Связист</span>${esc(df.nm)} уходит к тебе</li>`:''}</ul>${single?'':`<kbd>${i+1}</kbd>`}</button>`};
 const w=document.createElement('div');w.className='ch-wrap';w.style.setProperty('--a',acc);
 w.innerHTML=`<div class="ch k-${O.kind}" role="dialog" aria-label="Исход босса"><em class="ch-k">${KIND[O.kind]}</em><h3>${esc(nm)} дослушал</h3>${PRE[d]?`<div class="ch-pre"><em>ПРЕДЫСТОРИЯ · ${esc(PRE[d].nm)}</em><p>${esc(PRE[d].t)}</p></div>`:''}<p class="ch-s">${esc(O.why)}${why?` <b>${esc(why)}</b>`:''}</p>
  <div class="ch-c n${list.length}">${list.map(card).join('')}</div>
  ${single?'<div class="ch-b"><button class="pri" data-ok>Дальше <kbd>Enter</kbd></button></div>':''}
  <p class="ch-f">${single?'Здесь нет выбора: так решили город и твои звонки.':'Выбор один раз. Тупиков нет — все пути ведут дальше.'}</p></div>`;
 const done=id=>{const r=choose(save,G,d,id);removeEventListener('keydown',kd,true);w.remove();if(r.ok){persist();sfx(r.opt.ally?'levelup':'ching');
   toast(`${nm}: ${r.opt.t} — ${r.opt.b}${r.money?` · +${$m(r.money)}`:''}${r.def?` · Связист ${r.def} теперь с тобой`:''}`,'gold')}res(r.ok?r.opt.id:null)};
 const kd=e=>{e.stopPropagation();if(single&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();done(list[0].id);return}
  const n=+(e.code.match(/^Digit([1-3])$/)||[])[1];if(n&&list[n-1]){e.preventDefault();done(list[n-1].id)}};
 w.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>done(b.dataset.c));const ok=w.querySelector('[data-ok]');if(ok)ok.onclick=()=>done(list[0].id);
 addEventListener('keydown',kd,true);document.body.appendChild(w)})}
