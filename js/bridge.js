// Мост «игра ↔ существующий дайлер». Дайлер не переписывается: мы оборачиваем его функции и слушаем его же события Zoom.
import {EventBus} from './eventbus.js';import {CONFIG as C,districtThr} from './config.js';import {newState,undo,pause as gPause,resume as gResume,bossState} from './engine.js';
import {ZoomProvider,ManualProvider} from './providers.js';import {statusFlow,lateLog} from './flow.js';import {guard} from './leadsource.js';import {DIST,newMeta} from './meta.js';import {record,unrecord,dominance,rankOf,levelOf,nextRank,RANKS,LEVELS,dayKey} from './stats.js';import {ACH,evaluate} from './achv.js';import {FX,countUp} from './fx.js';import {AudioController} from './audio.js';import {Music} from './music.js';import {DIR,PERKS,modsFor,ensureDir,dailyMissions,checkMissions,shiftReport,endShift,buyPerk,applyPerks} from './missions.js';import {mountDock} from './dock.js';import {SaveManager} from './save.js';
const bus=new EventBus(),zp=new ZoomProvider(bus),mp=new ManualProvider(bus),root=SaveManager.load(),W=window,$=s=>document.querySelector(s);
root.meta=Object.assign(newMeta(),root.meta||{});const meta=root.meta;
let G=root.game&&Array.isArray(root.game.undo)?root.game:newState(Date.now());
const save=()=>{root.game=G;SaveManager.soon(root)};SaveManager.install(()=>root);
// zoom (приоритет) + ручной набор; статус закрывает оба
const combo={takeCall(now){const z=zp.takeCall(now),m=mp.takeCall(now);return z&&(!m||z.ringing>=m.ringing-15000)?z:m},
 bind(id,st){for(const p of[zp,mp]){const c=p.takeCall(Infinity);if(c)p.bind(c.id,st)}},health:()=>zp.health()};
const key=l=>String(ph(l)).replace(/\D/g,'').slice(-10);
const drop=k=>{for(let i=G.undo.length-1;i>=0;i--)if(G.undo[i].lead===k){const u=G.undo[i];unrecord(root,u);root.trophies=(root.trophies||[]).filter(t=>t.lead!==k||t.sealed);undo(G,Date.now(),i);break}};
const O={setRes:W.setRes,dial:W.dial,clr:W.clr,pause:W.pause,advance:W.advance,back:W.back};
function toast2(t,c){const w=document.getElementById('ctg-ts')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'ctg-ts'}),e=document.createElement('div');e.className='ctg-t '+(c||'');e.textContent=t;w.appendChild(e);setTimeout(()=>e.remove(),5200)}
function after(r,kk,l){const now=Date.now(),L=root.life||{},sb=L.since||0,ev=r.ev;if(ev.re||ev.spam)return;const d=record(root,{...ev,x:ev.x,m:ev.m},now,G.streak);if(!d)return;
 if(ev.cls==='BOOKED'||ev.cls==='DISCOVERY')(root.trophies||(root.trophies=[])).push({id:'t'+now,kind:ev.cls==='BOOKED'?'gold':'platinum',company:get(l,'Business')||'?',state:get(l,'State')||'',t:now,lead:kk,sealed:0});
 const dm=dominance(root,now),rk=rankOf(dm.pts),lv=levelOf(G.lifeXp);if(dm.idle)root.wasNobody=1;
 if(root.rank!=null&&rk>root.rank)banner('РАНГ: '+RANKS[rk][1],'gold');if(root.lvl!=null&&lv>root.lvl)banner('УРОВЕНЬ '+(lv+1)+': '+LEVELS[lv][1],'gold');
 const got=evaluate({root,G,ev,now,d,L:root.life,rank:rk,meta,lvl:lv,sinceBefore:sb});got.forEach(a=>toast2('🏆 '+a.n+' — '+a.h,a.r==='l'?'gold':a.r==='r'?'red':''));if(got.some(a=>a.id==='ret'))root.wasNobody=0;root.rank=rk;root.lvl=lv;checkMissions(root,G,now).forEach(m=>toast2('✅ Задание: '+m.name+' · +$'+m.money,'gold'))}
