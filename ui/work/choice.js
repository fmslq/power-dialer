// E5: понятный выбор после босса. Две карточки с цифрами: что даёт каждый путь сейчас и навсегда.
import {ALLY,choose,trophyMoney,showpieceOf,bossName,DISC} from '../../core/allies.js';
import {DIST} from '../../core/meta.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $m=v=>'$'+Math.round(v).toLocaleString('ru');
export function showChoice({d,save,G,persist,toast,sfx=()=>{}}){return new Promise(res=>{
 const A=ALLY.find(x=>x.d===d),m=trophyMoney(d),sp=showpieceOf(d),acc=DIST[d-1][1]||'#39ff14',nm=bossName(d);
 const w=document.createElement('div');w.className='ch-wrap';w.style.setProperty('--a',acc);
 w.innerHTML=`<div class="ch" role="dialog" aria-label="Выбор после босса"><h3>${esc(nm)} проиграл</h3><p class="ch-s">Район ${d} твой. Что сделать с боссом? Выбор один раз — оба пути ведут дальше, тупиков нет.</p>
  <div class="ch-c"><button data-c="ally"><em>ОТПУСТИТЬ</em><b>${esc(nm)} станет союзником</b>
    <ul><li><span>Сейчас</span>денег нет</li><li><span>Навсегда</span>${esc(A.t)}</li><li><span>Потом</span>иногда выходит на связь в рации</li></ul><kbd>1</kbd></button>
   <button data-c="trophy"><em>ЗАБРАТЬ ТРОФЕЙ</em><b>Лом скупит трофей босса</b>
    <ul><li><span>Сейчас</span>+${$m(m)} (полсмены этого района)</li><li><span>Скидка</span>−${DISC*100}% на «${esc(sp?sp.name:'showpiece')}»${sp?` (${$m(sp.price)} → ${$m(sp.price*(1-DISC))})`:''}</li><li><span>Навсегда</span>бонуса нет</li></ul><kbd>2</kbd></button></div>
  <p class="ch-f">Гудок не осуждает ни один выбор. Но запоминает.</p></div>`;
 const done=how=>{const r=choose(save,G,d,how);removeEventListener('keydown',kd,true);w.remove();if(r.ok){persist();sfx(how==='ally'?'levelup':'ching');
   toast(how==='ally'?`${nm} — союзник: ${A.t}`:`Трофей босса продан: +${$m(r.money)}, скидка ${DISC*100}% на showpiece района`,'gold')}res(how)};
 const kd=e=>{e.stopPropagation();if(e.code==='Digit1'){e.preventDefault();done('ally')}else if(e.code==='Digit2'){e.preventDefault();done('trophy')}};
 w.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>done(b.dataset.c));addEventListener('keydown',kd,true);document.body.appendChild(w)})}
