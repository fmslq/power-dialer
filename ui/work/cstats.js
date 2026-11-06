// Кусок 27: СКРИПТЫ и УНИВЕРСАЛЬНАЯ СТАТИСТИКА ЗВОНКОВ.
// Кнопка «Скрипт: имя» в шапке «Статус звонка» — выбрать или вписать свою версию скрипта; каждый звонок пишется в журнал
// (core/calllog.js) вместе с текущим скриптом, штатом и местным временем лида. Окно «Статистика звонков» (меню ☰):
// фильтры, группировка и выбор метрик галочками; выбор сохраняется в ct1 (save.cstat).
import {clLoad,clSave,clAdd,clDrop,clDur,clImport,clTable,METRICS,DEF_METRICS,GROUPS,fmtM,SLOTS,slotOf,slotName,DOW,tzOf} from '../../core/calllog.js';
import {statusIndex} from '../../dialer/statuses.js';
import {lstate} from '../../dialer/geo.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const X='<svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg>';
export function makeCStats({save,d,persist,openOv,closeOv,toast,now=Date.now,mem=false}){
 const L=mem?[]:clLoad();let tm=0;const keep=()=>{if(mem)return;clearTimeout(tm);tm=setTimeout(()=>{if(!clSave(L))toast('Журнал звонков не сохранился: мало места в браузере','bad')},800)};
 const S=()=>save.scripts||(save.scripts={list:[{id:1,n:'Основной'}],cur:1,seq:1});
 const cur=()=>{const s=S();return s.list.find(x=>x.id===s.cur)||s.list[0]};
 const scName=id=>id===-1?'Из таблицы (до журнала)':((S().list.find(x=>x.id===id)||{}).n||'Скрипт #'+id);
 const btn=()=>`<button class="wk-scr" id="b-scr" title="Какой скрипт ты сейчас говоришь. Статистика звонков считается по каждому скрипту отдельно"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span>Скрипт: <b>${esc(cur().n)}</b></span></button>`;
 const syncBtn=()=>{const b=document.getElementById('b-scr');if(b)b.outerHTML=btn()};
 // запись
 const rec=meta=>{if(!meta||!meta.lead)return;clAdd(L,{t:now(),id:meta.index,st:meta.lead.state,phone:meta.lead.phone,sc:S().cur,changed:!!meta.changed});keep()};
 const drop=phone=>{if(clDrop(L,phone,now()))keep()};
 const dur=(callId,sec)=>{const e=(save.zlog||[]).find(x=>x[0]===callId);if(e&&clDur(L,e[1],sec,now()))keep()};
 // окно скриптов
 const openScripts=()=>{const s=S();
  openOv('scr',`<div class="wk-wh"><h3>СКРИПТ</h3><button class="wk-x" id="sc-x">${X}</button></div><div class="wk-wb cs-scr">
   <p class="cs-hint">Выбери, какой скрипт говоришь сейчас. Каждый звонок запоминает скрипт, и в «Статистике звонков» видно, какая версия чаще доводит до питча и встречи.</p>
   <div class="cs-sl">${s.list.filter(x=>!x.off).map(x=>`<label class="cs-si ${x.id===s.cur?'on':''}"><input type="radio" name="scr" value="${x.id}" ${x.id===s.cur?'checked':''}><span><b>${esc(x.n)}</b>${x.txt?`<em>${esc(x.txt)}</em>`:''}</span><button class="cs-del" data-del="${x.id}" title="Убрать из списка (статистика по нему останется)">${X}</button></label>`).join('')}</div>
   <div class="cs-new"><input id="sc-n" maxlength="40" placeholder="Новая версия, например «Скрипт B: вопрос про сезон»"><textarea id="sc-t" maxlength="400" rows="2" placeholder="Чем отличается (по желанию)"></textarea><button class="wk-btn pri" id="sc-add">Добавить и выбрать</button></div>
   <div class="cs-foot"><button class="wk-btn" id="sc-st">Открыть статистику звонков</button></div></div>`,true);
  const ov=document.getElementById('sc-x').closest('.wk-win');document.getElementById('sc-x').onclick=closeOv;
  ov.querySelectorAll('input[name=scr]').forEach(r=>r.onchange=()=>{s.cur=+r.value;persist();syncBtn();openScripts();toast('Скрипт: '+cur().n)});
  ov.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const live=s.list.filter(x=>!x.off);if(live.length<2){toast('Нужен хотя бы один скрипт','bad');return}const x=s.list.find(y=>y.id===+b.dataset.del);x.off=1;if(s.cur===x.id)s.cur=s.list.find(y=>!y.off).id;persist();syncBtn();openScripts()});
  document.getElementById('sc-add').onclick=()=>{const n=document.getElementById('sc-n').value.trim();if(!n){document.getElementById('sc-n').focus();return}const id=(s.seq=Math.max(s.seq|0,...s.list.map(x=>x.id))+1);s.list.push({id,n,txt:document.getElementById('sc-t').value.trim()});s.cur=id;persist();syncBtn();openScripts();toast('Новый скрипт: '+n)};
  document.getElementById('sc-n').onkeydown=e=>{if(e.key==='Enter')document.getElementById('sc-add').click()};
  document.getElementById('sc-st').onclick=()=>open()};
 document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#b-scr')){e.preventDefault();openScripts()}});
 // окно статистики
 const C=()=>{const c=save.cstat||(save.cstat={});c.f=c.f||{};c.g=c.g||'sc';c.m=c.m||DEF_METRICS.slice();return c};
 const day=t=>{const x=new Date(t);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
 const chips=(key,vals,name)=>{const f=C().f[key]||[];return vals.map(v=>`<button data-f="${key}" data-v="${esc(JSON.stringify(v))}" class="${f.includes(v)?'on':''}">${esc(name(v))}</button>`).join('')};
 const draw=()=>{const c=C(),f=c.f,M=METRICS.filter(m=>c.m.includes(m[0])),T=clTable(L,f,c.g,scName),tot=clTable(L,f,'all',scName)[0];
  const sts=[...new Set(L.map(r=>r[2]).filter(Boolean))].sort(),scs=[...new Set(L.map(r=>r[6]))].sort((a,b)=>a-b),tzs=[...new Set(L.map(r=>tzOf(r[2])))].sort();
  const per=f.from||f.to?'':'all',q=(k,lbl,from)=>`<button data-per="${k}" class="${(k==='all'&&per)||(from&&f.from===from&&!f.to)?'on':''}">${lbl}</button>`,t=now();
  const row=(x,cls='')=>`<tr class="${cls}"><th>${esc(x.name)}</th>${M.map(m=>`<td>${fmtM(m[2](x.a),m[3])}</td>`).join('')}</tr>`;
  const first=L.length?day(L[0][0]*1000):'';
  return`<div class="cs-top">
   <div class="cs-r"><span class="cs-k">Сравнить по</span><div class="cs-ch" id="cs-g">${Object.entries(GROUPS).map(([k,[n]])=>`<button data-g="${k}" class="${c.g===k?'on':''}">${n}</button>`).join('')}</div></div>
   <div class="cs-r"><span class="cs-k">Период</span><div class="cs-ch">${q('all','Всё время')}${q('d0','Сегодня',day(t))}${q('d7','7 дней',day(t-6*864e5))}${q('d30','30 дней',day(t-29*864e5))}<label class="cs-dt">с <input type="date" id="cs-from" value="${esc(f.from||'')}"></label><label class="cs-dt">по <input type="date" id="cs-to" value="${esc(f.to||'')}"></label></div></div>
   ${scs.length>1?`<div class="cs-r"><span class="cs-k">Скрипт</span><div class="cs-ch">${chips('sc',scs,scName)}</div></div>`:''}
   ${tzs.length>1?`<div class="cs-r"><span class="cs-k">Пояс</span><div class="cs-ch">${chips('tz',tzs,x=>x)}</div></div>`:''}
   ${sts.length>1?`<div class="cs-r"><span class="cs-k">Штат</span><div class="cs-ch">${chips('st',sts,x=>x)}</div></div>`:''}
   <div class="cs-r"><span class="cs-k">Время у лида</span><div class="cs-ch">${chips('slot',[0,...SLOTS,1080],v=>v===0?'до 7':v===1080?'18+':slotName(v).split('–')[0])}</div></div>
   <div class="cs-r"><span class="cs-k">День недели лида</span><div class="cs-ch">${chips('dow',[1,2,3,4,5,6,0],v=>DOW[v])}</div></div>
   <details class="cs-r cs-mt"><summary><span class="cs-k">Метрики</span><em>${M.length} из ${METRICS.length} · нажми, чтобы выбрать</em></summary><div class="cs-ch cs-ms">${METRICS.map(m=>`<label><input type="checkbox" data-m="${m[0]}" ${c.m.includes(m[0])?'checked':''}>${esc(m[1])}</label>`).join('')}</div></details></div>
  <div class="cs-tw">${tot&&tot.a.n?`<table class="cs-t"><thead><tr><th>${esc(GROUPS[c.g][0])}</th>${M.map(m=>`<th>${esc(m[1])}</th>`).join('')}</tr></thead><tbody>${c.g!=='all'?row({...tot,name:'Итого'},'tot'):''}${T.map(x=>row(x)).join('')}</tbody></table>`
   :`<p class="cs-empty">${L.length?'Под эти фильтры звонков нет. Сними часть фильтров.':'Журнал пуст. Он заполняется сам с каждым статусом. Можно подтянуть прошлые звонки из таблицы кнопкой ниже.'}</p>`}</div>
  <div class="cs-foot"><span>В журнале ${L.length.toLocaleString('ru')} звонков${first?' · с '+first:''}. Пикап = взял человек (владелец, гейткипер, «Другое»). Питч = Owner pitched, CALL BOOKED, Discovery. Встреча = CALL BOOKED и Discovery.</span>
   <button class="wk-btn" id="cs-imp" title="Берёт Result, Date Engaged и State из открытой таблицы. Скрипт у них будет «Из таблицы»">Подтянуть историю из таблицы</button><button class="wk-btn" id="cs-rs">Сбросить фильтры</button></div>`};
 const bind=()=>{const box=document.getElementById('cs-b');if(!box)return;const c=C();
  box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.g){c.g=b.dataset.g}
   else if(b.dataset.f){const k=b.dataset.f,v=JSON.parse(b.dataset.v),a=c.f[k]||(c.f[k]=[]);const i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v)}
   else if(b.dataset.per){const t=now(),k=b.dataset.per;c.f.to='';c.f.from=k==='all'?'':day(t-({d0:0,d7:6,d30:29}[k])*864e5)}
   else if(b.id==='cs-rs'){c.f={}}
   else if(b.id==='cs-imp'){imp();return}else return;persist();re()};
  box.onchange=e=>{const x=e.target;if(x.dataset.m){c.m=METRICS.map(m=>m[0]).filter(k=>k===x.dataset.m?x.checked:c.m.includes(k));if(!c.m.length)c.m=['n']}else if(x.id==='cs-from')c.f.from=x.value;else if(x.id==='cs-to')c.f.to=x.value;else return;persist();re(x.dataset.m?1:0)}};
 const re=keepOpen=>{const box=document.getElementById('cs-b');if(!box)return;const sc=box.scrollTop;box.innerHTML=draw();if(keepOpen){const m=box.querySelector('.cs-mt');if(m)m.open=true}box.scrollTop=sc};
 const imp=()=>{const t=d.t;if(!t||!t.L||!t.L.length){toast('Сначала открой таблицу с лидами','bad');return}const rows=[];
  for(const l of t.L){const r=t.get(l,'Result');if(!r)continue;rows.push({res:statusIndex(r,d.P.map),eng:t.get(l,'Date Engaged'),st:lstate(t,l),phone:t.ph(l)})}
  const o=clImport(L,rows);keep();re();toast(o.add?`Из таблицы добавлено ${o.add} звонков${o.skip?`, пропущено ${o.skip} (уже есть или нет даты)`:''}`:'Новых звонков в таблице не нашлось')};
 const open=()=>{openOv('cst',`<div class="wk-wh"><h3>СТАТИСТИКА ЗВОНКОВ</h3><button class="wk-x" id="cs-x">${X}</button></div><div class="wk-wb cs-b" id="cs-b">${draw()}</div>`);document.getElementById('cs-x').onclick=closeOv;bind()};
 return{btn,rec,drop,dur,open,openScripts,log:()=>L}}