W.setRes=function(k){const l=curL;if(!l)return O.setRes(k);const had=res(l),clear=had&&had===val(k);
 if(!clear){const kk=key(l);if(had)drop(kk);const tn=Date.now(),dd=root.dir&&root.dir.k===dayKey(tn)?root.dir.pick:null,r=statusFlow(G,k,tn,combo,{phone:ph(l)},{re:!!had,mods:modsFor(dd||'',(root.days&&root.days[dayKey(tn)]||{n:0}).n)});if(r.entry)r.entry.lead=kk;if(r.ev){after(r,kk,l);bus.emit('status',r.ev);save()}}
 const out=O.setRes(k);try{zSug=-1}catch(e){}return out};
W.clr=function(l){if(l&&res(l)){drop(key(l));save()}return O.clr(l)};
W.dial=function(){const l=curL;if(l&&ph(l))mp.ring(ph(l));return O.dial()};
W.pause=function(){const r=O.pause.apply(this,arguments);S.paused?gPause(G,Date.now()):gResume(G,Date.now());save();return r};
W.advance=function(){try{zSug=-1}catch(e){}return O.advance.apply(this,arguments)};W.back=function(){try{zSug=-1}catch(e){}return O.back.apply(this,arguments)};
addEventListener('message',e=>{if(e.origin!==ZO)return;const d=e.data;if(d&&d.type)zp.feed({type:d.type,data:d.data})});
bus.on('callLogged',e=>{const r=lateLog(G,e.callId,e.duration,Date.now());if(r&&(r.bonus.x||r.bonus.m)){float('+'+r.bonus.x+' XP за разговор','xp');save()}});
// Enter подтверждает подсказку статуса (только если она есть); T в меню «Ещё статусы» = DISCOVERY
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||S.modal||!curL)return;
 if(e.code==='Enter'&&zSug>=0){e.preventDefault();e.stopImmediatePropagation();W.setRes(zSug)}
 else if(e.code==='KeyT'&&S.more){e.preventDefault();e.stopImmediatePropagation();W.setRes(14)}},true);
// ---- панель игры над старым HUD ----
const bar=document.createElement('div');bar.id='ctg';bar.innerHTML='<span class="m"><i>$</i><b id="ctg-mo">0</b></span><span class="x"><i>XP</i><b id="ctg-xp">0</b></span><span id="ctg-d"></span><span id="ctg-h"></span><span id="ctg-t"></span><span id="ctg-z" title="Здоровье событий Zoom"></span><span id="ctg-r"></span><label class="sl" title="SFX">🔊<input id="ctg-sfx" type="range" min="0" max="100"></label><label class="sl" title="Music (Shift+M — мьют)">🎵<input id="ctg-mus" type="range" min="0" max="100"></label><button id="ctg-gb" title="THE GRID / HEADQUARTERS">GRID / HQ</button><div class="bs"><u id="ctg-b"></u></div>';
(document.getElementById('hud')||document.body.firstChild).before(bar);
const f=n=>Math.round(n).toLocaleString('ru-RU'),clock=ms=>{const s=Math.max(0,ms/1000|0);return(s/60|0)+':'+String(s%60).padStart(2,'0')};
function float(t,c){const cd=$('.card'),r=cd?cd.getBoundingClientRect():{left:innerWidth/2,top:200,width:0};const e=document.createElement('span');e.className='ctf '+c;e.textContent=t;e.style.left=(r.left+r.width/2+Math.random()*120-60)+'px';e.style.top=(r.top+40)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1200)}
bus.on('status',e=>{if(e.re)return float('смена статуса','bad');if(e.spam)float('спам x0.5','bad');float('+'+e.x+' XP','xp');float('+$'+e.m,'mo');if(e.pen==='drop')float('HEAT ▼','bad');if(e.pen==='reset')float('СЕРИЯ СГОРЕЛА','bad');if(e.odStart)float('OVERDRIVE','bad');if(e.captured)float('РАЙОН ЗАХВАЧЕН','mo')});
setInterval(()=>{const now=Date.now(),s=G,d=C.districts[s.district-1],thr=districtThr(s.district),od=s.od&&now<s.od.until,mm=s.ulta>0||od?2:C.heat.money[s.step],el=s.last==null?0:(s.paused!=null?s.paused:now)-s.last;
 document.body.dataset.heat=od||s.ulta>0?3:s.step;document.body.dataset.od=od?1:0;document.body.dataset.boss=bossState(s);
 countUp($('#ctg-mo'),s.money);countUp($('#ctg-xp'),s.lifeXp);$('#ctg-d').textContent=!S.L.length?'NO TARGET LIST LOADED':d[1]+' '+Math.min(100,s.dxp/thr*100|0)+'%';
 $('#ctg-h').textContent=od?'OVERDRIVE '+clock(s.od.until-now):'$ x'+mm.toFixed(2)+' · XP x'+(1+(mm-1)*C.heat.xpShare).toFixed(2)+(s.ulta>0?' · ULTA '+s.ulta:'');
 $('#ctg-t').textContent=s.last==null?'':clock(el)+' '+(el<C.fastSec*1000?'SPRINT':el<C.maxGapMin*60000?'TALK':'СЕРИЯ СГОРАЕТ');
 const h=zp.health();$('#ctg-z').textContent=zp.ready||zp.calls.size?'Zoom '+({green:'●',yellow:'◐',red:'○'}[h.state]):'';$('#ctg-b').style.width=Math.min(100,s.dxp/thr*100)+'%'},250);
