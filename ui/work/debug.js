// DEBUG (клавиша ` или пункт меню): журнал Zoom, самопроверка ядра, калькулятор баланса, маппинг статусов. Только чтение.
// ЖУРНАЛ (пункт меню): смены по дням за 14 дней.
import {CONFIG as C,STATUS,districtThr} from '../../core/config.js';
import {afterCall} from '../../core/engine.js';
import {runAchvTests} from '../../core/achv.js';
import {runMetaTests} from '../../core/meta.js';
import {runMissionTests} from '../../core/missions.js';
import {runMapTests} from '../../core/mapstate.js';
import {dayKey} from '../../core/stats.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Math.round(v||0).toLocaleString('ru');
export const DBG_TABS=[['zoom','Журнал Zoom'],['test','Самопроверка'],['bal','Баланс'],['map','Статусы']];
export function selfTest(){const groups=[['Ачивки',runAchvTests],['База и магазин',runMetaTests],['Задания и директивы',runMissionTests],['Карта мира',runMapTests]];
 return groups.map(([n,f])=>{let r=[];try{r=f()}catch(e){r=[['запуск: '+e.message,false]]}return{n,all:r.length,fail:r.filter(x=>!x[1]).map(x=>x[0])}})}
const calc=(n,t,b,dist)=>{const tr=C.classes.TRASH.xp,tk=C.classes.TALK.xp,bk=C.classes.BOOKED.xp,xp=n*(1-t)*tr+n*t*tk+b*bk,thr=districtThr(dist);return{xp:Math.round(xp),days:xp>0?thr/xp:0,thr}};
export function debugHtml(c,tab){ // c: {zoom, G, tester, demo}
 const z=c.zoom;let body='';
 if(tab==='zoom'){const L=(z.log||[]).slice(-60).reverse();
  body=`<div class="dbg-row"><span>Событий в журнале: <b>${(z.log||[]).length}</b> · Zoom: <b>${esc(z.status||'—')}</b> · окно ${z.shown?'показано':'спрятано'} · ${z.live?'на связи':'нет связи'}</span><button class="wk-btn" data-b="zlog">Скопировать журнал</button></div>
  <div class="dbg-log">${L.length?L.map(e=>`<div><i>${esc((e.t||'').slice(11,19))}</i><b>${esc(e.type)}</b><span>${esc(JSON.stringify(e.data??'').slice(0,160))}</span></div>`).join(''):'<p class="cc-note">Пока пусто. События появятся, когда Zoom Phone пришлёт что-нибудь (звонок, ответ, отбой).</p>'}</div>`}
 else if(tab==='test'){const R=selfTest(),f=R.reduce((a,x)=>a+x.fail.length,0),all=R.reduce((a,x)=>a+x.all,0);
  body=`<div class="dbg-big ${f?'bad':'ok'}"><b>${all-f}/${all}</b><span>${f?'есть ошибки':'всё в порядке'}</span><button class="wk-btn" data-b="retest">Запустить ещё раз</button></div>
  <div class="wk-btns" style="margin:4px 0 12px"><button class="wk-btn" data-b="mapdemo" title="Только вид: прогресс не меняется">Показать раскрытие района на карте</button></div>
  ${R.map(g=>`<div class="dbg-row"><span>${esc(g.n)}</span><b class="${g.fail.length?'bad':'ok'}">${g.all-g.fail.length}/${g.all}</b></div>${g.fail.map(x=>`<div class="dbg-fail">✕ ${esc(x)}</div>`).join('')}`).join('')}
  <p class="cc-note">Полный набор (все тесты, включая дайлер и Zoom) запускается командой <code>node tests/run.mjs</code> из папки проекта.</p>`}
 else if(tab==='bal'){const G=c.G,v=c.calc||{n:100,t:20,b:1},r=calc(v.n,v.t/100,v.b,G.district);
  body=`<div class="dbg-calc"><label>Статусов в день<input type="number" min="0" max="400" data-c="n" value="${v.n}"></label><label>Разговоров, %<input type="number" min="0" max="100" data-c="t" value="${v.t}"></label><label>Встреч в день<input type="number" min="0" max="10" data-c="b" value="${v.b}"></label></div>
  <div class="dbg-big"><b>${num(r.xp)} XP</b><span>в день без множителей серии · район ${G.district} (${num(r.thr)} XP) — примерно за <b>${r.days.toFixed(1)}</b> дн.</span></div>
  <table class="dbg-t"><thead><tr><th>#</th><th>Район</th><th>дней по плану</th><th>множ. цен</th><th>порог XP</th></tr></thead><tbody>${C.districts.map(x=>`<tr class="${x[0]===G.district?'cur':''}"><td>${x[0]}</td><td>${esc(x[1])}</td><td>${x[2]}</td><td>x${x[3]}</td><td>${num(districtThr(x[0]))}</td></tr>`).join('')}</tbody></table>
  <p class="cc-note">План: железный день ≈ ${num(C.assumedDailyXp)} XP / $${num(C.assumedDailyMoney)}. Серия: шаги ${C.heat.steps.join(' / ')} → деньги x${C.heat.money.join(' / x')}. OVERDRIVE: серия ${C.od.streak}, ${C.od.sec/60} мин, $ x${C.od.money}, XP x${C.od.xp}.</p>`}
 else{body=`<table class="dbg-t"><thead><tr><th>клав.</th><th>Статус в таблице</th><th>класс</th><th>XP</th><th>$</th><th>очки</th><th>окно, с</th></tr></thead><tbody>${STATUS.map(s=>{const k=C.classes[s.cls];return`<tr><td><kbd>${s.key}</kbd></td><td>${esc(s.name)}</td><td>${s.cls}</td><td>${k.xp}</td><td>${k.money}</td><td>${k.pts}</td><td>${afterCall(s.id)}</td></tr>`}).join('')}</tbody></table>
  <p class="cc-note">«Окно» — сколько можно ждать после конца звонка до следующего, чтобы серия не упала (по журналу Zoom).</p>`}
 return`<div class="wk-wh"><h3>DEBUG</h3><button class="wk-x" id="dbg-x" title="Закрыть (Esc)"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>
 <div class="wk-wb dbg"><div class="dbg-nav">${DBG_TABS.map(([k,t])=>`<button data-t="${k}" class="${k===tab?'on':''}">${t}</button>`).join('')}</div>${body}</div>`}
