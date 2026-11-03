// РАБОЧИЙ ЭКРАН (R1 ч.4): дайлер (dialer/) + игра (core/Session) + Zoom. Только DOM и связка; логика живёт в dialer/ и core/.
import {CONFIG as C,districtThr} from '../../core/config.js';
import {SaveManager as SM} from '../../core/save.js';
import {EventBus} from '../../core/eventbus.js';
import {Session,makeCombo} from '../../core/session.js';
import {ZoomProvider,ManualProvider} from '../../core/providers.js';
import {windowState} from '../../core/engine.js';
import {guard} from '../../core/leadsource.js';
import {endShift,ensureDir} from '../../core/missions.js';
import {Dialer,BUTTONS,PRIM,WIN} from '../../dialer/dialer.js';
import {ZO,ZOOM_SRC} from '../../dialer/zoom.js';
import {resolveKey} from '../../dialer/hotkeys.js';
import {parseZoomHistory,viaApp} from '../../dialer/zoomcsv.js';
import {human} from '../../dialer/sheets.js';
import * as SFX from '../../audio/legacy-sfx.js';

const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mmss=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
const money=v=>'$'+Math.round(v||0).toLocaleString('ru');
const kvFactory=()=>(m,k,v)=>new Promise((ok,no)=>{const r=indexedDB.open("pd",1);r.onupgradeneeded=()=>r.result.createObjectStore("k");   // ТОТ ЖЕ IndexedDB «pd», что в старом
 r.onsuccess=()=>{const s=r.result.transaction("k","readwrite").objectStore("k"),q=m=="get"?s.get(k):s.put(v,k);q.onsuccess=()=>ok(q.result);q.onerror=no};r.onerror=no});
const memStore=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
const PHONE_SVG='<svg viewBox="0 0 24 24"><path d="M3 15c5-5 13-5 18 0l-2.6 2.6-3.4-1.6v-2.8a11 11 0 0 0-6 0V16l-3.4 1.6z"/></svg>';