W.GAME={G:()=>G,bus,zp,mp,SaveManager,root};            // для Debug и отладки из консоли

// ---- Guard: проверка таблицы после загрузки. Пока окно открыто, игра на паузе (серия не горит) ----
const ov=document.createElement('div');ov.id='ctg-ov';ov.hidden=true;document.body.appendChild(ov);let gk='',blocked=false;
const show=(g,fp)=>{blocked=true;gPause(G,Date.now());ov.hidden=false;
 ov.innerHTML=`<div class="bx"><h1>${g.code==='exhausted'?'TERRITORY EXHAUSTED':g.code==='broken'?'BROKEN TARGET LIST':'ДРУГАЯ ТАБЛИЦА'}</h1><p>${g.msg}</p><div>${g.code==='different'?'<button id="g1">Продолжить с этой таблицей</button>':g.code==='exhausted'?'<button id="g1">Закрыть</button>':''}<button id="g2">Загрузить другую</button></div></div>`;
 const close=()=>{ov.hidden=true;blocked=false;gResume(G,Date.now())};
 const b1=ov.querySelector('#g1');if(b1)b1.onclick=()=>{if(fp){root.fingerprint=fp;save()}close()};ov.querySelector('#g2').onclick=()=>{close();try{pick()}catch(e){}}};
setInterval(()=>{if(!S.L.length){gk='';return}
 const k=S.name+'|'+S.L.length+'|'+(S.src?S.src.id+S.src.gid:'');if(k===gk||blocked)return;gk=k;
 const g=guard(root.fingerprint,{name:S.name,head:S.h,rows:S.L.map(l=>({phone:ph(l),result:res(l)}))});
 if(g.ok){root.fingerprint=g.fp;save()}else show(g,g.fp)},1000);

// ---- Фаза 2: THE GRID / HQ, босс, захват района, темы ----
let EXT=null;const dock=mountDock(document.body,()=>G,meta,save,bus,{html:t=>EXT?EXT.html(t):null,bind:(e,r)=>EXT&&EXT.bind(e,r)});document.getElementById('ctg-gb').onclick=()=>dock.toggle();
const banner=(t,c)=>{const e=document.createElement('div');e.className='ctg-bn '+(c||'');e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),3800)};
bus.on('purchase',it=>{root.life=root.life||{};root.life.spent=(root.life.spent||0)+it.price;float('−$'+f(it.price)+' '+it.name,'mo');save()});
bus.on('status',e=>{if(e.immune)float('IMMUNE','bad');const d=G.district,ph=bossState(G);
 if(e.captured){document.body.classList.add('ctg-flash');setTimeout(()=>document.body.classList.remove('ctg-flash'),900);banner('РАЙОН ЗАХВАЧЕН: '+DIST[Math.max(0,d-2)][0]+(d>1?' → '+DIST[d-1][0]:''),'gold');meta.captured[d-1]=Date.now();return}
 if(ph==='boss'&&!meta.bossIntro[d]&&d>=1){meta.bossIntro[d]=1;banner('BOSS PHASE: победи '+DIST[d-1][3]+'. '+(d>=C.finishFromDistrict?'Финальный удар требует РАЗГОВОРА С ЛПР':'Добей босса'),'red')}
 if(ph==='finish'&&!meta.staggered[d]){meta.staggered[d]=1;banner('FINISH HIM — нужен разговор с ЛПР (Talk / Call Back / Booked / Discovery)','gold')}});
