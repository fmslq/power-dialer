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
import {makeJuice} from './juice.js';
import {makePanel} from './panel.js';
import {makeProto} from './proto.js';
import {makeGameMenu} from './gamemenu.js';
import {makeMap} from '../map/map.js';
import {makeStory} from '../story/story.js';
import {makeArena} from '../boss/arena.js';
import {makeBase} from '../base/base.js';
import {claim as claimReward,migrateClaims} from '../../core/claim.js';
import {makeClaimFx} from './claimfx.js';
import {makeDistrictWindow} from './dwin.js';
import {makeTutor} from './tutor.js';
import {TUTORIAL} from '../../story/guide.js';
import {Music} from '../../audio/music.js';
import {bossHp,DIST,TRAIL_COL,equipped} from '../../core/meta.js';
import {bossState} from '../../core/engine.js'; // (windowState — выше)
import {debugHtml,journalHtml} from './debug.js';
import {icon} from '../../art/icons.js';
import {dayKey} from '../../core/stats.js';
import {LEVELS,RANKS} from '../../core/stats.js';

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
const SECS=[['calls','Звонки'],['zoom','Zoom'],['table','Таблица и база'],['sound','Звук и вид'],['map','Значения в таблицу'],['game','Игра']];
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
 // «Ещё статусы» раскрываются под основными статусами в той же колонке (как в ч.4), без всплывающего окна
 const placeMore=()=>{const m=$('#more');if(m)m.classList.toggle('open',!!d.P.moreOpen);const b=$('#b-more');if(b)b.classList.toggle('on',!!d.P.moreOpen)};
 const persistGame=()=>{if(!demo)SM.soon(save,400)};
 // ---------- каркас ----------
 root.innerHTML=`<div class="wk ${S.fx==='off'?'fx-off':''}" id="wk">
  <header class="wk-top"><button class="wk-tb icon" id="b-cc" title="Командный центр (C)">${icon('panel')}</button><div class="wk-brand">UPLINK <b>SYNDICATE</b></div>
   <button class="wk-tb" id="b-pick" title="Выбрать лида (/)"><span class="lbl">Выбрать лида</span><span class="lbl-s" aria-hidden="true"></span><kbd>/</kbd></button>
   <div class="wk-sp"></div><div class="wk-tempo" id="tempo"></div><button class="wk-tb" id="b-end" title="Итог смены"><span class="lbl">Закончить смену</span><span class="lbl-s" aria-hidden="true">Конец</span></button>
   <div class="wk-leds" id="leds"></div>
   <div class="wk-vol" id="vol"><label title="Громкость звуков">${icon('sfx')}<input type="range" min="0" max="100" data-vol="sfx"></label><label title="Громкость музыки и гула города">${icon('music')}<input type="range" min="0" max="100" data-vol="music"></label></div>
    <button class="wk-tb" id="b-pad" title="Шпаргалка (T)"><span class="lbl">Шпаргалка</span><kbd>T</kbd></button>
   <button class="wk-tb icon" id="b-set" title="Меню (Esc)"><svg class="ic" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12"/></svg></button></header>
  <section class="wk-hud" id="hud">
   <div class="wk-streak idle" id="streak"><div class="wk-ring"><svg viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" id="ringfg" cx="23" cy="23" r="19" stroke-dasharray="119.4" stroke-dashoffset="0"/></svg><b id="ringt">–</b></div>
    <div class="wk-sk"><div class="n" id="sk-n">СЕРИЯ 0<em>x1.0</em></div><div class="s" id="sk-s">начни звонить</div></div></div>
   <div class="wk-flow" id="flow" aria-live="polite"><div class="wk-flow-w" id="flow-w"></div><div class="wk-flow-p" id="flow-p"></div></div>
   <div class="wk-res"><span class="x" id="r-x">0 XP</span><span class="m" id="r-m">$0</span><span class="debt" id="r-debt"></span></div>
   <div class="wk-dist"><div class="lbl" id="dist-l"></div><div class="bar"><i id="dist-b"></i></div><div class="day" id="day"></div></div>
   <div class="wk-banner pause" id="bn-pause">Пауза <b id="pause-t">0:00</b> авто-набор выключен<button class="wk-btn" id="bn-res">Продолжить <kbd>P</kbd></button></div>
   <div class="wk-banner test ${tester?'on':''}" id="bn-test">РЕЖИМ ТЕСТИРОВЩИКА <span>звонков нет · в таблицу и файл ничего не пишется · прогресс отдельный</span><button class="wk-btn" id="bn-test-off">Выключить</button></div>
   <div class="wk-banner app" id="bn-app"><span id="bn-app-t"></span><button class="wk-btn" id="bn-reload">Перезагрузить</button></div></section>
  <section class="wk-dw" id="dwin" aria-label="Окно в район"></section>
  <div class="wk-mid" id="mid"><div class="wk-mw" id="mw"><main class="wk-main" id="main"></main></div></div>
 </div>
 <div class="wk-zoom ct-panel hide" id="zoomw"><header>ZOOM PHONE <span id="zst"></span><button class="wk-btn" id="z-hide">Спрятать</button></header></div>
 <div class="wk-glow" id="glow" aria-hidden="true"><i class="g g0"></i><i class="g g1"></i><i class="g g2"></i><i class="g g3"></i><i class="au a1"></i><i class="au a2"></i><i class="o o1"></i><i class="o o2"></i><i class="o o3"></i></div><div class="wk-ov" id="ov"></div><div class="wk-toasts" id="toasts"></div>`;
 const W=$('#wk'),main=$('#main'),ov=$('#ov');
 // ---------- левая панель «Командный центр» ----------
 const CC=makePanel({claim:(k,id,b)=>doClaim(k,id,b),save,G:()=>ses.G,now,d:()=>(save.days||{})[dayKey(now())],secs:SECS,tempo:()=>d.tempo(),onVol:()=>volUi(),openSettings:s=>openSettings(s),shiftEnd:()=>shiftEnd(),persist:persistGame,toast:m=>toast(m),act:a=>act(a),
  vol:{get:()=>({sfx:d.P.vol??.5,music:S.music??.3}),set:(k,v)=>{if(k==='sfx'){d.P.vol=v;d.sp();SFX.setVol(v)}else{S.music=v;au&&au.setMusic&&au.setMusic(v);MUS.v=v;MUS.apply();persistGame()}}},
  onLayout:(m,open)=>{const mid=$('#mid');mid.dataset.cc=m+(open?' open':'');if(main.firstChild)padW()}});
 // ползунки в верхней полосе (≥1180; уже — в НАСТРОЙКАХ панели и в меню): те же значения, что в настройках
 const volUi=()=>{const v=CC.vol();document.querySelectorAll('input[data-vol]').forEach(i=>{if(document.activeElement===i)return;const x=Math.round(v[i.dataset.vol]*100);i.value=x;i.style.setProperty('--v',x+'%')})};
 $('#vol').addEventListener('input',e=>{const t=e.target;if(!t.dataset.vol)return;CC.setVol(t.dataset.vol,t.value/100);t.style.setProperty('--v',t.value+'%')});
 // панель «Протокол» (шпаргалка | Google Doc)
 const PR=makeProto({save,pad:()=>d.P.pad||'',setPad:t=>d.setPad(t),persist:persistGame,toast:m=>toast(m),
  rerender:()=>{const old=$('#pad');if(!old)return;const w=document.createElement('div');w.innerHTML=PR.html(!d.P.padOpen);old.replaceWith(w.firstElementChild);PR.bind(main);$('#pad-x').onclick=()=>act('pad')}});
 // игровое меню (☰ / Esc)
 const GM=makeGameMenu({vol:{get:()=>CC.vol(),set:(k,v)=>CC.setVol(k,v)},
  info:()=>({rank:(RANKS[save.rank??0]||RANKS[0])[1],lvl:((save.lvl??0)+1)+' · '+((LEVELS[save.lvl??0]||LEVELS[0])[1]),money:money(ses.G.money),streak:String(ses.G.streak||0)}),
  run:k=>({settings:()=>openSettings(),map:()=>MAP.open(),base:()=>BASE.open(),journal:()=>openJournal(),tutorial:()=>tutOpen(0),debug:()=>openDebug(),export:()=>SM.exportFile(save),
   home:()=>{if(!demo)SM.save(save);location.href=location.pathname}})[k]?.()});
 // сюжет (R5): плеер сцен. Сцены не мешают звонить: во время звонка, серии и Overdrive они ждут в очереди (ТЗ §6)
 const STORY=makeStory({save,persist:persistGame,fx:()=>S.fx||'full',mount:W,sfx:n=>SFX.snd&&SFX.snd(n),mode:()=>S.storyMode||'full'});
 const stMode=()=>S.storyMode||'full';
 const stSafe=()=>{const w=winNow();return w.state!=='online'&&!(w.od>0)&&(w.state==='idle'||w.state==='lost')};
 const stQ=()=>{save.story=save.story||{seen:{}};return save.story.queue=save.story.queue||[]};
 // показать сцены сейчас (если можно) или отложить; mode «Выкл» — сцена сразу считается просмотренной (есть в Журнале)
 const story=(keys,{force=false,cb}={})=>{keys=[].concat(keys).filter(k=>!STORY.seen(k));if(!keys.length){cb&&cb();return}
  if(stMode()==='off'){keys.forEach(STORY.mark);cb&&cb();return}
  if(!force&&!stSafe()){const q=stQ();for(const k of keys)if(!q.includes(k))q.push(k);persistGame();toast('Сюжетная сцена ждёт конца серии: «Журнал» → «История»');cb&&cb();return}
  STORY.play(keys,cb)};
 // награды забираются руками (вкладка ТРОФЕИ): завеса → монеты летят в счётчик → сумма прокручивается
 let mLock=false;if(migrateClaims(save))persistGame();
 const vis=e=>e&&e.getClientRects().length&&e.getBoundingClientRect().width?e:null;
 const CFX=makeClaimFx({fx:()=>S.fx||'full',sfx:n=>SFX.snd&&SFX.snd(n),money,lock:v=>{mLock=v},target:()=>{const m=vis($('#r-m'));if(m){const r=m.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(hit&&(hit===m||m.contains(hit)))return m}
  // счётчик закрыт панелью (узкий экран): временный счётчик сверху по центру
  const f=document.createElement('div');f.className='wk-m-float';f.innerHTML='<small>деньги</small><b></b>';f.querySelector('b').textContent=money(ses.G.money);document.body.appendChild(f);return f.querySelector('b')}});
 let claiming=false;
 const doClaim=async(k,id,card)=>{if(claiming)return;const r=claimReward(save,ses.G,k,id);if(!r.ok){toast(r.why);return}claiming=true;persistGame();if(MUS.lib)MUS.stinger("achv");
  try{await CFX(card,r)}catch(e){mLock=false}document.querySelectorAll('.wk-m-float').forEach(f=>{f.classList.add('out');setTimeout(()=>f.remove(),400)});claiming=false;hud();CC.refresh();MAP.refresh&&MAP.refresh()};
 // база и Чёрный Рынок (R4): полный экран, модальный
 const applyCos=()=>{document.body.dataset.stamp=(equipped(save.meta,'stamp')||'').replace('stamp-','')};applyCos();
 const BASE=makeBase({onEquip:()=>applyCos(),mount:W,save:()=>save,G:()=>ses.G,persist:persistGame,toast:t=>toast(t),sfx:n=>SFX.snd&&SFX.snd(n),fx:()=>S.fx||'full',
  dark:()=>(save.rank??0)===0&&!!save.wasNobody,onBuy:()=>{applyCos();hud();CC.refresh&&CC.refresh()},onClose:()=>stFlush()});
 const stFlush=()=>{const q=stQ();if(!q.length||!stSafe()||STORY.isOpen()||ARENA.isOpen()||BASE.isOpen()||document.querySelector(".tut"))return;const k=q.splice(0);persistGame();const ar=k.filter(x=>x.startsWith('arena-')),sc=k.filter(x=>!x.startsWith('arena-'));
  const go=()=>{if(ar.length){const dd=+ar.at(-1).split('-')[1];if(dd===ses.G.district)arenaIntro(dd);else ar.forEach(x=>STORY.mark('boss-'+x.split('-')[1]))}};if(sc.length)story(sc,{force:true,cb:go});else go()};
 // первый запуск с сюжетом (save.story.v нет): старому сохранению открываем пройденное (в Журнал), новой игре играем пролог
 {const st=save.story=save.story||{seen:{},queue:[]},cur=ses.G.district||1,fresh=cur===1&&!(ses.G.lifeXp>0);st.seen=st.seen||{};
  if(!st.v){st.v=1;if(!fresh){const t=Date.now(),sn=st.seen;sn.prologue=t;for(let k=1;k<cur;k++){sn['intro-'+k]=t;sn['boss-'+k]=t;sn['capture-'+k]=t}sn['intro-'+cur]=t}persistGame()}
  if(!st.seen.prologue&&fresh&&!demo&&!tester)setTimeout(()=>story(['prologue','intro-1'],{force:true,cb:()=>{tutWant=fresh;tutMaybe()}}),900)}
 // обучение (ТЗ §7): после пролога новой игры; заново — Esc → «Обучение». Статус и отмена — на тренажёре, живой лид не трогаем
 const TUT=makeTutor({steps:TUTORIAL,sfx:n=>SFX.snd&&SFX.snd(n==='undo'?'del':n),stamp:{label:'VOICEMAIL',color:'#d9a07a'},
  onDone:(how,i)=>{const t=save.tutorial=save.tutorial||{};t.done=true;t.how=how;t.at=i;t.when=Date.now();persistGame();toast(how==='skip'?'Обучение можно пройти заново: Esc → «Обучение»':'Обучение пройдено. Хорошей смены',how==='skip'?'':'gold');stFlush()}});
 let tutWant=false;const tutOpen=(k=0)=>{if(STORY.isOpen()||ARENA.isOpen())return;MAP.isOpen()&&MAP.close&&MAP.close();BASE.isOpen()&&BASE.close&&BASE.close();if(ov.classList.contains('open')&&ov.dataset.k!=='gate')closeOv();TUT.open(k)};
 const tutMaybe=()=>{if(!tutWant||(save.tutorial&&save.tutorial.done)||TUT.isOpen())return;if(!d.view().lead)return;tutWant=false;setTimeout(()=>tutOpen(0),700)};
 // арена босса (R3): полный экран, статусы ставятся как обычно — арена показывает удары
 const ARENA=makeArena({mount:W,fx:()=>S.fx||'full',sfx:n=>SFX.snd&&SFX.snd(n),G:()=>ses.G,hp:bossHp,state:bossState});
 // ---------- музыка из своей папки (handle в IndexedDB «ct_music»; темы, босс, районы, Overdrive, стингеры) ----------
 const MUS=new Music(gbus),MTH={industrial:'industrial',neon:'neon',chrome:'neon',blackgold:'blackgold',orbital:'blackgold'};let musPrev=.3;
 const musCtx=()=>{const G=ses.G;return{paused:!!G.paused,world:BASE.isOpen()||MAP.isOpen(),od:!!G.od,boss:bossState(G)!=='scenery',step:G.step||0,ulta:G.ulta,theme:MTH[(DIST[(G.district||1)-1]||[])[2]]||'industrial',dist:G.district||1}};
 const musLoad=async how=>{try{const c=au&&au.init&&au.init();if(!c)return 0;MUS.init(c);MUS.v=S.music??.3;const n=how==='pick'?await MUS.fromFolder():await MUS.reconnect();
   if(n){S.musicDir=true;persistGame();MUS.setCtx(musCtx());MUS.start();toast('Музыка: '+n+' '+(n%10===1&&n%100!==11?'трек':n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'трека':'треков'))}else if(how==='pick')toast('В папке нет аудиофайлов (mp3, ogg, wav, m4a, aac, flac)');return n}
  catch(e){if(how==='pick'&&e&&e.name!=='AbortError')toast('Папка не открылась: '+(e.message||e));return 0}};
 if(S.musicDir&&!demo){const re=()=>{removeEventListener('pointerdown',re);removeEventListener('keydown',re);musLoad('re')};addEventListener('pointerdown',re);addEventListener('keydown',re)}
 const DW=makeDistrictWindow({el:$('#dwin'),G:()=>ses.G,state:bossState,hp:bossHp,prog:G=>G.dxp/(districtThr(G.district)*(1-C.bossPhaseShare)),on:()=>S.dwin!==false,fx:()=>S.fx||'full',
  onOpen:k=>k==='arena'?ARENA.open(ses.G.district||1):MAP.open()});
 const arenaIntro=dd=>{STORY.mark('boss-'+dd);ARENA.open(dd,{intro:true})};
 // босс вышел впервые в этом районе: интро сейчас (если можно) или в очередь сцен
 const bossCheck=()=>{const G=ses.G,dd=G.district,m=save.meta||(save.meta={});m.bossIntro=m.bossIntro||{};if(bossState(G)==='scenery'||m.bossIntro[dd])return;
  m.bossIntro[dd]=Date.now();persistGame();if(stMode()==='off'){STORY.mark('boss-'+dd);return}
  if(stSafe()&&!STORY.isOpen())arenaIntro(dd);else{const q=stQ();if(!q.includes('arena-'+dd))q.push('arena-'+dd);toast(`Вышел босс: ${DIST[dd-1][3]}. Арена откроется после серии`,'gold')}};
 // карта мира (R2): полный экран поверх работы, звонок не прерывается
 const MAP=makeMap({trail:()=>TRAIL_COL[equipped(save.meta,'trail')]||null,save,G:()=>ses.G,persist:persistGame,toast:m=>toast(m),fx:()=>S.fx||'full',mount:W,sfx:n=>SFX.snd&&SFX.snd(n),
  onReveal:(d,cb)=>story(d>1?['capture-'+(d-1),'intro-'+d]:['intro-'+d],{cb}),onOpen:()=>stFlush(),
  info:()=>({lvl:((save.lvl??0)+1)+' · '+((LEVELS[save.lvl??0]||LEVELS[0])[1]),xp:ses.G.lifeXp||0,money:money(ses.G.money)})});
 $('#mid').prepend(CC.el);$('#mid').append(CC.scrim);CC.sync();volUi();
 // ---------- Zoom iframe (живой, даже когда спрятан) ----------
 const zw=$('#zoomw');
 if(d.zoom.enabled&&!demo&&!tester){frame=document.createElement('iframe');frame.src=ZOOM_SRC;frame.allow="microphone; camera; autoplay; clipboard-read; clipboard-write; display-capture";
  frame.onload=()=>d.zoom.onFrameLoad();zw.appendChild(frame)}
 addEventListener('message',e=>{d.zoom.onMessage(e.origin,e.data,d.view().lead&&d.view().lead.phone)});
 const zoomUi=()=>{zw.classList.toggle('hide',!d.zoom.shown);$('#zst').textContent=d.zoom.status||''};
 $('#z-hide').onclick=()=>{d.zoom.setShown(false);zoomUi()};
 // ---------- тосты и эффекты ----------
 const toast=(m,cls='')=>{const box=$('#toasts'),t=document.createElement('div');t.className='wk-toast '+cls;t.textContent=m;
  // одинаковый тост подряд не дублируем, а продлеваем; больше трёх сразу не держим
  const same=[...box.children].find(x=>x.textContent===m&&!x.classList.contains('out'));if(same){clearTimeout(same._t);same._t=setTimeout(()=>tout(same),2600);return}
  box.appendChild(t);const live=[...box.children].filter(x=>!x.classList.contains('out'));if(live.length>3)tout(live[0]);t._t=setTimeout(()=>tout(t),cls==='gold'?4200:2800)};
 const tout=t=>{clearTimeout(t._t);t.classList.add('out');setTimeout(()=>t.remove(),320)};
 // ---------- награды: ачивки, задания, трофеи, уровень, ранг — по одной, плавно, потом улетают в меню ☰ (позже — во вкладку ТРОФЕИ) ----------
 const RQ=[];let rqBusy=false;
 const MEDAL='<svg viewBox="0 0 40 40" aria-hidden="true"><path class="rb" d="M13 2h6l-3 12h-6zM21 2h6l3 12h-6z"/><circle class="md" cx="20" cy="25" r="11"/><circle class="in" cx="20" cy="25" r="7.5"/><path class="st" d="M20 19.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.6 3.8-.5z"/></svg>';
 const reward=(kind,title,sub,rar='c')=>{RQ.push({kind,title,sub,rar});if(!rqBusy)nextReward()};
 const nextReward=()=>{const it=RQ.shift();if(!it){rqBusy=false;return}rqBusy=true;const el=document.createElement('div');el.className='wk-rw r-'+it.rar;
  el.innerHTML=`<div class="ic">${MEDAL}</div><div class="tx"><div class="k">${esc(it.kind)}${RQ.length?` <em>+${RQ.length}</em>`:''}</div><div class="n">${esc(it.title)}</div>${it.sub?`<div class="s">${esc(it.sub)}</div>`:''}</div>`;
  {const h=$('#hud');if(h)el.style.top=Math.round(h.getBoundingClientRect().bottom+10)+'px'}document.body.appendChild(el);SFX.snd&&SFX.snd(it.rar==='l'?'fanfare':'tick');
  const hold=RQ.length>2?1500:2600;setTimeout(()=>{const vis=e=>e&&e.getClientRects().length&&e.getBoundingClientRect().width?e:null,tgt=vis(CC.target())||vis($('#b-cc'))||$('#b-set'),a=el.getBoundingClientRect(),b=tgt?tgt.getBoundingClientRect():{left:innerWidth-30,top:10,width:20,height:20};
   const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
   if(S.fx==='off'){el.remove();nextReward();return}
   el.animate([{transform:'none',opacity:1},{transform:`translate(${dx*.2}px,${dy*.2+6}px) scale(.9)`,opacity:1,offset:.25},{transform:`translate(${dx}px,${dy}px) scale(.08)`,opacity:.2}],{duration:620,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'}).onfinish=()=>{el.remove();if(tgt){tgt.classList.remove('wk-catch');void tgt.offsetWidth;tgt.classList.add('wk-catch')}CC.refresh();setTimeout(nextReward,160)}},hold)};
 const gain=(x,m,el)=>{if(!x&&!m)return;const r=(el||$('#stat')||main).getBoundingClientRect(),g=document.createElement('div');g.className='wk-gain';
  g.style.left=(r.left+r.width/2)+'px';g.style.top=(r.top+20)+'px';g.innerHTML=(x?`<span class="x">+${x} XP</span>`:'')+(m?`<span class="m">+${money(m)}</span>`:'');document.body.appendChild(g);setTimeout(()=>g.remove(),1400)};
 const J=makeJuice(()=>S.fx||'full');
 // ---------- поток (вместо полоски Overdrive, ч.6–7): мысли оператора по стадиям серии, шкала шагов, свечение краёв ----------
 // Стадии = ступени множителя: 0 — x1 (1–3), 1 — x1.25 (4–9), 2 — x1.5 (10–19), 3 — x2 (20+), 4 — OVERDRIVE. Внутри стадии всё растёт плавно.
 const FLOW=[['Есть контакт','Линия ожила','Пошло','Первая искра','Разгоняемся','Так, работаем'],
  ['Ритм пойман','Держи темп','Хорошо идёт','Чисто работаешь','Набираем ход','Уже теплее'],
  ['Ты в потоке','Горит!','Не сбавляй','Только не останавливайся','Жара пошла','Ещё сильнее'],
  ['Неудержим','Ещё! Ещё!','Ты машина','Город слышит тебя','Остановиться нельзя','Чистый огонь'],
  ['OVERDRIVE','Всё горит','Пик формы','Выжми всё','Ты и есть эфир','Легенда линии']];
 // у каждой стадии своя пара цветов (градиент букв), внутри стадии оттенок сдвигается от фразы к фразе
 const FLOWC=[['#9fe8ff','#5fb8ff'],['#b6ff7a','#39ff14'],['#ffe27a','#ffb020'],['#ffa24a','#ff3d6e'],['#ff2bd6','#3ad7ff']];
 const tier=w=>w.od?4:w.step>=3?3:w.step>=2?2:w.step>=1?1:0;
 let lastPhrase='',prevMult=null,prevStreak=0,flowT=0;
 const winNow=()=>windowState(ses.G,now(),{onLine:d.calling||(d.call&&d.call.ended==null),zoom:d.zoom.live});
 const stepsC=C.heat.steps;
 // вторая строка: шаги до следующего множителя точками + сколько до OVERDRIVE
 const pipsHtml=w=>{if(!w.streak&&!w.od)return'';if(w.od)return`<span class="od on">OVERDRIVE <b>${mmss(w.od)}</b></span>`;
  let a='';if(w.nextMult!=null){const from=stepsC[w.step]||0,span=stepsC[w.step+1]-from,got=Math.max(0,w.streak-from);
   a=`<span class="nx"><b>x${w.nextMult}</b><i class="pp">${Array.from({length:span},(_,i)=>`<i class="${i<got?'f':''}"></i>`).join('')}</i></span>`}
  const o=Math.max(0,w.odNeed-w.odProg);return a+(o>0?`<span class="od">OVERDRIVE через <b>${o}</b></span>`:'')};
 let pipsKey='';const pipsUi=w=>{const el=$('#flow-p');if(!el)return;const k=w.od?'od'+w.od:w.streak+'|'+w.step+'|'+w.odProg;if(k===pipsKey)return;pipsKey=k;el.innerHTML=pipsHtml(w);el.classList.toggle('on',!!(w.streak||w.od))};
 const flowPop=(e)=>{const box=$('#flow-w');if(!box)return;const w=winNow(),t=tier(w);let big=null;
  if(e&&e.odStart)big='OVERDRIVE ВКЛЮЧЁН';else if(prevMult!=null&&w.mult>prevMult)big=`x${w.mult} ВКЛЮЧЁН`;
  let ph=big;if(!ph){const pool=FLOW[t].filter(x=>x!==lastPhrase);ph=pool[Math.random()*pool.length|0];lastPhrase=ph}
  prevMult=w.mult;const [c1,c2]=FLOWC[t],idx=FLOW[t].indexOf(ph),hue=idx<0?0:(idx-2.5)*7;
  // сила внутри стадии: 0..1 — растут размер, свечение, разлёт букв
  const from=stepsC[w.step]||0,to=stepsC[w.step+1]??(from+10),pw=w.od?1:Math.min(1,(w.streak-from+1)/Math.max(1,to-from));
  const el=document.createElement('div');el.className='wk-fl t'+t+(big?' big':'');el.style.cssText=`--c1:${c1};--c2:${c2};--h:${hue}deg;--p:${pw.toFixed(2)}`;
  el.innerHTML=`<b>${esc(ph)}</b>`;box.querySelectorAll('.wk-fl').forEach(x=>{x.classList.add('gone');setTimeout(()=>x.remove(),600)});box.appendChild(el);
  clearTimeout(flowT);flowT=setTimeout(()=>el.classList.add('rest'),big?3200:2200);
  const n=$('#sk-n');if(n&&w.streak>prevStreak&&S.fx!=='off'){n.classList.remove('punch');void n.offsetWidth;n.classList.add('punch')}prevStreak=w.streak;
  pipsKey='';pipsUi(w)};
 // свечение по краям: еле заметно на первом статусе, растёт с каждым, цвет идёт голубой → зелёный → золото → огонь; в OVERDRIVE переливающаяся рамка
 let glowK='';const glow=w=>{const g=$('#glow');if(!g)return;const lost=w.state==='lost'||(!w.streak&&!w.od);const t=lost?-1:tier(w);
  const I=lost?0:w.od?1:Math.min(1,.1+.9*Math.sqrt(Math.min(w.streak,24)/24));const k=t+'|'+I.toFixed(2);if(k===glowK)return;glowK=k;
  const wt=[0,0,0,0];if(t>=0&&t<4){wt[t]=1;if(t>0)wt[t-1]=.35}
  g.style.setProperty('--i',I.toFixed(3));g.querySelectorAll('.g').forEach((x,i)=>{x.style.opacity=(I*wt[i]).toFixed(3)});
  g.querySelectorAll('.au').forEach(x=>{x.style.opacity=t>=2&&t<4?(I*(t===3?.9:.5)).toFixed(3):'0'});g.classList.toggle('od',t===4)};
 // ---------- главный экран ----------
 const statBtn=(b,small)=>`<button class="wk-st ${small?'small':''} ${WIN.includes(b.i)?'win':''} fx-${(SFX.FXT[b.i]||[])[2]||'fade'}" data-st="${b.i}" style="--c:${b.color}"><span class="k">${b.key}</span><span>${esc(b.name)}</span></button>`;
 const moreOpen=()=>!!d.P.moreOpen;
 const layout=()=>{const v=d.view();
  if(!v.loaded){main.innerHTML=emptyHtml();bindEmpty();return}
  main.innerHTML=`<section class="wk-col"><div class="wk-card ct-panel" id="card"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><div id="lead"></div></div><div class="wk-card wk-card2 ct-panel" id="card2"><div id="lead2"></div></div></section>
   <section class="wk-col"><div class="wk-stat ct-panel" id="stat"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i>
    <div class="wk-lbl">СТАТУС ЗВОНКА</div><div class="wk-grid">${BUTTONS.slice(0,PRIM).map(b=>statBtn(b)).join('')}<button class="wk-st skip" data-act="skip" title="Лид вернётся позже в очереди, ничего не меняется"><span class="k">S</span><span>Отложить</span></button>
    <button class="wk-st skip more-b ${moreOpen()?'on':''}" id="b-more" data-act="menu"><span class="k">M</span><span>Ещё статусы</span><i class="chev" aria-hidden="true"></i></button></div>
    <div class="wk-acts"><button class="wk-tb" id="b-back" data-act="back" title="Вернуться к предыдущему лиду. Данные не меняются">← Прошлый лид<kbd>Z</kbd></button><button class="wk-tb" id="b-pause" data-act="pause">Пауза<kbd>P</kbd></button><button class="wk-tb" id="b-clr" data-act="clear">Убрать статус<kbd>X</kbd></button></div>
    <div class="wk-more ${moreOpen()?'open':''}" id="more"><div class="wk-lbl">ЕЩЁ СТАТУСЫ</div><div class="wk-grid">${BUTTONS.slice(PRIM).map(b=>statBtn(b,1)).join('')}</div></div>
    <div class="wk-hint">Space звонок · 1–6 статусы · S отложить · M ещё · X убрать · Z прошлый · P пауза · N заметки · / лиды</div></div></section>
   ${PR.html(!d.P.padOpen)}`;
  PR.bind(main);$('#pad-x').onclick=()=>act('pad');
  $('#stat').onclick=e=>{const b=e.target.closest('[data-st],[data-act]');if(!b)return;if(b.dataset.act)act(b.dataset.act);else doStatus(+b.dataset.st)};
  padW();renderLead();placeMore()};
 const padW=()=>{W.style.setProperty('--padw',d.P.padOpen&&$('#mw').clientWidth>=1200?'minmax(260px,.8fr)':'0px');const p=$('#pad');if(p)p.classList.toggle('hidden',!d.P.padOpen)};
 // отзывы и адрес скрыты, как скрытый текст в Telegram (в старом дайлере был blur): клик показывает, до смены лида
 const rev={r:'',a:''};const sp=(k,ph,html)=>{const on=rev[k]===ph;return `<span class="wk-spoil ${on?'on':''}" data-sp="${k}" data-ph="${esc(ph)}" ${on?'':'title="Показать" role="button" tabindex="0"'}><span class="t">${html}</span></span>`};
 main.addEventListener('click',e=>{const x=e.target.closest('.wk-spoil:not(.on)');if(!x)return;rev[x.dataset.sp]=x.dataset.ph;x.classList.add('on');x.removeAttribute('title');x.removeAttribute('tabindex')});
 const renderLead=()=>{const v=d.view(),box=$('#lead');if(!box)return;
  if(!v.lead){box.innerHTML=`<h2 class="wk-biz">${v.exhausted?'Территория пройдена':'Нет лида'}</h2><p class="wk-ver">${v.exhausted?'Необработанных лидов по текущим фильтрам нет. Сбрось фильтры или выбери лида вручную.':''}</p><div class="wk-btns"><button class="wk-btn pri" data-a="picker">Выбрать лида</button><button class="wk-btn" data-a="reset">Сбросить фильтры</button></div>`;
   box.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='picker')openPicker();else d.setFilter({},true)};markStatus(-1);return}
  const L=v.lead,lt=L.local,typing=document.activeElement&&['wk-notes','wk-cb'].includes(document.activeElement.id)&&box.dataset.ph===L.phone;
  if(typing){dialUi(v);markStatus(L.resultIndex);return}
  box.dataset.ph=L.phone;
  box.innerHTML=`<h2 class="wk-biz">${esc(L.biz||'Без названия')}</h2>
   <div class="wk-meta">${L.type?`<span class="wk-chip">${esc(L.type)}</span>`:''}${L.state?`<span class="wk-chip">${esc(L.state)}</span>`:''}
    ${lt?`<span class="wk-chip time ${lt.work?'':'off'}">у них ${esc(lt.time)} ${esc(lt.tz)}</span>`:''}${L.reviews?sp('r',L.phone,`<span class="wk-chip">★ ${esc(L.reviews)} отзывов</span>`):''}
    ${L.result?`<span class="wk-chip res" style="background:${L.resultColor}">${esc(L.result)}</span>`:''}</div>
   <div class="wk-phone"><span class="wk-num">${esc(L.rawPhone||L.phone)}</span></div>
   <div class="wk-phone"><button class="wk-dial" id="b-dial"></button>${tester?`<button class="wk-btn wk-tend" id="b-tend" title="Только в режиме тестировщика (H)">Завершить тест-звонок <kbd>H</kbd></button>`:''}</div>
   <div class="wk-links">${L.site?`<a href="${esc(/^https?:/i.test(L.site)?L.site:'https://'+L.site)}" target="_blank" rel="noopener">Сайт</a>`:''}${L.map?`<a href="${esc(L.map)}" target="_blank" rel="noopener">Карта</a>`:''}${L.email?`<a href="mailto:${esc(L.email)}">${esc(L.email)}</a>`:''}</div>
`;
  $('#lead2').innerHTML=`${L.verification?`<div class="wk-ver">${esc(L.verification)}</div>`:''}${L.address?`<div class="wk-ver">${sp('a',L.phone,esc(L.address))}</div>`:''}
   ${L.prep?`<div class="wk-prep"><h4>Подготовка</h4>${esc(L.prep)}</div>`:''}
   <div class="wk-lbl">ЗАМЕТКИ <kbd>N</kbd></div><textarea class="wk-notes" id="wk-notes" placeholder="Заметки (N)">${esc(L.notes)}</textarea>
   <div class="wk-row2"><div><div class="wk-lbl">КОГДА ПЕРЕЗВОНИТЬ</div><input class="wk-in" id="wk-cb" value="${esc(L.callback)}" placeholder="например: вт 10:00 их времени"></div></div>
   <div class="wk-next">${v.next?'Дальше: '+esc(v.next)+' · ':''}осталось ${v.remaining}</div>`;
  $('#wk-notes').oninput=e=>d.setNotes(e.target.value);$('#wk-cb').oninput=e=>d.setCallback(e.target.value);
  $('#b-dial').onclick=()=>act('dial');{const te=$('#b-tend');if(te)te.onclick=()=>act('hangup')}dialUi(v);markStatus(L.resultIndex)};
 const dialUi=(v=d.view())=>{const b=$('#b-dial');if(!b)return;const on=v.calling||(d.call&&d.call.ended==null);
  b.classList.toggle('on',on);{const te=$('#b-tend');if(te)te.classList.toggle('live',on)}b.innerHTML=on?`<svg class="osc" viewBox="0 0 54 22"><path id="oscp" d="M0 11 H54"/></svg>НА ЛИНИИ ${mmss(v.callSec)}`:`ПОЗВОНИТЬ<kbd>Space</kbd>`};
 const markStatus=i=>{const c=$('#b-clr');if(c)c.disabled=!(i>=0);document.querySelectorAll('.wk-st[data-st]').forEach(b=>{b.classList.toggle('cur',+b.dataset.st===i);b.classList.toggle('sug',+b.dataset.st===shownSug)})};
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
  glow(w);pipsUi(w);if(prevMult==null||w.mult<prevMult)prevMult=w.mult;if(!w.streak)prevStreak=0;
  $('#r-x').textContent=Math.round(G.lifeXp).toLocaleString('ru')+' XP';if(!mLock)$('#r-m').textContent=money(G.money);DW.sync();if(MUS.lib)MUS.setCtx(musCtx());CC.badge&&CC.badge();$('#r-debt').textContent=w.debt?`долг −${w.debt} XP`:'';
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
  if(f){SFX.statusSound(meta.index);J.exit($('#card'),f[0],f[1],f[2],!!meta.win)}
  if(meta.milestone){setTimeout(()=>SFX.snd(meta.milestone.kind==='hundred'?'fanfare':'levelup'),500);setTimeout(()=>J.free(meta.milestone.kind==='hundred'?meta.milestone.n+' CALLS':'20 / 20','#ffc400'),meta.win?1200:500)}
  if(out.blocked){toast(out.blocked==='none'||out.blocked==='broken'?'Игра не начисляет: таблица не подтверждена':'Игра не начислила за этот статус','bad')}
  const e=out.ev;if(e){gain(e.x,e.m);if(!e.captured)DW.hit(e.cls);if(MUS.lib){if(e.captured)MUS.stinger('capture');else if(e.cls==='BOOKED')MUS.stinger('booked');else if(e.cls==='DISCOVERY')MUS.stinger('discovery')}if(ARENA.isOpen()){if(e.captured)ARENA.defeat();else ARENA.hit(e.cls)}if(!e.captured)bossCheck();if(e.spam)toast('Слишком быстро: награда x0.5','bad');if(e.pen==='drop')toast('Окно сгорело: жар на ступень ниже','bad');if(e.pen==='reset')toast('Перерыв больше 40 мин: серия с нуля','bad');
   if(e.odStart){toast(`OVERDRIVE ${C.od.sec/60} мин: $ x${C.od.money}, XP x${C.od.xp}`,'gold')}if(e.captured)toast('РАЙОН ЗАХВАЧЕН','gold');if(e.settle&&e.settle.bonus&&e.settle.bonus.x)setTimeout(()=>gain(e.settle.bonus.x,e.settle.bonus.m),700)}
  if(out.meta&&out.meta.winUnverified)toast('Без данных Zoom встреча идёт «на проверку»: в таблицу записано, игра считает как разговор','bad');
  (out.achv||[]).forEach(a=>reward('Ачивка · забери в ТРОФЕЯХ',a.n||a.name,a.h,a.r||'c'));(out.missions||[]).forEach(m=>reward('Задание выполнено',m.name,'+'+money(m.money),'r'));if(out.trophy)reward('Трофей · забери в ТРОФЕЯХ',out.trophy.company,'','l');
  if(out.levelUp!=null)reward('Новый уровень '+(out.levelUp+1),(LEVELS[out.levelUp]||[])[1]||'','','r');if(out.rankUp!=null)reward('Новый ранг',(RANKS[out.rankUp]||[])[1]||'','','l');
  if(e&&!out.blocked)flowPop(e);shownSug=-1;persistGame();hud();CC.refresh();MAP.refresh()});
 dbus.on('statusCleared',e=>{const how=ses.dropLead(e.phone);if(how)toast(how==='full'?'Статус убран: всё откатано':'Статус убран: снято всё, что он принёс');persistGame();hud();CC.refresh();MAP.refresh()});
 dbus.on('callLogged',e=>{const r=ses.lateLog(e.callId,e.duration);if(r&&r.bonus&&r.bonus.x){gain(r.bonus.x,r.bonus.m);persistGame()}});
 dbus.on('pauseChanged',e=>{e.paused?ses.pause():ses.resume();$('#bn-pause').classList.toggle('on',e.paused);persistGame()});
 dbus.on('leadChanged',()=>{if(!$('#lead')&&d.view().loaded)layout();else renderLead();leds()});
 dbus.on('leadsLoaded',()=>{layout();leds();tutMaybe()});
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
  case'hangup':if(tester){if(!d.zoom.hangup())toast('Тест-звонка нет')}break;   // отбоя из браузера нет (Zoom его не принимает, ч.5); в режиме тестировщика H/кнопка завершают фейковый звонок
  case'status':doStatus(x);break;case'skip':d.skip();break;case'back':d.back();break;case'clear':d.clearStatus();break;
  case'pause':d.pause();break;case'notes':{const n=$('#wk-notes');if(n){n.focus();n.selectionStart=n.value.length}break}
  case'panel':CC.toggle();break;
  case'menu':d.P.moreOpen=!d.P.moreOpen;d.sp();placeMore();break;
  case'pad':d.openCheatSheet();break;case'picker':openPicker();break;case'close':if(ov.classList.contains('open')&&ov.dataset.k!=='gate')closeOv();else if(d.P.moreOpen){d.P.moreOpen=false;d.sp();placeMore()}else if(CC.isOpen()&&CC.mode()!=='wide')CC.setOpen(false);else GM.open();break;   // как в старом: Esc сперва закрывает «Ещё статусы»
  case'blur':document.activeElement&&document.activeElement.blur();break;case'debug':openDebug();break;case'gmenu':GM.toggle();break;
  case'map':MAP.toggle();break;case'base':BASE.toggle();break;case'muteMusic':{const v=S.music??.3;if(v>0){musPrev=v;CC.setVol('music',0);toast('Музыка выключена (⇧M — вернуть)')}else{CC.setVol('music',musPrev||.3);toast('Музыка включена')}volUi();break}
  case'nextTrack':if(MUS.lib){MUS.next(1.2);setTimeout(()=>toast('Трек: '+((MUS.last&&MUS.last.name)||'—')),60)}else toast('Музыки нет: Настройки → Звук → «Папка с музыкой…»');break}};
 addEventListener('keydown',e=>{if(STORY.isOpen()){if(STORY.key(e))e.preventDefault();return}if(TUT.isOpen()){if(TUT.key(e))e.preventDefault();return}if(ARENA.isOpen()&&ARENA.key(e)){e.preventDefault();return}if(BASE.isOpen()){if(BASE.key(e))e.preventDefault();return}if(GM.isOpen()){if(GM.key(e))e.preventDefault();return}if(MAP.isOpen()){if(MAP.key(e))e.preventDefault();return}const ae=document.activeElement,typing=ae&&(/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae.isContentEditable);
  const modal=ov.classList.contains('open');if(modal&&e.code==='Escape'&&ov.dataset.k!=='gate'){e.preventDefault();closeOv();return}if(modal&&!typing&&ov.dataset.k==='pick'&&e.code==='Enter'){const f=ov.querySelector('.wk-li');if(f){f.click();e.preventDefault()}return}
  const r=resolveKey({typing,menu:!!d.P.moreOpen,suggest:shownSug,world:false,modal,shift:e.shiftKey,meta:e.metaKey,alt:e.altKey,ctrl:e.ctrlKey},e.code);if(!r)return;
  if(e.repeat&&r.a!=='blur')return;e.preventDefault();if(r.a==='status')act('status',r.id);else act(r.a)});
 const tb=$('#bn-test-off');if(tb)tb.onclick=()=>setTester(false);$('#b-pick').onclick=()=>act('picker');$('#b-cc').onclick=()=>CC.toggle();$('#b-pad').onclick=()=>act('pad');$('#b-set').onclick=()=>GM.toggle();
 $('#bn-res').onclick=()=>act('pause');$('#bn-reload').onclick=()=>location.reload();$('#b-end').onclick=()=>shiftEnd();
 // ---------- окна ----------
 const openOv=(k,html,sm)=>{ov.dataset.k=k;ov.innerHTML=`<div class="wk-win ct-panel ${sm?'sm':''}" role="dialog"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i>${html}</div>`;ov.classList.add('open')};
 let dbgTab='zoom',dbgCalc={n:100,t:20,b:1};
 const openDebug=(t)=>{if(t)dbgTab=t;openOv('dbg',debugHtml({zoom:d.zoom,G:ses.G,calc:dbgCalc},dbgTab));const w=ov.querySelector('.wk-win');w.classList.add('dbg-w');
  $('#dbg-x').onclick=closeOv;w.querySelectorAll('.dbg-nav button').forEach(b=>b.onclick=()=>openDebug(b.dataset.t));
  w.addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(!b)return;if(b.dataset.b==='zlog')copy(d.zoom.logText(),'Журнал Zoom скопирован ('+d.zoom.log.length+' событий)');if(b.dataset.b==='retest')openDebug('test');
   // повтор анимации раскрытия текущего района: прогресс не трогаем, фигурка просто встаёт на соседний район
   if(b.dataset.b==='arena'){closeOv();ARENA.open(ses.G.district||1,{intro:true});ARENA.demo();return}
   if(b.dataset.b.startsWith('st-')){const c=ses.G.district||1,k={'st-pro':'prologue','st-cur':'intro-'+c,'st-boss':'boss-'+c,'st-fin':'finale'}[b.dataset.b];closeOv();if(b.dataset.b==='st-jr')STORY.openJournal();else STORY.play(k,null,true);return}
   if(b.dataset.b==='mapdemo'){const c=ses.G.district;closeOv();if(c<2){toast('Раскрывать нечего: открыт только первый район');return}const m=save.map||(save.map={});m.seen=(m.seen||[]).filter(x=>x!==c);m.pos=c-1;MAP.open()}});
  w.querySelectorAll('[data-c]').forEach(i=>i.onchange=()=>{dbgCalc[i.dataset.c]=Math.max(0,+i.value||0);openDebug('bal');const f=ov.querySelector(`[data-c="${i.dataset.c}"]`);if(f)f.focus()})};
 const openJournal=()=>{openOv('jr',journalHtml(save,now()));ov.querySelector('.wk-win').classList.add('dbg-w');$('#jr-x').onclick=closeOv;$('#jr-story').onclick=()=>{closeOv();STORY.openJournal()}};
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
 let sec='calls';
 const sw=(id,on,t,small)=>`<div class="wk-opt"><div class="t"><b>${t}</b>${small?`<small>${small}</small>`:''}</div><button class="ct-switch ${on?'on':''}" data-sw="${id}" aria-pressed="${!!on}"></button></div>`;
 const btn=(id,t,small,label,cls='')=>`<div class="wk-opt"><div class="t"><b>${t}</b>${small?`<small>${small}</small>`:''}</div><button class="wk-btn ${cls}" data-b="${id}">${label}</button></div>`;
 const secHtml=()=>{const P=d.P,z=d.zoom,sh=d.sheets.state();switch(sec){
  case'calls':return`<h4>Звонки</h4>${sw('auto',d.auto,'Автонабор следующего','После статуса сразу звонит следующему (после встречи пауза 1 с, на сотне 2,8 с)')}
   ${sw('only',d.q.only,'В очереди только лиды без статуса','Выкл: показывать всех подряд')}
   ${sw('guard',P.guard!==false,'Возвращать из Zoom в браузер','Метка ☎ в заголовке вкладки для твоего скрипта на Mac')}`;
  case'zoom':return`<h4>Встроенный телефон</h4>${sw('zemb',z.enabled||P.zoomEmbed!==false,'Встроенный телефон Zoom','Через него браузер видит звонки: серия по Zoom, проверка встреч, бонус за разговор')}
   ${sw('zwin',!!P.zoomWindow,'Показывать окно Zoom','Для входа и диагностики. Спрятанное окно продолжает работать')}
   <div class="wk-kv" style="margin:10px 0">Состояние: <b>${z.live?'подключён ✓':z.gate==='connecting'?'подключаю…':z.gate==='app'?'звонки через приложение':z.enabled?'не подключён':'выключен'}</b> · Zoom: <b>${esc(z.status||'–')}</b> · здоровье: <b>${zp.health().state}</b></div>
   <div class="wk-btns"><button class="wk-btn" data-b="zlog">Скопировать журнал Zoom</button><button class="wk-btn" data-b="zgate">Проверить подключение</button></div>
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
   ${btn('mdir','Папка с музыкой…',MUS.lib?'Загружено треков: '+Object.values(MUS.pools).reduce((a,x)=>a+x.length,0)+' · подпапки: '+Object.keys(MUS.pools).join(', '):'Подпапки: industrial/calm, neon/action, overdrive, hq, boss, d1…d12, stingers. Можно и без подпапок','Выбрать…')}${btn('sdir','Свои звуки из папки…',SFX.getState().files?'Загружено файлов: '+SFX.getState().files:SFX.getState().need?'Нужно разрешение на папку':'','Выбрать…')}${btn('snames','Какие имена у файлов звуков','','Копировать')}
   <h4>Вид</h4><div class="wk-opt"><div class="t"><b>Эффекты</b><small>Штамп статуса, анимации карточки, сканлайны</small></div><div class="wk-btns">${['off','low','full'].map(v=>`<button class="wk-btn ${S.fx===v?'pri':''}" data-fx="${v}">${{off:'Выкл',low:'Мало',full:'Полно'}[v]}</button>`).join('')}</div></div>
   <div class="wk-opt"><div class="t"><b>Сюжет</b><small>Сцены районов и Гудок. Во время звонка, серии и Overdrive сцены ждут. «Выкл» — сцены сразу попадают в Журнал истории</small></div><div class="wk-btns">${['off','short','full'].map(v=>`<button class="wk-btn ${stMode()===v?'pri':''}" data-stm="${v}">${{off:'Выкл',short:'Коротко',full:'Полно'}[v]}</button>`).join('')}</div></div>
   <div class="wk-opt"><div class="t"><b>Окно в район</b><small>Полоса со сценой района над работой. В фазе босса разворачивается: босс, HP, удары статусов. Клик — карта или арена</small></div><div class="wk-btns">${[['off','Скрыть'],['on','Показать']].map(([v,t])=>`<button class="wk-btn ${(S.dwin!==false)===(v==='on')?'pri':''}" data-dwin="${v}">${t}</button>`).join('')}</div></div>`;
  case'map':return`<h4>Что пишется в колонку Result</h4><p class="wk-kv">Кнопка → значение в таблице. Меняй, только если поменял выпадающий список в таблице.</p><div class="wk-map">${d.mapping().map(b=>`<label>${b.key} · ${esc(b.name)}</label><input class="wk-in" data-map="${b.i}" value="${esc(b.value)}">`).join('')}</div>
   <div class="wk-btns" style="margin-top:12px"><button class="wk-btn" data-b="mapreset">Вернуть как было</button></div>`;
  case'game':return`<h4>Игра</h4>${sw('tester',tester,'Режим тестировщика (временно)','Звонки не идут, статусы засчитываются кнопками (каждый звонок = разговор '+Math.round(C.testerCallSec/60)+' мин). В таблицу, файл и копии ничего не пишется, прогресс игры отдельный. Переключение перезагрузит страницу. Удалим перед релизом')}${btn('end','Закончить смену','Итог дня: звонки, разговоры, лучшая серия, выплата за 50+ звонков','Итог')}${btn('export','Скачать сохранение игры','Файл .json, ключ ct1','Скачать')}${btn('menu','Главное меню','','Выйти в меню')}
   <div class="wk-kv" style="margin-top:10px">Версия: ${esc(C.version)} · таблица хранится в старых ключах дайлера (pd2…), игра в ct1</div>`}};
 const openSettings=(s)=>{if(s)sec=s;openOv('set',`<div class="wk-wh"><h3>НАСТРОЙКИ</h3><button class="wk-x" id="s-x" title="Закрыть (Esc)"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-set"><nav class="wk-nav" id="s-nav"></nav><div class="wk-sec" id="s-sec"></div></div>`);
  $('#s-x').onclick=closeOv;setUi();
  $('#s-nav').onclick=e=>{const b=e.target.closest('[data-s]');if(b){sec=b.dataset.s;setUi()}};
  $('#s-sec').onclick=e=>{const t=e.target.closest('[data-sw],[data-b],[data-fx],[data-stm],[data-dwin]');if(!t)return;
   if(t.dataset.dwin){S.dwin=t.dataset.dwin==='on';persistGame();DW.sync();layout&&layout();setUi();return}
   if(t.dataset.sw){const k=t.dataset.sw,P=d.P,on=!t.classList.contains('on');({auto:()=>d.setAuto(on),only:()=>d.setOnly(on),hos:()=>d.setPref('hangupOnStatus',on),hsk:()=>d.setPref('hangupOnSkip',on),guard:()=>d.setPref('guard',on),
     zemb:()=>{d.zoom.setEnabled(on);toast(on?'Встроенный Zoom включён: перезагрузи страницу':'Встроенный Zoom выключен: звонки через приложение');banner()},zwin:()=>{d.zoom.setShown(on);zoomUi()},tester:()=>setTester(on),snd:()=>{P.mute=!on;d.sp();SFX.setMute(!on);if(on)SFX.snd('tick')}})[k]();setUi();return}
   if(t.dataset.stm){S.storyMode=t.dataset.stm;persistGame();setUi();return}
   if(t.dataset.fx){S.fx=t.dataset.fx;W.classList.toggle('fx-off',S.fx==='off');persistGame();setUi();return}
   const b=t.dataset.b;const A=({zlog:()=>copy(d.zoom.logText(),'Журнал Zoom скопирован ('+d.zoom.log.length+' событий)'),zgate:()=>{gateQuiet=true;d.zoom.startGate(15000);setUi()},zcsv:pickZoomCsv,open:()=>{closeOv();openFileDlg()},switch:()=>{closeOv();d.switchBase().then(layout)},ourl:()=>{d.openSheetUrl($('#s-url').value);closeOv()},
     gssave:async()=>{d.setSheets({url:$('#s-gs').value.trim(),token:$('#s-tok').value.trim(),on:true});$('#gs-r').textContent='Проверяю…';const r=await d.testConnection();$('#gs-r').textContent=r&&r.ok?'Связь есть ✓':'Нет связи: '+((r&&(r.error?human(r.error):r.msg))||'?')},
     gscopy:()=>copy(d.getAppsScript(),'Apps Script скопирован (с твоим словом)'),gsrnd:()=>{d.rndSecret();setUi();toast('Новое слово: обнови его и в скрипте')},pull:()=>{d.sheets.pull();toast('Обновляю из таблицы…')},
     bk:async()=>{try{const h=await showDirectoryPicker({mode:'readwrite'});await d.setBackupDir(h);toast('Папка для копий выбрана')}catch(e){}},tsv:()=>copy(d.tsv(),'База скопирована: вставь в Google Таблицу'),
     sdir:async()=>{await SFX.sndPick(kv);setUi()},mdir:async()=>{await musLoad('pick');setUi()},snames:()=>copy(SFX.sndNamesText(),'Список имён звуков скопирован'),mapreset:()=>{d.resetMap();setUi()},end:()=>{closeOv();shiftEnd()},export:()=>SM.exportFile(save),menu:()=>{if(!demo)SM.save(save);location.href=location.pathname}})[b];if(A)A()};
  $('#s-sec').oninput=e=>{const t=e.target;if(t.id==='s-vol'){const v=t.value/100;d.P.vol=v;d.sp();SFX.setVol(v);t.style.setProperty('--v',t.value+'%');volUi()}if(t.dataset.map!=null)d.setMap(+t.dataset.map,t.value);
   if(t.id==='s-gs'){d.P.sheets.url=t.value.trim();d.sp()}if(t.id==='s-tok'){d.P.sheets.token=t.value.trim();d.sp()}if(t.id==='s-url'){d.P.lastSheetUrl=t.value.trim();d.sp()}}};
 const setUi=()=>{$('#s-nav').innerHTML=SECS.map(([k,t])=>`<button data-s="${k}" class="${k===sec?'on':''}">${t}</button>`).join('');$('#s-sec').innerHTML=secHtml()};
 const copy=(txt,msg)=>{(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(msg)).catch(()=>{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast(msg)})};
 const pickZoomCsv=()=>{const i=document.createElement('input');i.type='file';i.accept='.csv';i.onchange=async()=>{const f=i.files[0];if(!f)return;const z=parseZoomHistory(await f.text()),r=$('#zcsv-r');
  if(!z.ok){r.textContent='Это не история звонков Zoom';return}const out=z.calls.filter(c=>c.dir==='out'),talk=out.filter(c=>c.dur>=60).length;
  r.innerHTML=`Звонков: <b>${z.calls.length}</b> (исходящих ${out.length}) · разговоров от 1 мин: <b>${talk}</b> · самый долгий: <b>${mmss(Math.max(0,...out.map(c=>c.dur)))}</b><br>${viaApp(z.devices)?'⚠ Звонки шли через приложение Zoom ('+esc(z.devices.join(', '))+'): браузер их не видел. Звони через встроенный телефон.':'Звонки через встроенный телефон ✓'}`};i.click()};
 // --- итог смены
 const shiftEnd=()=>{const r=endShift(save,ses.G,now());persistGame();setTimeout(stFlush,1500);openOv('end',`<div class="wk-wh"><h3>ИТОГ СМЕНЫ</h3><button class="wk-x" id="e-x"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-wb">
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
 setInterval(()=>{d.tick();hud()},250);
 // местное время контакта идёт само: раз в 10 с обновляем только чип времени (карточку не перерисовываем)
 const ltTick=()=>{const c=document.querySelector('#lead .wk-chip.time');if(!c)return;const v=d.view(),lt=v.lead&&v.lead.local;if(!lt)return;
  const t=`у них ${lt.time} ${lt.tz}`;if(c.textContent!==t)c.textContent=t;c.classList.toggle('off',!lt.work)};
 setInterval(ltTick,10000);addEventListener('visibilitychange',()=>{if(!document.hidden)ltTick()});setInterval(tempoUi,5000);addEventListener('resize',padW);
 if(!demo)SM.install(()=>save);addEventListener('beforeunload',()=>{d.flush&&d.flush()});
 if(demo){d.zoom.ready=true;d.zoom.gate='ready'}else if(tester)fakeZoom();else if(d.zoom.enabled)d.zoom.startGate(15000);
 return{d,ses,save,act,openSettings,openPicker,toast,hud,layout,gateWin,shiftEnd,zp,CC,MAP,STORY,story,ARENA,BASE,au,MUS,DW,TUT,tutOpen}}