// РЕЖИМ ТЕСТИРОВЩИКА (просьба пользователя, ВРЕМЕННО: удалить перед финальным релизом игры).
// Звонки не идут; Zoom имитируется теми же событиями, что в реальном журнале; в файл, папку копий и Google Таблицу ничего не пишется;
// настройки дайлера живут в памяти (копия pd2), прогресс игры — отдельный ключ ct1_test. Выключение = перезагрузка страницы.
export const TESTER_KEY='ct1_tester';
export const testerOn=()=>{try{return localStorage.getItem(TESTER_KEY)==='1'}catch(e){return false}};
const seededStore=()=>{const m=memStore();try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^pd2/.test(k))m.setItem(k,localStorage.getItem(k))}}catch(e){}return m};
export function startWork(root,{save,au,demo=null}={}){
 const now=()=>Date.now(),dbus=new EventBus(),gbus=new EventBus(),tester=!demo&&testerOn();
 const store=demo?memStore():tester?seededStore():localStorage,kv=demo?null:(globalThis.indexedDB?kvFactory():null);
 const zp=new ZoomProvider(dbus,now),mp=new ManualProvider(dbus,now),prov=makeCombo(zp,mp);
 if(demo){SM.key='ct1_demo';save=SM.defaults()}else if(tester){SM.key='ct1_test';save=SM.load()}
 const S=save.settings;let frame=null,pendingLate=null,waitT=0,lastTempo=null,shownSug=-1;
 const d=new Dialer({bus:dbus,store,readOnly:tester,fetch:(...a)=>fetch(...a),kv,https:demo?true:location.protocol==='https:',zoomProvider:zp,manualProvider:mp,
  zoomSend:m=>frame&&frame.contentWindow&&frame.contentWindow.postMessage(m,ZO),confirm:m=>confirm(m),
  isEditing:l=>l===d.cur&&['wk-notes','wk-cb'].includes(document.activeElement&&document.activeElement.id),
  canStatus:(k,lead,opt)=>WIN.includes(k)?ses.precheck(k,lead,{late:!!(opt&&opt.late)}):{ok:true}});
 const ses=new Session({root:save,bus:gbus,prov,now});
 ses.setGate(()=>{if(!d.t.loaded)return{ok:false,code:'none'};const g=guard(null,{name:d.t.name,head:d.t.h,rows:d.t.L.map(l=>({phone:d.t.ph(l),result:d.t.res(l)}))});return g.ok||g.code==='exhausted'||g.code==='different'?{ok:true}:g});
 ensureDir(save,now());save.shift=save.shift||{start:now()};
 SFX.setVol(d.P.vol??.5);SFX.setMute(!!d.P.mute);SFX.onToast(m=>toast(m));if(kv)SFX.sndInit(kv);
 const setTester=on=>{try{on?localStorage.setItem(TESTER_KEY,'1'):localStorage.removeItem(TESTER_KEY)}catch(e){}if(!demo&&!tester)SM.save(save);location.reload()};
 let gateQuiet=false;
 // «Ещё статусы» всплывают НАД кнопкой (как в старом дайлере); position:fixed, чтобы колонку не обрезало
 const placeMore=()=>{const m=$('#more'),b=$('#b-more');if(!m||!b)return;m.classList.toggle('open',!!d.P.moreOpen);if(!d.P.moreOpen)return;const r=b.getBoundingClientRect();
  m.style.right=Math.max(8,innerWidth-r.right)+'px';m.style.width=Math.max(r.width,300)+'px';const up=r.top-10,down=innerHeight-r.bottom-10;
  if(up>=Math.min(m.scrollHeight,420)||up>=down){m.style.top='';m.style.bottom=(innerHeight-r.top+6)+'px';m.style.maxHeight=up+'px'}else{m.style.bottom='';m.style.top=(r.bottom+6)+'px';m.style.maxHeight=down+'px'}
  const c=$('#more-clr');if(c)c.style.display=d.cur&&d.t.res(d.cur)?'':'none'};
 addEventListener('mousedown',e=>{if(d.P.moreOpen&&!e.target.closest('#more,#b-more')){d.P.moreOpen=false;d.sp();placeMore()}});
 addEventListener('resize',()=>placeMore());
 const hangTest=()=>{const id=d.lastCallId();if(!id){toast('Сначала позвони (лучше на тестовый номер), потом жми «Тест отбоя» во время гудков','bad');return}
  toast('Пробую команды отбоя по одной, раз в 2,5 с…');d.zoom.testHangup(id,r=>{toast(r.ok?'Отбой работает: команда '+r.cmd.type+' запомнена':'Ни одна команда не сбросила звонок. Пришли журнал Zoom',r.ok?'gold':'bad');if(ov.dataset.k==='set'&&sec==='zoom')setUi()})};
 const persistGame=()=>{if(!demo)SM.soon(save,400)};
 // ---------- каркас ----------
 root.innerHTML=`<div class="wk ${S.fx==='off'?'fx-off':''}" id="wk">
  <header class="wk-top"><div class="wk-brand">UPLINK <b>SYNDICATE</b></div>
   <button class="wk-tb" id="b-pick" title="Выбрать лида (/)"><span class="lbl">Выбрать лида</span><span class="lbl-s" aria-hidden="true"></span><kbd>/</kbd></button>
   <div class="wk-sp"></div><div class="wk-tempo" id="tempo"></div>
   <div class="wk-leds" id="leds"></div>
   <button class="wk-tb" id="b-pad" title="Шпаргалка (T)"><span class="lbl">Шпаргалка</span><kbd>T</kbd></button>
   <button class="wk-tb icon" id="b-set" title="Настройки"><svg class="ic" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12"/></svg></button></header>
  <section class="wk-hud" id="hud">
   <div class="wk-streak idle" id="streak"><div class="wk-ring"><svg viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" id="ringfg" cx="23" cy="23" r="19" stroke-dasharray="119.4" stroke-dashoffset="0"/></svg><b id="ringt">–</b></div>
    <div class="wk-sk"><div class="n" id="sk-n">СЕРИЯ 0<em>x1.0</em></div><div class="s" id="sk-s">начни звонить</div></div></div>
   <div class="wk-od" id="od" title="Overdrive: ${C.od.streak} статусов подряд без потери серии"><div class="pill"><i id="od-f"></i><span class="t"><b>OD</b> <span id="od-t">0/${C.od.streak}</span></span></div></div><div class="wk-sp"></div>
   <div class="wk-res"><span class="x" id="r-x">0 XP</span><span class="m" id="r-m">$0</span><span class="debt" id="r-debt"></span></div>
   <div class="wk-dist"><div class="lbl" id="dist-l"></div><div class="bar"><i id="dist-b"></i></div><div class="day" id="day"></div></div>
   <div class="wk-banner pause" id="bn-pause">Пауза <b id="pause-t">0:00</b> авто-набор выключен<button class="wk-btn" id="bn-res">Продолжить <kbd>P</kbd></button></div>
   <div class="wk-banner test ${tester?'on':''}" id="bn-test">РЕЖИМ ТЕСТИРОВЩИКА <span>звонков нет · в таблицу и файл ничего не пишется · прогресс отдельный</span><button class="wk-btn" id="bn-test-off">Выключить</button></div>
   <div class="wk-banner app" id="bn-app"><span id="bn-app-t"></span><button class="wk-btn" id="bn-reload">Перезагрузить</button></div></section>
  <main class="wk-main" id="main"></main>
  <footer class="wk-bar"><button class="wk-tb" id="b-skip">Отложить<kbd>S</kbd></button><button class="wk-tb" id="b-back">← Прошлый лид<kbd>Z</kbd></button>
   <button class="wk-tb" id="b-clr">Убрать статус<kbd>X</kbd></button><button class="wk-tb" id="b-pause">Пауза<kbd>P</kbd></button>
   <button class="wk-tb" id="b-end">Закончить смену</button><span class="hint">Space звонок · H отбой · 1–6 статусы · M ещё · N заметки · / лиды</span></footer>
 </div>
 <div class="wk-zoom ct-panel hide" id="zoomw"><header>ZOOM PHONE <span id="zst"></span><button class="wk-btn" id="z-hide">Спрятать</button></header></div>
 <div class="wk-ov" id="ov"></div><div class="wk-toasts" id="toasts"></div>`;
 const W=$('#wk'),main=$('#main'),ov=$('#ov');
 // ---------- Zoom iframe (живой, даже когда спрятан) ----------
 const zw=$('#zoomw');
 if(d.zoom.enabled&&!demo&&!tester){frame=document.createElement('iframe');frame.src=ZOOM_SRC;frame.allow="microphone; camera; autoplay; clipboard-read; clipboard-write; display-capture";
  frame.onload=()=>d.zoom.onFrameLoad();zw.appendChild(frame)}
 addEventListener('message',e=>{d.zoom.onMessage(e.origin,e.data,d.view().lead&&d.view().lead.phone)});
 const zoomUi=()=>{zw.classList.toggle('hide',!d.zoom.shown);$('#zst').textContent=d.zoom.status||''};
 $('#z-hide').onclick=()=>{d.zoom.setShown(false);zoomUi()};
 // ---------- тосты и эффекты ----------
 const toast=(m,cls='')=>{const t=document.createElement('div');t.className='wk-toast '+cls;t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),cls==='gold'?4200:2800)};
 const gain=(x,m,el)=>{if(!x&&!m)return;const r=(el||$('#stat')||main).getBoundingClientRect(),g=document.createElement('div');g.className='wk-gain';
  g.style.left=(r.left+r.width/2)+'px';g.style.top=(r.top+20)+'px';g.innerHTML=(x?`<span class="x">+${x} XP</span>`:'')+(m?`<span class="m">+${money(m)}</span>`:'');document.body.appendChild(g);setTimeout(()=>g.remove(),1400)};
 const stamp=(txt,c)=>{if(S.fx==='off')return;const s=document.createElement('div');s.className='wk-stamp';s.style.setProperty('--c',c);s.textContent=txt;document.body.appendChild(s);setTimeout(()=>s.remove(),950)};
 // ---------- главный экран ----------
 const statBtn=(b,small)=>`<button class="wk-st ${small?'small':''} ${WIN.includes(b.i)?'win':''}" data-st="${b.i}" style="--c:${b.color}"><span class="k">${b.key}</span><span>${esc(b.name)}</span></button>`;
 const moreOpen=()=>!!d.P.moreOpen;
 const layout=()=>{const v=d.view();
  if(!v.loaded){main.innerHTML=emptyHtml();bindEmpty();return}
  W.querySelectorAll(':scope>#more').forEach(x=>x.remove());main.innerHTML=`<section class="wk-col"><div class="wk-card ct-panel" id="card"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><div id="lead"></div></div><div class="wk-card wk-card2 ct-panel" id="card2"><div id="lead2"></div></div></section>
   <section class="wk-col"><div class="wk-stat ct-panel" id="stat"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i>
    <div class="wk-lbl">СТАТУС ЗВОНКА</div><div class="wk-grid">${BUTTONS.slice(0,PRIM).map(b=>statBtn(b)).join('')}<button class="wk-st skip" data-act="skip" title="Лид вернётся позже в очереди, ничего не меняется"><span class="k">S</span><span>Отложить</span></button>
    <div class="wk-pw"><button class="wk-st skip more-b" id="b-more"><span class="k">M</span><span>Ещё статусы</span></button><div class="wk-pop ${moreOpen()?'open':''}" id="more">${BUTTONS.slice(PRIM).map(b=>statBtn(b,1)).join('')}<button class="wk-st small clr" data-act="clear" id="more-clr"><span class="k">X</span><span>Убрать статус</span></button></div></div></div></div></section>
   <aside class="wk-pad ct-panel paper-ish ${d.P.padOpen?'':'hidden'}" id="pad"><div class="wk-lbl" style="display:flex;align-items:center">ШПАРГАЛКА<button class="wk-x" id="pad-x" style="width:30px;height:30px;font-size:15px"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><textarea id="pad-t" placeholder="Скрипт, ответы на возражения…">${esc(d.P.pad||'')}</textarea></aside>`;
  $('#pad-t').oninput=e=>d.setPad(e.target.value);$('#pad-x').onclick=()=>act('pad');
  {const m=$('#more');if(m)W.appendChild(m)}   // список «Ещё статусы» живёт поверх всего экрана, иначе его перекрывает HUD
  $('#stat').onclick=$('#more').onclick=e=>{const b=e.target.closest('[data-st],[data-act]');if(!b)return;if(b.closest('#more')){d.P.moreOpen=false;d.sp();placeMore()}if(b.dataset.act)act(b.dataset.act);else doStatus(+b.dataset.st)};
  $('#b-more').onclick=()=>act('menu');padW();renderLead();placeMore()};
 const padW=()=>{W.style.setProperty('--padw',d.P.padOpen&&innerWidth>=1180?'minmax(260px,.8fr)':'0px');const p=$('#pad');if(p)p.classList.toggle('hidden',!d.P.padOpen)};
 const renderLead=()=>{const v=d.view(),box=$('#lead');if(!box)return;
  if(!v.lead){box.innerHTML=`<h2 class="wk-biz">${v.exhausted?'Территория пройдена':'Нет лида'}</h2><p class="wk-ver">${v.exhausted?'Необработанных лидов по текущим фильтрам нет. Сбрось фильтры или выбери лида вручную.':''}</p><div class="wk-btns"><button class="wk-btn pri" data-a="picker">Выбрать лида</button><button class="wk-btn" data-a="reset">Сбросить фильтры</button></div>`;
   box.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='picker')openPicker();else d.setFilter({},true)};markStatus(-1);return}
  const L=v.lead,lt=L.local,typing=document.activeElement&&['wk-notes','wk-cb'].includes(document.activeElement.id)&&box.dataset.ph===L.phone;
  if(typing){dialUi(v);markStatus(L.resultIndex);return}
  box.dataset.ph=L.phone;
  box.innerHTML=`<h2 class="wk-biz">${esc(L.biz||'Без названия')}</h2>
   <div class="wk-meta">${L.type?`<span class="wk-chip">${esc(L.type)}</span>`:''}${L.state?`<span class="wk-chip">${esc(L.state)}</span>`:''}
    ${lt?`<span class="wk-chip time ${lt.work?'':'off'}">у них ${esc(lt.time)} ${esc(lt.tz)}</span>`:''}${L.reviews?`<span class="wk-chip">★ ${esc(L.reviews)}</span>`:''}
    ${L.result?`<span class="wk-chip res" style="background:${L.resultColor}">${esc(L.result)}</span>`:''}</div>
   <div class="wk-phone"><span class="wk-num">${esc(L.rawPhone||L.phone)}</span></div>
   <div class="wk-phone"><button class="wk-dial" id="b-dial"></button><button class="wk-hang" id="b-hang" title="Отбой (H)">${PHONE_SVG}</button></div>
   <div class="wk-links">${L.site?`<a href="${esc(/^https?:/i.test(L.site)?L.site:'https://'+L.site)}" target="_blank" rel="noopener">Сайт</a>`:''}${L.map?`<a href="${esc(L.map)}" target="_blank" rel="noopener">Карта</a>`:''}${L.email?`<a href="mailto:${esc(L.email)}">${esc(L.email)}</a>`:''}</div>
`;
  $('#lead2').innerHTML=`${L.verification?`<div class="wk-ver">${esc(L.verification)}</div>`:''}${L.address?`<div class="wk-ver">${esc(L.address)}</div>`:''}
   ${L.prep?`<div class="wk-prep"><h4>Подготовка</h4>${esc(L.prep)}</div>`:''}
   <div class="wk-lbl">ЗАМЕТКИ <kbd>N</kbd></div><textarea class="wk-notes" id="wk-notes" placeholder="Заметки (N)">${esc(L.notes)}</textarea>
   <div class="wk-row2"><div><div class="wk-lbl">КОГДА ПЕРЕЗВОНИТЬ</div><input class="wk-in" id="wk-cb" value="${esc(L.callback)}" placeholder="например: вт 10:00 их времени"></div></div>
   <div class="wk-next">${v.next?'Дальше: '+esc(v.next)+' · ':''}осталось ${v.remaining}</div>`;
  $('#wk-notes').oninput=e=>d.setNotes(e.target.value);$('#wk-cb').oninput=e=>d.setCallback(e.target.value);
  $('#b-dial').onclick=()=>act('dial');$('#b-hang').onclick=()=>act('hangup');dialUi(v);markStatus(L.resultIndex)};
 const dialUi=(v=d.view())=>{const b=$('#b-dial'),h=$('#b-hang');if(!b)return;const on=v.calling||(d.call&&d.call.ended==null);
  b.classList.toggle('on',on);b.innerHTML=on?`<svg class="osc" viewBox="0 0 54 22"><path id="oscp" d="M0 11 H54"/></svg>НА ЛИНИИ ${mmss(v.callSec)}`:`ПОЗВОНИТЬ<kbd>Space</kbd>`;h.classList.toggle('live',on)};
 const markStatus=i=>{document.querySelectorAll('.wk-st[data-st]').forEach(b=>{b.classList.toggle('cur',+b.dataset.st===i);b.classList.toggle('sug',+b.dataset.st===shownSug)})};
 // ---------- без таблицы ----------
 const emptyHtml=()=>`<div class="wk-empty"><div class="ct-panel"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i>
   <h2>NO TARGET LIST LOADED</h2><p>Подключи таблицу лидов. Игра не начисляет ничего, пока таблицы нет: прогресс зависит только от реальных звонков.</p>
   <div id="recent" class="wk-btns" style="margin:10px 0"></div>
   <div class="wk-btns" style="margin:10px 0"><button class="wk-btn pri" id="e-file">Открыть файл CSV / TSV</button></div>
   <div class="wk-lbl" style="margin-top:14px">ИЛИ ССЫЛКА НА GOOGLE ТАБЛИЦУ</div><div style="display:flex;gap:8px"><input class="wk-in" id="e-url" placeholder="https://docs.google.com/spreadsheets/d/…" value="${esc(d.P.lastSheetUrl||'')}"><button class="wk-btn" id="e-go">Открыть</button></div>
   <p style="font-size:13px;color:#7f8d7d;margin-top:14px">Можно просто перетащить файл в окно. Для записи в Google Таблицу нужен Apps Script: Настройки → Таблица.</p></div></div>`;
 const bindEmpty=()=>{$('#e-file').onclick=openFileDlg;$('#e-go').onclick=()=>d.openSheetUrl($('#e-url').value);$('#e-url').onkeydown=e=>{if(e.key==='Enter')d.openSheetUrl(e.target.value)};
  const r=$('#recent');const srcs=(d.P.srcs||[]).slice(0,4);r.innerHTML=srcs.map((s,i)=>`<button class="wk-btn" data-s="${i}">↻ ${esc(s.name||'Таблица')}</button>`).join('');
  r.onclick=e=>{const b=e.target.closest('[data-s]');if(b)d.openSheet({id:srcs[+b.dataset.s].id,gid:srcs[+b.dataset.s].gid})};
  if(kv)kv('get','rc').then(rc=>{(rc||[]).slice(0,4).forEach(h=>{const b=document.createElement('button');b.className='wk-btn';b.textContent='↻ '+h.name;b.onclick=()=>d.openFile(h);r.appendChild(b)})}).catch(()=>{})};
 const openFileDlg=async()=>{if(globalThis.showOpenFilePicker){try{const [h]=await showOpenFilePicker({types:[{description:'Таблица',accept:{'text/csv':['.csv'],'text/tab-separated-values':['.tsv','.txt']}}]});await d.openFile(h)}catch(e){}return}
  const i=document.createElement('input');i.type='file';i.accept='.csv,.tsv,.txt';i.onchange=async()=>{const f=i.files[0];if(f)d.loadText(await f.text(),f.name)};i.click()};
 addEventListener('dragover',e=>e.preventDefault());
 addEventListener('drop',async e=>{e.preventDefault();const it=e.dataTransfer.items&&e.dataTransfer.items[0];if(it&&it.getAsFileSystemHandle){const h=await it.getAsFileSystemHandle();if(h&&h.kind==='file'){await d.openFile(h);return}}
  const f=e.dataTransfer.files[0];if(f)d.loadText(await f.text(),f.name)});
 // ---------- верх: источник, темп, Zoom ----------
 const leds=()=>{const s=d.sheets.state(),v=d.view(),z=d.zoom;
  const zl=z.live?['ok','Zoom']:z.gate==='connecting'?['warn','Zoom…']:z.enabled?['bad','Zoom ✕']:['warn','Zoom: приложение'];
  $('#leds').innerHTML=(v.source==='sheet'?`<span class="wk-led ${s.error?'bad':s.pending?'warn':'ok'}" title="${esc(s.error?human(s.error):'Google Таблица')}"><i></i><span class="txt">Sheets${s.pending?' ('+s.pending+')':''}</span></span>`:'')
   +(v.source==='file'?`<span class="wk-led ${v.saveErr?'bad':'ok'}"><i></i><span class="txt">Файл</span></span>`:'')
   +(v.saved?`<span class="wk-led ok"><i></i><span class="txt">Копия ${new Date(v.saved).toLocaleTimeString('ru')}</span></span>`:'')
   +`<span class="wk-led ${zl[0]}" title="Звонки через встроенный Zoom: проверки работают"><i></i><span class="txt">${zl[1]}</span></span>`};
 const tempoUi=()=>{const t=d.tempo(),el=$('#tempo');el.className='wk-tempo '+(t.cls||'');el.textContent=t.show?`Темп: ${t.rate} зв/час${t.cls==='hot'?' ▲':''}`:''};
 const banner=()=>{const z=d.zoom,b=$('#bn-app');let t='';if(tester){b.classList.remove('on');return}
  if(!demo&&!z.enabled)t=location.protocol!=='https:'?'Страница открыта не по https: встроенный Zoom недоступен, звонки через приложение. Проверки по Zoom выключены.':'Встроенный Zoom выключен в Настройках: звонки через приложение. Проверки по Zoom (серия, встречи, бонус) выключены.';
  else if(z.gate==='app')t='Звонки через приложение Zoom: проверки по Zoom выключены, встречи пойдут «на проверку».';
  $('#bn-app-t').textContent=t;b.classList.toggle('on',!!t)};
 // ---------- HUD ----------
 const hud=()=>{const G=ses.G,t=now(),on=d.calling||(d.call&&d.call.ended==null),w=windowState(G,t,{onLine:on,zoom:d.zoom.live}),el=$('#streak');
  el.className='wk-streak '+w.state;const frac=w.left!=null&&w.allowed?w.left/w.allowed:w.state==='online'?1:0;$('#ringfg').style.strokeDashoffset=String(119.4*(1-frac));
  $('#ringt').textContent=w.state==='online'?'☎':w.left!=null?(w.left>=60?Math.ceil(w.left/60)+'м':w.left):'–';
  $('#sk-n').innerHTML=`СЕРИЯ ${w.streak}<em>x${w.mult}</em>`;
  $('#sk-s').textContent=w.ulta>0?`УЛЬТА: ещё ${w.ulta} на x2`:w.od?`OVERDRIVE ${mmss(w.od)}`:w.state==='online'?'на линии: таймер стоит':w.state==='lost'?'окно сгорело: следующий статус = ступень вниз':w.toNext!=null?`до x${w.nextMult}: ещё ${w.toNext}`:'максимум жара';
  const od=$('#od'),pr=w.od?1:Math.min(1,w.odProg/w.odNeed),f=$('#od-f');od.classList.toggle('live',!!w.od);od.classList.toggle('heat',!w.od&&pr>=.8);f.style.width=(pr*100)+'%';
  f.style.setProperty('--g',`linear-gradient(90deg,hsl(${215-pr*185},85%,50%),hsl(${235-pr*215},92%,58%))`);$('#od-t').textContent=w.od?mmss(w.od):`${Math.min(w.odProg,w.odNeed)}/${w.odNeed}`;
  $('#r-x').textContent=Math.round(G.lifeXp).toLocaleString('ru')+' XP';$('#r-m').textContent=money(G.money);$('#r-debt').textContent=w.debt?`долг −${w.debt} XP`:'';
  const thr=districtThr(G.district),dd=C.districts[G.district-1];$('#dist-l').textContent=`${G.district}. ${dd[1]}`;$('#dist-b').style.width=Math.min(100,G.dxp/thr*100)+'%';
  $('#day').textContent=`сегодня ${d.ses.tot} · до 20: ${20-d.ses.sprint}`;
  if(d.paused){$('#pause-t').textContent=mmss((t-d.pauseAt)/1000)}
  if(on){dialUi();const p=$('#oscp');if(p){let s='M0 11';for(let x=0;x<=54;x+=3)s+=` L${x} ${11+Math.sin(x/4+t/90)*(d.call&&zp.calls.get(d.call.id)&&zp.calls.get(d.call.id).connected?7:2.5)}`;p.setAttribute('d',s)}}};
 // ---------- статусы ----------
 const doStatus=(k,late=false)=>{clearTimeout(waitT);pendingLate=late;const r=d.setStatus(k,undefined,{late});pendingLate=null;if(!r)return;
  if(r.refused==='wait'){if(d.call&&d.call.ended==null&&d.P.hangupOnStatus){const h=d.hangup('status');if(h==='unsupported'){d.zoom.peek={reason:'hangup'};zoomUi();toast('Положи трубку в окне Zoom: статус поставлю сам, как только Zoom пришлёт длительность','bad')}}else toast('Проверяю длительность по Zoom…');const t0=now();const loop=()=>{const rr=d.setStatus(k,undefined,{late:now()-t0>=10000});if(rr&&rr.refused==='wait')waitT=setTimeout(loop,1000);else if(rr&&rr.refused)refused(rr)};waitT=setTimeout(loop,1000);return}
  if(r.refused)refused(r)};
 const refused=r=>{SFX.snd('del');const nm=BUTTONS[r.index].name;toast(`Сорри, ${nm} нельзя поставить: разговор ${mmss(r.dur||0)} по Zoom, нужно от ${mmss(r.min)}`,'bad')};
 dbus.on('statusSet',meta=>{const L=meta.lead,f=SFX.FXT[meta.index];
  const out=ses.setStatus(meta.index,{key:L.phone,phone:L.phone,business:L.biz,state:L.state},{had:!!meta.changed,late:!!pendingLate});
  if(f){SFX.statusSound(meta.index);stamp(f[0],f[1]);const c=$('#card');if(c&&S.fx!=='off'){c.className=c.className.replace(/ out-\w+/g,'');void c.offsetWidth;c.classList.add('out-'+f[2])}}
  if(meta.milestone){setTimeout(()=>SFX.snd(meta.milestone.kind==='hundred'?'fanfare':'levelup'),500);stamp(meta.milestone.kind==='hundred'?meta.milestone.n+' CALLS':'20 / 20','#ffc400')}
  if(out.blocked){toast(out.blocked==='none'||out.blocked==='broken'?'Игра не начисляет: таблица не подтверждена':'Игра не начислила за этот статус','bad')}
  const e=out.ev;if(e){gain(e.x,e.m);if(e.spam)toast('Слишком быстро: награда x0.5','bad');if(e.pen==='drop')toast('Окно сгорело: жар на ступень ниже','bad');if(e.pen==='reset')toast('Перерыв больше 40 мин: серия с нуля','bad');
   if(e.odStart){stamp('OVERDRIVE','#ff2bd6');toast(`OVERDRIVE ${C.od.sec/60} мин: $ x${C.od.money}, XP x${C.od.xp}`,'gold')}if(e.captured)toast('РАЙОН ЗАХВАЧЕН','gold');if(e.settle&&e.settle.bonus&&e.settle.bonus.x)setTimeout(()=>gain(e.settle.bonus.x,e.settle.bonus.m),700)}
  if(out.meta&&out.meta.winUnverified)toast('Без данных Zoom встреча идёт «на проверку»: в таблицу записано, игра считает как разговор','bad');
  (out.achv||[]).forEach(a=>toast('Ачивка: '+a.name,'gold'));(out.missions||[]).forEach(m=>toast(`Задание «${m.name}»: +${money(m.money)}`,'gold'));if(out.trophy)toast('Трофей: '+out.trophy.company,'gold');
  if(out.levelUp!=null)toast('Новый уровень!','gold');if(out.rankUp!=null)toast('Новый ранг!','gold');
  shownSug=-1;persistGame();hud()});
 dbus.on('statusCleared',e=>{const how=ses.dropLead(e.phone);if(how)toast(how==='full'?'Статус убран: всё откатано':'Статус убран: снято всё, что он принёс');persistGame();hud()});
 dbus.on('callLogged',e=>{const r=ses.lateLog(e.callId,e.duration);if(r&&r.bonus&&r.bonus.x){gain(r.bonus.x,r.bonus.m);persistGame()}});
 dbus.on('pauseChanged',e=>{e.paused?ses.pause():ses.resume();$('#bn-pause').classList.toggle('on',e.paused);persistGame()});
 dbus.on('leadChanged',()=>{if(!$('#lead')&&d.view().loaded)layout();else renderLead();leds()});
 dbus.on('leadsLoaded',()=>{layout();leds()});
 ['sourceStateChanged','saveState','syncReport'].forEach(k=>dbus.on(k,leds));
 dbus.on('toast',m=>toast(typeof m==='string'?m:m.text||''));
 dbus.on('suggest',e=>{shownSug=e.index;markStatus(d.view().lead?d.view().lead.resultIndex:-1);toast(`Zoom предлагает: ${BUTTONS[e.index].name} (Shift+Enter)`)});
 dbus.on('padToggled',padW);
 dbus.on('zoomStateChanged',()=>{zoomUi();leds()});
 dbus.on('zoomGate',e=>{leds();banner();if(gateQuiet&&ov.dataset.k==='set'){if(e.state!=='connecting'){gateQuiet=false;toast(e.state==='ready'?'Zoom подключён ✓':e.state==='failed'?'Zoom не ответил за 15 с':'Встроенный Zoom выключен',e.state==='ready'?'':'bad')}if(sec==='zoom')setUi();return}gateQuiet=false;
  if(e.state==='connecting'&&!demo)gateWin('connecting');else if(e.state==='failed')gateWin('failed');else if(ov.dataset.k==='gate')closeOv()});
 dbus.on('zoomViaApp',banner);
 dbus.on('openUrl',e=>{const a=document.createElement('a');a.href=e.url;document.body.appendChild(a);a.click();a.remove()});
 let gT=0;dbus.on('guardMark',()=>{if(d.P.guard===false)return;clearTimeout(gT);if(!document.title.startsWith('☎ '))document.title='☎ '+document.title;gT=setTimeout(()=>{document.title=document.title.replace(/^☎ /,'')},7000)});
 dbus.on('openSettings',e=>openSettings(e&&e.section==='dialer'?'table':'calls'));
 // ---------- действия ----------
 const act=(a,x)=>{switch(a){
  case'dial':if(!d.view().lead)return;if(d.zoom.enabled&&d.zoom.gate==='connecting'){toast('Подожди: подключаю Zoom…');return}d.dial();dialUi();break;
  case'hangup':{const r=d.hangup('button');if(r==='none'||r===false)toast('Активного звонка нет');else if(r==='unsupported'){d.zoom.peek={reason:'hangup'};zoomUi();toast('Zoom не принимает отбой из браузера: положи трубку в окне Zoom (открыл его). Настройки → Zoom → «Тест отбоя»','bad')}dialUi();break}
  case'status':doStatus(x);break;case'skip':d.skip();break;case'back':d.back();break;case'clear':d.clearStatus();break;
  case'pause':d.pause();break;case'notes':{const n=$('#wk-notes');if(n){n.focus();n.selectionStart=n.value.length}break}
  case'menu':d.P.moreOpen=!d.P.moreOpen;d.sp();placeMore();break;
  case'pad':d.openCheatSheet();break;case'picker':openPicker();break;case'close':if(ov.classList.contains('open')&&ov.dataset.k!=='gate')closeOv();else document.activeElement&&document.activeElement.blur();break;
  case'blur':document.activeElement&&document.activeElement.blur();break;case'debug':openSettings('zoom');break;
  case'map':case'base':toast('Карта и база появятся в R2');break;case'muteMusic':case'nextTrack':toast('Музыка из папки: R2');break}};
 addEventListener('keydown',e=>{const ae=document.activeElement,typing=ae&&(/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae.isContentEditable);
  const modal=ov.classList.contains('open');if(modal&&e.code==='Escape'&&ov.dataset.k!=='gate'){e.preventDefault();closeOv();return}if(modal&&!typing&&ov.dataset.k==='pick'&&e.code==='Enter'){const f=ov.querySelector('.wk-li');if(f){f.click();e.preventDefault()}return}
  const r=resolveKey({typing,menu:!!d.P.moreOpen,suggest:shownSug,world:false,modal,shift:e.shiftKey,meta:e.metaKey,alt:e.altKey,ctrl:e.ctrlKey},e.code);if(!r)return;
  if(e.repeat&&r.a!=='blur')return;e.preventDefault();if(r.a==='status')act('status',r.id);else act(r.a)});
 const tb=$('#bn-test-off');if(tb)tb.onclick=()=>setTester(false);$('#b-pick').onclick=()=>act('picker');$('#b-pad').onclick=()=>act('pad');$('#b-set').onclick=()=>openSettings();$('#b-skip').onclick=()=>act('skip');$('#b-back').onclick=()=>act('back');
 $('#b-clr').onclick=()=>act('clear');$('#b-pause').onclick=()=>act('pause');$('#bn-res').onclick=()=>act('pause');$('#bn-reload').onclick=()=>location.reload();$('#b-end').onclick=()=>shiftEnd();
 // ---------- окна ----------
 const openOv=(k,html,sm)=>{ov.dataset.k=k;ov.innerHTML=`<div class="wk-win ct-panel ${sm?'sm':''}" role="dialog"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i>${html}</div>`;ov.classList.add('open')};
 const closeOv=()=>{ov.classList.remove('open');ov.dataset.k='';ov.innerHTML=''};
 ov.addEventListener('mousedown',e=>{if(e.target===ov&&ov.dataset.k!=='gate')closeOv()});
 const gateWin=st=>{const c=st==='connecting';openOv('gate',`<div class="wk-wh"><h3>${c?'ПОДКЛЮЧАЮ ZOOM…':'ZOOM НЕ ПОДКЛЮЧИЛСЯ'}</h3></div><div class="wk-wb">
   <p style="font:15px/1.5 var(--ct-text);color:#cfdccb">${c?'Жду встроенный телефон Zoom (до 15 секунд). Пока он не готов, звонки не начинаются: иначе браузер не увидит звонков, и серия, проверка встреч и бонус за разговор не сработают.'
   :'Встроенный телефон не ответил. Обычно помогает перезагрузка страницы. Если Zoom просит войти, нажми «Показать окно Zoom» и войди один раз.'}</p>
   ${c?'<div class="wk-kv">Встроенный Zoom: ожидание ответа…</div>':`<div class="wk-btns" style="margin-top:14px"><button class="wk-btn pri" id="g-rl">Перезагрузить страницу</button><button class="wk-btn" id="g-show">Показать окно Zoom</button></div>
   <div class="wk-btns" style="margin-top:18px"><button class="wk-btn red" id="g-app">Продолжить через приложение (без проверок Zoom)</button></div>`}</div>`,1);
  if(!c){$('#g-rl').onclick=()=>location.reload();$('#g-show').onclick=()=>{d.zoom.setShown(true);zoomUi()};$('#g-app').onclick=()=>{d.zoom.bypass();closeOv();banner()}}};
 // --- выбор лида
 let M={q:'',type:'',state:'',tz:'',hide:false,off:0,n:300};
 const openPicker=()=>{if(!d.t.loaded){toast('Сначала подключи таблицу');return}const f=d.view().filter;M={...M,type:f.type,state:f.state,tz:f.tz,off:0};
  openOv('pick',`<div class="wk-wh"><h3>ВЫБРАТЬ ЛИДА</h3><button class="wk-x" id="p-x"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-wb wk-pick" id="pk"></div>`);$('#p-x').onclick=closeOv;pickerUi(true)};
 const pickerUi=(first)=>{const P=d.picker(M),box=$('#pk');if(!box)return;const chip=(k,v)=>`<button data-k="${k}" data-v="${esc(v)}" class="${M[k]===v?'on':''}">${esc(v)}</button>`;
  if(first)box.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap"><input class="wk-in" id="p-q" placeholder="Поиск: название, телефон, тип, заметки, подготовка" style="flex:1;min-width:200px" value="${esc(M.q)}">
    <button class="wk-btn" id="p-hide"></button><button class="wk-btn pri" id="p-only">Звонить только по выбранным фильтрам</button><button class="wk-btn" id="p-reset">Сбросить фильтры</button></div><div id="p-ch"></div><div class="wk-list" id="p-l"></div>`;
  $('#p-hide').textContent=M.hide?'Показать обработанных':'Скрыть обработанных';
  $('#p-ch').innerHTML=[['tz','ПОЯС'],['state','ШТАТ'],['type','ТИП']].map(([k,l])=>P.chips[k].length?`<div class="wk-chips" style="margin-bottom:6px"><span class="lb">${l}</span>${P.chips[k].map(v=>chip(k,v)).join('')}</div>`:'').join('');
  $('#p-l').innerHTML=(P.up?'<button class="wk-li" data-more="-1">▲ показать выше</button>':'')+P.rows.map(r=>`<button class="wk-li ${r.now?'now':''} ${r.done?'done':''}" data-i="${r.i}"><span>${esc(r.biz)}</span><span>${esc(r.type)}</span><span>${esc(r.state)}</span><span class="r">${esc(r.result||'')}${r.notes?' · '+esc(r.notes.slice(0,80)):''}</span>${r.prep?`<span class="p">${esc(r.prep.slice(0,140))}</span>`:''}</button>`).join('')
   +(P.down?'<button class="wk-li" data-more="1">▼ показать ниже</button>':'')+(P.rows.length?'':'<div class="wk-ver" style="padding:14px">Ничего не найдено</div>');
  if(first){const q=$('#p-q');q.focus();q.oninput=()=>{M.q=q.value;M.off=0;pickerUi()};$('#p-hide').onclick=()=>{M.hide=!M.hide;M.off=0;pickerUi()};
   $('#p-only').onclick=()=>{d.setFilter({type:M.type,state:M.state,tz:M.tz});closeOv()};$('#p-reset').onclick=()=>{M={...M,type:'',state:'',tz:'',q:'',off:0};$('#p-q').value='';d.setFilter({},true);pickerUi()};
   $('#p-ch').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;M[b.dataset.k]=M[b.dataset.k]===b.dataset.v?'':b.dataset.v;M.off=0;pickerUi()};
   $('#p-l').onclick=e=>{const b=e.target.closest('.wk-li');if(!b)return;if(b.dataset.more){M.off=Math.max(0,M.off+(+b.dataset.more)*M.n);pickerUi();return}d.pickLead(+b.dataset.i,{type:M.type,state:M.state,tz:M.tz});closeOv()}}};
 // --- настройки: отдельное окно, переключатели его НЕ закрывают
 const SECS=[['calls','Звонки'],['zoom','Zoom'],['table','Таблица и база'],['sound','Звук и вид'],['map','Значения в таблицу'],['game','Игра']];let sec='calls';
 const sw=(id,on,t,small)=>`<div class="wk-opt"><div class="t"><b>${t}</b>${small?`<small>${small}</small>`:''}</div><button class="ct-switch ${on?'on':''}" data-sw="${id}" aria-pressed="${!!on}"></button></div>`;
 const btn=(id,t,small,label,cls='')=>`<div class="wk-opt"><div class="t"><b>${t}</b>${small?`<small>${small}</small>`:''}</div><button class="wk-btn ${cls}" data-b="${id}">${label}</button></div>`;
 const secHtml=()=>{const P=d.P,z=d.zoom,sh=d.sheets.state();switch(sec){
  case'calls':return`<h4>Звонки</h4>${sw('auto',d.auto,'Автонабор следующего','После статуса сразу звонит следующему (после встречи пауза 1 с, на сотне 2,8 с)')}
   ${sw('only',d.q.only,'В очереди только лиды без статуса','Выкл: показывать всех подряд')}${sw('hos',P.hangupOnStatus,'Авто-отбой при статусе','Поставил статус во время звонка: статус засчитан сразу, потом отбой')}
   ${sw('hsk',P.hangupOnSkip,'«Отложить» кладёт трубку')}${sw('guard',P.guard!==false,'Возвращать из Zoom в браузер','Метка ☎ в заголовке вкладки для твоего скрипта на Mac')}`;
  case'zoom':return`<h4>Встроенный телефон</h4>${sw('zemb',z.enabled||P.zoomEmbed!==false,'Встроенный телефон Zoom','Через него браузер видит звонки: серия по Zoom, проверка встреч, бонус за разговор')}
   ${sw('zwin',!!P.zoomWindow,'Показывать окно Zoom','Для входа и диагностики. Спрятанное окно продолжает работать')}
   <div class="wk-kv" style="margin:10px 0">Состояние: <b>${z.live?'подключён ✓':z.gate==='connecting'?'подключаю…':z.gate==='app'?'звонки через приложение':z.enabled?'не подключён':'выключен'}</b> · Zoom: <b>${esc(z.status||'–')}</b> · здоровье: <b>${zp.health().state}</b></div>
   <div class="wk-btns"><button class="wk-btn" data-b="zlog">Скопировать журнал Zoom</button><button class="wk-btn" data-b="zgate">Проверить подключение</button><button class="wk-btn" data-b="zhang">Тест отбоя (во время звонка)</button></div>
   <div class="wk-kv">Отбой из браузера: <b>${P.zoomHangup?'работает ('+esc(P.zoomHangup.type)+')':'не найден'}</b>. Zoom официально не даёт команду отбоя встроенному телефону. Позвони на тестовый номер и нажми «Тест отбоя» во время гудков: я попробую варианты по очереди и запомню рабочий.</div>
   <h4>История звонков Zoom (CSV из портала)</h4>${btn('zcsv','Загрузить историю звонков','Zoom → Phone → Call History → Export. Можно в любой момент. Сейчас: разбор и сводка; проверка встреч задним числом в R5','Выбрать файл…')}<div id="zcsv-r" class="wk-kv"></div>`;
  case'table':return`<h4>Источник</h4><div class="wk-kv">Сейчас: <b>${esc(d.t.name||'нет')}</b> · ${d.view().source==='sheet'?'Google Таблица':d.view().source==='file'?'файл (пишу в тот же файл)':'—'} · лидов: <b>${d.t.L.length}</b></div>
   ${btn('open','Открыть файл CSV / TSV','','Открыть…')}${btn('switch','Открыть другую базу','Сохраню текущую и вернусь к выбору','Сменить')}
   <h4>Google Таблица</h4><div class="wk-opt" style="display:block"><div class="t"><b>Ссылка на таблицу</b></div><div style="display:flex;gap:8px;margin-top:6px"><input class="wk-in" id="s-url" placeholder="https://docs.google.com/spreadsheets/d/…" value="${esc(P.lastSheetUrl||'')}"><button class="wk-btn" data-b="ourl">Открыть</button></div></div>
   <div class="wk-opt" style="display:block"><div class="t"><b>Apps Script (запись в таблицу)</b><small>Адрес веб-приложения и кодовое слово. Скрипт: «Скопировать Apps Script», вставить в таблице: Расширения → Apps Script → Развернуть</small></div>
    <div style="display:grid;gap:6px;margin-top:6px"><input class="wk-in" id="s-gs" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(P.sheets.url)}"><input class="wk-in" id="s-tok" placeholder="кодовое слово" value="${esc(P.sheets.token)}"></div>
    <div class="wk-btns" style="margin-top:8px"><button class="wk-btn pri" data-b="gssave">Сохранить и проверить</button><button class="wk-btn" data-b="gscopy">Скопировать Apps Script</button><button class="wk-btn" data-b="gsrnd">Новое слово</button></div><div class="wk-kv" id="gs-r">${sh.error?'Ошибка: '+esc(human(sh.error)):sh.on?'Подключено'+(sh.pending?' · в очереди '+sh.pending:''):''}</div></div>
   ${btn('pull','Обновить из таблицы сейчас','','Обновить')}${btn('bk','Папка для резервных копий','Копия CSV каждые 20 с после изменений','Выбрать…')}${btn('tsv','Скопировать базу для Google Таблицы','TSV в буфер: вставить в таблицу','Копировать')}`;
  case'sound':return`<h4>Звуки статусов (как в старом дайлере)</h4>${sw('snd',!P.mute,'Звуки')}
   <div class="wk-opt"><div class="t"><b>Громкость</b></div><input class="ct-slider" id="s-vol" type="range" min="0" max="100" value="${Math.round((P.vol??.5)*100)}" style="width:180px;--v:${Math.round((P.vol??.5)*100)}%"></div>
   ${btn('sdir','Свои звуки из папки…',SFX.getState().files?'Загружено файлов: '+SFX.getState().files:SFX.getState().need?'Нужно разрешение на папку':'','Выбрать…')}${btn('snames','Какие имена у файлов звуков','','Копировать')}
   <h4>Вид</h4><div class="wk-opt"><div class="t"><b>Эффекты</b><small>Штамп статуса, анимации карточки, сканлайны</small></div><div class="wk-btns">${['off','low','full'].map(v=>`<button class="wk-btn ${S.fx===v?'pri':''}" data-fx="${v}">${{off:'Выкл',low:'Мало',full:'Полно'}[v]}</button>`).join('')}</div></div>`;
  case'map':return`<h4>Что пишется в колонку Result</h4><p class="wk-kv">Кнопка → значение в таблице. Меняй, только если поменял выпадающий список в таблице.</p><div class="wk-map">${d.mapping().map(b=>`<label>${b.key} · ${esc(b.name)}</label><input class="wk-in" data-map="${b.i}" value="${esc(b.value)}">`).join('')}</div>
   <div class="wk-btns" style="margin-top:12px"><button class="wk-btn" data-b="mapreset">Вернуть как было</button></div>`;
  case'game':return`<h4>Игра</h4>${sw('tester',tester,'Режим тестировщика (временно)','Звонки не идут, статусы засчитываются кнопками (каждый звонок = разговор '+Math.round(C.testerCallSec/60)+' мин). В таблицу, файл и копии ничего не пишется, прогресс игры отдельный. Переключение перезагрузит страницу. Удалим перед релизом')}${btn('end','Закончить смену','Итог дня: звонки, разговоры, лучшая серия, выплата за 50+ звонков','Итог')}${btn('export','Скачать сохранение игры','Файл .json, ключ ct1','Скачать')}${btn('menu','Главное меню','','Выйти в меню')}
   <div class="wk-kv" style="margin-top:10px">Версия: ${esc(C.version)} · таблица хранится в старых ключах дайлера (pd2…), игра в ct1</div>`}};
 const openSettings=(s)=>{if(s)sec=s;openOv('set',`<div class="wk-wh"><h3>НАСТРОЙКИ</h3><button class="wk-x" id="s-x" title="Закрыть (Esc)"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-set"><nav class="wk-nav" id="s-nav"></nav><div class="wk-sec" id="s-sec"></div></div>`);
  $('#s-x').onclick=closeOv;setUi();
  $('#s-nav').onclick=e=>{const b=e.target.closest('[data-s]');if(b){sec=b.dataset.s;setUi()}};
  $('#s-sec').onclick=e=>{const t=e.target.closest('[data-sw],[data-b],[data-fx]');if(!t)return;
   if(t.dataset.sw){const k=t.dataset.sw,P=d.P,on=!t.classList.contains('on');({auto:()=>d.setAuto(on),only:()=>d.setOnly(on),hos:()=>d.setPref('hangupOnStatus',on),hsk:()=>d.setPref('hangupOnSkip',on),guard:()=>d.setPref('guard',on),
     zemb:()=>{d.zoom.setEnabled(on);toast(on?'Встроенный Zoom включён: перезагрузи страницу':'Встроенный Zoom выключен: звонки через приложение');banner()},zwin:()=>{d.zoom.setShown(on);zoomUi()},tester:()=>setTester(on),snd:()=>{P.mute=!on;d.sp();SFX.setMute(!on);if(on)SFX.snd('tick')}})[k]();setUi();return}
   if(t.dataset.fx){S.fx=t.dataset.fx;W.classList.toggle('fx-off',S.fx==='off');persistGame();setUi();return}
   const b=t.dataset.b;const A=({zlog:()=>copy(d.zoom.logText(),'Журнал Zoom скопирован ('+d.zoom.log.length+' событий)'),zgate:()=>{gateQuiet=true;d.zoom.startGate(15000);setUi()},zhang:()=>hangTest(),zcsv:pickZoomCsv,open:()=>{closeOv();openFileDlg()},switch:()=>{closeOv();d.switchBase().then(layout)},ourl:()=>{d.openSheetUrl($('#s-url').value);closeOv()},
     gssave:async()=>{d.setSheets({url:$('#s-gs').value.trim(),token:$('#s-tok').value.trim(),on:true});$('#gs-r').textContent='Проверяю…';const r=await d.testConnection();$('#gs-r').textContent=r&&r.ok?'Связь есть ✓':'Нет связи: '+((r&&(r.error?human(r.error):r.msg))||'?')},
     gscopy:()=>copy(d.getAppsScript(),'Apps Script скопирован (с твоим словом)'),gsrnd:()=>{d.rndSecret();setUi();toast('Новое слово: обнови его и в скрипте')},pull:()=>{d.sheets.pull();toast('Обновляю из таблицы…')},
     bk:async()=>{try{const h=await showDirectoryPicker({mode:'readwrite'});await d.setBackupDir(h);toast('Папка для копий выбрана')}catch(e){}},tsv:()=>copy(d.tsv(),'База скопирована: вставь в Google Таблицу'),
     sdir:async()=>{await SFX.sndPick(kv);setUi()},snames:()=>copy(SFX.sndNamesText(),'Список имён звуков скопирован'),mapreset:()=>{d.resetMap();setUi()},end:()=>{closeOv();shiftEnd()},export:()=>SM.exportFile(save),menu:()=>{if(!demo)SM.save(save);location.href=location.pathname}})[b];if(A)A()};
  $('#s-sec').oninput=e=>{const t=e.target;if(t.id==='s-vol'){const v=t.value/100;d.P.vol=v;d.sp();SFX.setVol(v);t.style.setProperty('--v',t.value+'%')}if(t.dataset.map!=null)d.setMap(+t.dataset.map,t.value);
   if(t.id==='s-gs'){d.P.sheets.url=t.value.trim();d.sp()}if(t.id==='s-tok'){d.P.sheets.token=t.value.trim();d.sp()}if(t.id==='s-url'){d.P.lastSheetUrl=t.value.trim();d.sp()}}};
 const setUi=()=>{$('#s-nav').innerHTML=SECS.map(([k,t])=>`<button data-s="${k}" class="${k===sec?'on':''}">${t}</button>`).join('');$('#s-sec').innerHTML=secHtml()};
 const copy=(txt,msg)=>{(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(msg)).catch(()=>{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast(msg)})};
 const pickZoomCsv=()=>{const i=document.createElement('input');i.type='file';i.accept='.csv';i.onchange=async()=>{const f=i.files[0];if(!f)return;const z=parseZoomHistory(await f.text()),r=$('#zcsv-r');
  if(!z.ok){r.textContent='Это не история звонков Zoom';return}const out=z.calls.filter(c=>c.dir==='out'),talk=out.filter(c=>c.dur>=60).length;
  r.innerHTML=`Звонков: <b>${z.calls.length}</b> (исходящих ${out.length}) · разговоров от 1 мин: <b>${talk}</b> · самый долгий: <b>${mmss(Math.max(0,...out.map(c=>c.dur)))}</b><br>${viaApp(z.devices)?'⚠ Звонки шли через приложение Zoom ('+esc(z.devices.join(', '))+'): браузер их не видел. Звони через встроенный телефон.':'Звонки через встроенный телефон ✓'}`};i.click()};
 // --- итог смены
 const shiftEnd=()=>{const r=endShift(save,ses.G,now());persistGame();openOv('end',`<div class="wk-wh"><h3>ИТОГ СМЕНЫ</h3><button class="wk-x" id="e-x"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-wb">
   <div class="wk-kv" style="font-size:15px">Звонков: <b>${r.calls}</b> · разговоров: <b>${r.talks}</b> (${r.talkShare}%) · встреч: <b>${r.booked}</b> · discovery: <b>${r.disc}</b><br>Лучшая серия: <b>${r.bestStreak}</b> · Overdrive: <b>${r.od}</b> · время: <b>${r.minutes} мин</b><br>
   За день: <b>${r.xp} XP</b> · <b>${money(r.money)}</b>${r.paid?` · выплата за смену <b>+${money(r.paid)}</b>`:''}${r.lp?` · очки наследия <b>+${r.lp}</b>`:''}${r.again?'<br>Смена сегодня уже закрыта: это повторный итог.':''}
   ${r.yesterday?`<br>Вчера: ${r.yesterday.n} звонков`:''}${r.avg7?` · среднее 7 дней: ${r.avg7.n}`:''}</div>
   <p class="wk-kv" style="margin-top:12px">Есть история звонков Zoom? Загрузи её в Настройках → Zoom (можно в любой момент).</p><div class="wk-btns" style="margin-top:12px"><button class="wk-btn pri" id="e-ok">Продолжить работу</button></div></div>`,1);
  $('#e-x').onclick=closeOv;$('#e-ok').onclick=closeOv;save.shift={start:now()}};
 // ---------- старт ----------
 function fakeZoom(){const z=d.zoom;Object.defineProperty(z,'enabled',{get:()=>true});z.ready=true;z.gate='ready';z.status='тест';let cur=null,n=0;
  const msg=(type,data)=>z.onMessage(ZO,{type,data},d.view().lead&&d.view().lead.phone);
  const end=()=>{if(!cur)return;const c=cur;cur=null;const iso=new Date().toISOString().slice(0,19)+'Z',dur=Math.max(C.testerCallSec,Math.round((now()-c.t)/1000));
   msg('zp-call-ended-event',{callId:c.id,callee:{phoneNumber:c.n},dateTime:iso,direction:'outbound',result:'ended'});
   setTimeout(()=>msg('zp-call-log-completed-event',{callId:c.id,callee:{number:c.n},result:'Call connected',callResult:'connected',direction:'outbound',duration:dur,startTime:new Date(c.t).toISOString().slice(0,19)+'Z'}),300)};
  z.call=e164=>{end();z.got=false;z.sug=-1;const id='test-'+(++n)+'-'+now();cur={id,n:e164,t:now()};const iso=new Date().toISOString().slice(0,19)+'Z';
   msg('zp-call-ringing-event',{callId:id,callee:{phoneNumber:e164},dateTime:iso,direction:'outbound'});setTimeout(()=>{if(cur&&cur.id===id)msg('zp-call-connected-event',{callId:id,callee:{extensionType:'pstn',phoneNumber:e164},dateTime:iso,direction:'outbound'})},800);return'zoom'};
  z.hangup=()=>{if(!cur)return false;setTimeout(end,150);return true};msg('zp-ready',{});z.changed()}
 layout();leds();banner();zoomUi();hud();tempoUi();
 setInterval(()=>{d.tick();hud()},250);setInterval(tempoUi,5000);addEventListener('resize',padW);
 if(!demo)SM.install(()=>save);addEventListener('beforeunload',()=>{d.flush&&d.flush()});
 if(demo){d.zoom.ready=true;d.zoom.gate='ready'}else if(tester)fakeZoom();else if(d.zoom.enabled)d.zoom.startGate(15000);
 return{d,ses,save,act,openSettings,openPicker,toast,hud,layout,gateWin,shiftEnd,zp}}