setInterval(()=>{const d=DIST[G.district-1];document.body.dataset.theme=d[2];document.body.dataset.district=G.district;document.body.style.setProperty('--acc',d[1])},500);

// ---- Фаза 3: ранг, уровень, ачивки, трофеи, данные ----
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const emblem=i=>`<svg class="emb e${i}" viewBox="0 0 90 90" width="84" height="84"><path d="M45 6 L80 20 V48 Q80 72 45 86 Q10 72 10 48 V20Z" fill="#0a0d0a" stroke="currentColor" stroke-width="3"/>${Array.from({length:Math.max(1,i)},(_,k)=>`<path d="M26 ${34+k*10} L45 ${24+k*10} L64 ${34+k*10}" fill="none" stroke="currentColor" stroke-width="4"/>`).join('')}${i===0?'<path d="M30 40 L60 62 M60 40 L30 62" stroke="currentColor" stroke-width="3"/>':''}</svg>`;
let rep=null;applyPerks(root);
 const ST=root.settings=Object.assign({sfx:.7,music:.3,fx:'full',crt:true,trail:false,shake:1,tick:true},root.settings||{});
const ext={html(tab){const now=Date.now();
 if(tab==='set'){const sg=(k,v,l)=>`<button data-st="${k}:${v}" class="${String(ST[k])===String(v)?'on':''}">${l}</button>`,ck=(k,l)=>`<label><input type="checkbox" data-ck="${k}" ${ST[k]?'checked':''}> ${l}</label>`;
  return`<div class="dc"><b>ЭФФЕКТЫ</b><div class="sg">${sg('fx','off','Off')}${sg('fx','low','Low')}${sg('fx','full','Full')}</div><div>Тряска: <span class="sg">${sg('shake',0,'0')}${sg('shake',.5,'50%')}${sg('shake',1,'100%')}</span></div><div>${ck('crt','CRT-сканлайны')} ${ck('trail','След курсора')} ${ck('tick','Тик серии (питч)')}</div></div><div class="dc"><b>МУЗЫКА</b><div>Источник: <b>${mu.lib?'файлы ('+Object.values(mu.pools).reduce((a,x)=>a+x.length,0)+' тр.)':'синтез-эмбиент'}</b></div><p><button id="ctg-mf">Локальная папка…</button> <button id="ctg-mm">Загрузить manifest</button></p><small>assets/audio/manifest.json или папка industrial/calm, neon/action, stingers…</small></div><div class="dc"><b>ХРАНЕНИЕ</b><div>Адрес игры: ${location.origin}${location.pathname}<br>Открывай всегда с одного URL: у Zoom-окна и обычного Chrome разные хранилища.</div><p><button id="ctg-rs">Сбросить прогресс…</button></p></div>`}
 if(tab==='mis'){const dir=ensureDir(root,now),d=(root.days||{})[dayKey(now)]||{n:0,c:{}},got=(root.mdone||{})[dayKey(now)]||{},L=root.legacy||{pts:0,perks:{}};
  return`<div class="dc"><b>ДИРЕКТИВА ДНЯ</b>${dir.pick?`<div>${DIR.find(x=>x[0]===dir.pick)[1]} — ${DIR.find(x=>x[0]===dir.pick)[2]}</div>`:dir.opts.map(id=>{const x=DIR.find(y=>y[0]===id);return`<div class="dr"><span>${x[1]} <small>${x[2]}</small></span><button data-dir="${id}">выбрать</button></div>`}).join('')}</div><div class="dc"><b>ЗАДАНИЯ ДНЯ</b></div>`+dailyMissions(now).map(m=>`<div class="dr"><span>${got[m[0]]?'✅ ':''}${m[1]} <small>${Math.min(m[3],m[2](d))}/${m[3]}</small></span></div>`).join('')+`<div class="dc"><button id="ctg-es">END SHIFT</button>${rep?`<pre>Звонков: ${rep.calls} · разговоров: ${rep.talks} (${rep.talkShare}%)\nBooked: ${rep.booked} · Discovery: ${rep.disc}\nЛучшая серия: ${rep.bestStreak} · Overdrive: ${rep.od}\nВремя: ${rep.minutes} мин · XP ${rep.xp} · $${rep.money}\nВчера: ${rep.yesterday?rep.yesterday.n+' зв. / '+rep.yesterday.xp+' XP':'—'}\nСреднее 7 дн.: ${rep.avg7?rep.avg7.n+' зв. / '+rep.avg7.xp+' XP':'—'}\nАчивок сегодня: ${rep.ach}\n${rep.again?'Смена уже закрыта сегодня':'Выплата за смену: $'+rep.paid+' · Legacy +'+rep.lp}</pre>`:''}</div><div class="dc"><b>LEGACY</b> · очков: ${L.pts}</div>`+PERKS.map(p=>`<div class="dr"><span>${p[1]} <small>${p[2]}</small></span>${L.perks[p[0]]?'<em>ЕСТЬ</em>':`<button data-perk="${p[0]}">${p[3]} оч.</button>`}</div>`).join('')}
 if(tab==='rank'){const dm=dominance(root,now),rk=rankOf(dm.pts),nx=nextRank(dm.pts),lv=levelOf(G.lifeXp),days=[...Array(7)].map((_,i)=>{const k=dayKey(now-(6-i)*864e5);return(root.days&&root.days[k]||{n:0}).n});const mx=Math.max(100,...days);
  return`<div class="dc"><div class="rkb ${dm.idle?'off':''}">${emblem(rk)}<div><div class="rkn rk${rk}">${RANKS[rk][1]}</div><div>${dm.pts} очков за 3 рабочих дня</div><div>${dm.idle?'БАЗА ОБЕСТОЧЕНА — позвони, чтобы вернуться':nx?'ещё '+nx.left+' до '+nx.name:'максимальный ранг'}</div></div></div><div class="hist">${days.map(n=>`<u title="${n}" style="height:${Math.max(2,n/mx*60)}px"></u>`).join('')}</div></div>
  <div class="dc"><b>LVL ${lv+1}: ${LEVELS[lv][1]}</b><div>${Math.round(G.lifeXp).toLocaleString('ru-RU')} XP${lv<14?' / '+LEVELS[lv+1][0].toLocaleString('ru-RU'):''}</div></div><div class="dc"><b>ДОСТИЖЕНИЯ ${Object.keys(root.ach||{}).length}/${ACH.length}</b></div>`+
  ACH.map(a=>{const g=(root.ach||{})[a.id];return`<div class="dr ach ${a.r}${g?' on':''}"><span>${g?esc(a.n):'???'} <small>${esc(a.h)}</small></span><em>${a.r==='l'?'ЛЕГ.':a.r==='r'?'РЕДК.':''}</em></div>`}).join('')}
 if(tab==='tro'){const T=[...(root.trophies||[])].reverse();return`<div class="dc"><b>СТЕНА ТРОФЕЕВ</b> · не запечатано: ${T.filter(t=>!t.sealed).length}</div>`+(T.length?T.map(t=>`<div class="tr ${t.kind}${t.sealed?' sealed':''}"><b>${t.kind==='gold'?'🥇 ЗОЛОТАЯ':'💠 ПЛАТИНОВАЯ'}</b> ${esc(t.company)} ${esc(t.state)}<small> ${new Date(t.t).toLocaleDateString('ru-RU')}</small>${t.sealed?`<div>${esc(t.when||t.report||'')}</div>`:`<div>НЕ ЗАПЕЧАТАНА</div>${t.kind==='gold'?`<input type="datetime-local" data-f="${t.id}">`:`<textarea data-f="${t.id}" placeholder="Отчёт: минимум 5 слов (о чём говорили, итог)"></textarea>`}<button data-seal="${t.id}">Запечатать</button><span class="er" data-e="${t.id}"></span>`}</div>`).join(''):'<div class="dc">Пока пусто: каждый CALL BOOKED станет золотой картой.</div>')}
 if(tab==='dat'){const m=SaveManager.lastMirror;return`<div class="dc"><b>ДАННЫЕ</b><div>Всё хранится в браузере и дублируется в резерв IndexedDB (7 дневных копий).${m?'<br>Последний резерв: '+new Date(m).toLocaleTimeString('ru-RU'):''}</div><p><button id="ctg-ex">Скачать сохранение</button></p><p><label>Загрузить сохранение <input type="file" id="ctg-im" accept=".json" hidden><button id="ctg-imb">Выбрать файл</button></label></p><div id="ctg-dm"></div></div>`}
 return null},
 bind(el,rerender){el.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const[k,v]=b.dataset.st.split(':');ST[k]=isNaN(v)?v:+v;applySet();save();rerender()});el.querySelectorAll('[data-ck]').forEach(c=>c.onchange=()=>{ST[c.dataset.ck]=c.checked;applySet();save()});const mf=el.querySelector('#ctg-mf');if(mf){mf.onclick=async()=>{try{const n=await mu.fromFolder();toast2('Музыка: найдено треков '+n,'gold');startAudio();mu.start();au.synth=false}catch(e){toast2('Папка не выбрана','red')}rerender()};el.querySelector('#ctg-mm').onclick=async()=>{try{await mu.fromManifest('assets/audio/manifest.json');startAudio();mu.start();au.synth=false;toast2('manifest загружен','gold')}catch(e){toast2('manifest.json не найден','red')}rerender()};el.querySelector('#ctg-rs').onclick=()=>{if(confirm('Сбросить ВЕСЬ прогресс? Сначала скачай сохранение во вкладке DATA.')&&confirm('Точно? Это необратимо.')){localStorage.removeItem('ct1');localStorage.removeItem('ct1_bak');location.reload()}}}