export function journalHtml(root,now){const days=root.days||{},sh=root.shifts||{},rows=[];
 for(let i=0;i<14;i++){const t=now-i*864e5,k=dayKey(t),d=days[k];if(!d||!d.n)continue;const talks=(d.c.TALK||0)+(d.c.CALLBACK||0)+(d.c.BOOKED||0)+(d.c.DISCOVERY||0);
  rows.push(`<tr><td>${new Date(t).toLocaleDateString('ru',{weekday:'short',day:'numeric',month:'short'})}</td><td>${d.n}</td><td>${talks}</td><td>${d.c.BOOKED||0}</td><td>${d.bs||0}</td><td>${num(d.xp)}</td><td>$${num(d.money)}</td><td>${sh[k]?'✓':''}</td></tr>`)}
 return`<div class="wk-wh"><h3>ЖУРНАЛ СМЕН</h3><button class="wk-x" id="jr-x" title="Закрыть (Esc)"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>
 <div class="wk-wb">${rows.length?`<table class="dbg-t"><thead><tr><th>день</th><th>статусы</th><th>разговоры</th><th>встречи</th><th>лучшая серия</th><th>XP</th><th>$</th><th>смена закрыта</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<p class="cc-note">За последние 14 дней смен нет.</p>'}
 <p class="cc-note">Последние 14 дней. Подробный итог дня — кнопка «Закончить смену».</p></div>`}