el.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{ensureDir(root,Date.now()).pick=b.dataset.dir;save();rerender()});el.querySelectorAll('[data-perk]').forEach(b=>b.onclick=()=>{const r=buyPerk(root,b.dataset.perk);if(r.ok)save();rerender()});const es=el.querySelector('#ctg-es');if(es)es.onclick=()=>{rep=endShift(root,G,Date.now());save();rerender();toast2('Смена закрыта','gold')};
el.querySelectorAll('[data-seal]').forEach(b=>b.onclick=()=>{const id=b.dataset.seal,t=root.trophies.find(x=>x.id===id),v=el.querySelector(`[data-f="${id}"]`).value.trim(),er=el.querySelector(`[data-e="${id}"]`);
   if(t.kind==='gold'){if(!v)return er.textContent=' укажи дату и время встречи';t.when=new Date(v).toLocaleString('ru-RU')}else{if(v.split(/\s+/).filter(Boolean).length<5)return er.textContent=' нужно минимум 5 слов';t.report=v}
   t.sealed=Date.now();save();rerender();toast2('Трофей запечатан: '+t.company,'gold')});
  const ex=el.querySelector('#ctg-ex');if(ex)ex.onclick=()=>SaveManager.exportFile(root);const imb=el.querySelector('#ctg-imb'),im=el.querySelector('#ctg-im');
  if(imb){imb.onclick=()=>im.click();im.onchange=async()=>{try{const r=SaveManager.parseImport(await im.files[0].text());if(!confirm('Заменить текущее сохранение загруженным?'))return;SaveManager.save(r);location.reload()}catch(e){el.querySelector('#ctg-dm').textContent=e.message}}}}};
EXT=ext;
setInterval(()=>{const dm=dominance(root,Date.now()),rk=rankOf(dm.pts),un=(root.trophies||[]).filter(t=>!t.sealed).length;document.getElementById('ctg-r').textContent=RANKS[rk][1]+' · LVL '+(levelOf(G.lifeXp)+1)+(un?' · 🏆'+un:'')},1000);
SaveManager.persist();setInterval(()=>SaveManager.mirror(root),60000);setTimeout(()=>SaveManager.mirror(root),3000);
(async()=>{if(root.game)return;const b=await SaveManager.latest();if(b&&confirm('Найден резерв прогресса от '+new Date(b.t).toLocaleString('ru-RU')+'. Восстановить?')){SaveManager.save(JSON.parse(b.j));location.reload()}})();

// ---- Фаза 4: juice, звук, музыка, CRT, настройки ----
const fx=new FX(),au=new AudioController(bus),mu=new Music(bus);au.sfxStatus=false;au.synth=true;
const TR={'trail-cyan':'#00ffff','trail-magenta':'#ff2bd6','trail-gold':'#ffc400','trail-red':'#ff3b3b'};
function applySet(){fx.lvl=ST.fx;fx.shakeK=ST.shake;document.body.classList.toggle('ctg-crt',!!ST.crt);au.clickOn=!!ST.tick;au.v.sfx=ST.sfx;au.v.music=ST.music;bus.emit('volume',{sfx:ST.sfx,music:ST.music});
 const own=Object.keys(meta.owned).filter(k=>TR[k]).pop();fx.trail=ST.trail?(own?TR[own]:getComputedStyle(document.body).getPropertyValue('--acc')||'#39ff14'):null;
 $('#ctg-sfx').value=ST.sfx*100;$('#ctg-mus').value=ST.music*100}
let started=false;function startAudio(){if(!started){started=true;au.init();mu.init(au.ctx);mu.fromManifest('assets/audio/manifest.json').then(ok=>{if(ok){au.synth=false;mu.start()}}).catch(()=>{});mu.reconnect().then(n=>{if(n){au.synth=false;mu.start();toast2('Музыка подключена: '+n+' тр.','gold')}}).catch(()=>{})}}
addEventListener('pointerdown',startAudio,{once:true});addEventListener('keydown',startAudio,{once:true});
$('#ctg-sfx').oninput=e=>{ST.sfx=e.target.value/100;applySet();save()};$('#ctg-mus').oninput=e=>{ST.music=e.target.value/100;applySet();save()};
let mm=null;addEventListener('keydown',e=>{if(e.shiftKey&&e.code==='KeyM'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();e.stopImmediatePropagation();if(mm==null){mm=ST.music;ST.music=0}else{ST.music=mm;mm=null}applySet()}},true);
const cc=()=>{const c=$('.card'),r=c?c.getBoundingClientRect():{left:innerWidth/2,top:260,width:0,height:0};return{x:r.left+r.width/2,y:r.top+r.height/2}};
bus.on('status',e=>{if(e.re)return;const{x,y}=cc(),W2=['BOOKED','DISCOVERY'].includes(e.cls),acc=getComputedStyle(document.body).getPropertyValue('--acc')||'#39ff14';
 if(W2){fx.burst(x,y,70,['#ffc400','#ffd45a','#fff','#ff2bd6']);fx.shake(.7);fx.hitstop(110);fx.dim(700);fx.pulse();mu.stinger()}
 else if(e.cls==='TALK'){fx.shake(.35);fx.pulse();document.body.classList.add('ctg-gl');setTimeout(()=>document.body.classList.remove('ctg-gl'),220);fx.burst(x,y,24,['#ff1f3d','#ff2bd6'])}
 else{fx.burst(x,y,10,['#4d6b49','#7a8a76']);fx.shake(.1)}
 if(e.captured){fx.shake(.8);fx.burst(x,y,100,[acc,'#fff','#ffc400']);fx.stamp('CAPTURED','gold');mu.stinger()}
 if(e.odStart){fx.shake(.5);fx.pulse()}
 if(e.pen==='reset'){document.body.classList.add('ctg-pd');setTimeout(()=>document.body.classList.remove('ctg-pd'),1300)}});
bus.on('purchase',()=>{au.tone(1568,.1,'square',.15);setTimeout(()=>au.tone(2093,.25,'square',.15),90)});
const TM={industrial:'industrial',neon:'neon',chrome:'neon',blackgold:'blackgold',orbital:'blackgold'};
setInterval(()=>{const now=Date.now(),od=G.od&&now<G.od.until;mu.setCtx({paused:G.paused!=null||(S&&S.paused),od,step:G.step,ulta:G.ulta>0,theme:TM[DIST[G.district-1][2]]})},1000);
applySet();
if(root.origin&&root.origin!==location.origin)toast2('⚠ Игра открыта с другого адреса: прогресс лежит в другом хранилище','red');root.origin=location.origin;
setTimeout(()=>{if(G.lifeXp>0&&Date.now()-(root.lastExport||0)>7*864e5)toast2('Напоминание: скачай сохранение (GRID / HQ → DATA)','gold')},4000);
const _ex=SaveManager.exportFile.bind(SaveManager);SaveManager.exportFile=r=>{root.lastExport=Date.now();save();_ex(r)};
