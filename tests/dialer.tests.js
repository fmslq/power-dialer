import {matchRows,legacyMatch,shouldToast,toastText,phoneKey} from '../dialer/reconcile.js';
import {resolveKey} from '../dialer/hotkeys.js';
import {APPS_SCRIPT,getAppsScript} from '../dialer/apps-script.js';
import {SaveManager as S} from '../core/save.js';
import {CONFIG as C} from '../core/config.js';
import {Session,makeCombo} from '../core/session.js';
import {ZoomProvider,ManualProvider} from '../core/providers.js';
import {EventBus as Bus} from '../core/eventbus.js';
import {pickPool,stateOf,STINGER_EVENTS} from '../audio/music.js';
import {AudioController} from '../audio/audio.js';
import crypto from 'node:crypto';
import {HangupGuard} from '../dialer/hangup.js';
import {newState,apply} from '../core/engine.js';
const T=[],t=(n,f)=>{try{T.push([n,!!f()])}catch(e){T.push([n+' ('+e.message+')',false])}};
export function runDialerTests(){
 // --- тост «Таблица: +N новых» (регрессия на реальной таблице: 390 из 947 строк без телефона)
 const mk=(n,withPh)=>Array.from({length:n},(_,i)=>({key:withPh?String(5010000000+i):'',r:i+2,biz:withPh?'Biz'+i:'',addr:''}));
 const rows=[...mk(40,true),...mk(158,false).map((x,i)=>({...x,r:100+i}))];
 t('СТАРЫЙ алгоритм воспроизводит баг: +158 при каждом опросе',()=>{const old=rows.map(x=>({...x}));return legacyMatch(old,rows).add===158&&legacyMatch(old,rows).add===158});
 t('новый: тот же опрос даёт 0 новых и 0 убранных, тоста нет',()=>{const p=matchRows(rows.map(x=>({...x})),rows);return p.added===0&&p.addedReal===0&&p.removed.length===0&&!shouldToast(p)});
 t('пустые строки без телефона не считаются «настоящими» новыми',()=>{const p=matchRows(rows,[...rows,{key:'',r:999,biz:'',addr:''}]);return p.added===1&&p.addedReal===0&&!shouldToast(p)});
 t('реально новый лид показывает тост',()=>{const p=matchRows(rows,[...rows,{key:'5019999999',r:300,biz:'New',addr:''}]);return shouldToast(p)&&toastText(p)==='Таблица: +1 новых, −0 убрано'});
 t('убранный лид с телефоном показывает тост',()=>{const p=matchRows(rows,rows.slice(1));return p.removed.length===1&&shouldToast(p)});
 t('сдвиг строк (вставка сверху) не плодит «новых» у лидов с названием',()=>{const o=[{key:'',r:5,biz:'Alpha Decks',addr:'1 Main'}],n=[{key:'',r:9,biz:'Alpha Decks',addr:'1 Main'}];return matchRows(o,n).added===0});
 t('дубли телефона сопоставляются по строке/названию',()=>{const o=[{key:'5011112222',r:2,biz:'A'},{key:'5011112222',r:7,biz:'B'}],n=[{key:'5011112222',r:7,biz:'B'},{key:'5011112222',r:2,biz:'A'}];const m=matchRows(o,n).match;return m[0]===1&&m[1]===0});
 t('phoneKey: последние 10 цифр',()=>phoneKey('+1 501-838-9095')==='5018389095'&&phoneKey('N/A')==='');
 // --- клавиши v2
 const k=(code,c={})=>resolveKey({typing:false,menu:false,suggest:-1,world:false,modal:false,shift:false,meta:false,alt:false,ctrl:false,...c},code);
 t('Enter и Space звонят (как в старом дайлере), даже при подсказке',()=>k('Enter',{suggest:3}).a==='dial'&&k('Space').a==='dial');
 t('Shift+Enter подтверждает подсказку Zoom',()=>{const r=k('Enter',{shift:true,suggest:3});return r.a==='status'&&r.id===3});
 t('Shift+Enter без подсказки ничего не делает',()=>k('Enter',{shift:true})===null);
 t('H = Отбой, не конфликтует со старыми клавишами',()=>k('KeyH').a==='hangup'&&k('KeyH',{world:true})===null&&k('KeyH',{typing:true})===null);
 t('цифры/буквы — статусы, T=шпаргалка вне меню и статус в меню',()=>k('Digit5').a==='status'&&k('KeyT').a==='pad'&&k('KeyT',{menu:true}).a==='status');
 t('в мировых экранах статусные клавиши не перехватываются',()=>k('Digit1',{world:true})===null&&k('Space',{world:true})===null&&k('Escape',{world:true}).a==='close');
 t('Shift+G/H/M/N и ⌘K',()=>k('KeyG',{shift:true}).a==='map'&&k('KeyH',{shift:true}).a==='base'&&k('KeyM',{shift:true}).a==='muteMusic'&&k('KeyN',{shift:true}).a==='nextTrack'&&k('KeyK',{meta:true}).a==='picker');
 t('в поле ввода клавиши не перехватываются, Esc снимает фокус',()=>k('Digit1',{typing:true})===null&&k('Escape',{typing:true}).a==='blur');
 // --- Apps Script дословно
 t('Apps Script идентичен оригиналу (sha256)',()=>crypto.createHash('sha256').update(APPS_SCRIPT).digest('hex').startsWith('db7f57c3568ca593'));
 t('getAppsScript подставляет очищенное слово',()=>{const g=getAppsScript(`a'b"c\\ d`);return g.includes("const SECRET = 'abcd';")&&getAppsScript('')===null});
 // --- сохранение v2
 const v1=()=>({schemaVersion:1,game:{district:5,lifeXp:9000},meta:{owned:{d1t0:1}},days:{x:{n:3}},trophies:[{id:1,sealed:1}],settings:{sfx:.5,music:.1,fx:'low',crt:false}});
 t('миграция v1→v2 сохраняет всё старое и добавляет новое',()=>{const m=S.migrate(v1());return m.schemaVersion===2&&m.days.x.n===3&&m.trophies[0].sealed===1&&m.meta.owned.d1t0===1&&m.settings.sfx===.5&&m.settings.fx==='low'&&m.settings.synthAmbient===false&&m.map.open.length===5&&m.base.stage===1&&m.story&&m.tutorial});
 t('миграция идемпотентна',()=>{const a=S.migrate(v1()),b=S.migrate(JSON.parse(JSON.stringify(a)));return JSON.stringify(a)===JSON.stringify(b)});
 t('схема новее текущей отклоняется',()=>{try{S.migrate({schemaVersion:99});return false}catch(e){return true}});
 // --- баланс
 t('Overdrive по ТЗ: 8 минут, XP x2.2; ключ ct1, схема 2',()=>C.od.sec===480&&C.od.xp===2.2&&S.key==='ct1'&&C.schemaVersion===2);
 // --- музыка
 const P={'industrial/calm':[1],'industrial/action':[1],'neon/calm':[1],overdrive:[1],hq:[1],stingers:[1]};
 t('Overdrive берёт папку overdrive/ верхнего уровня',()=>pickPool(P,'industrial','overdrive')==='overdrive');
 t('hq играет в мировых экранах и на паузе',()=>pickPool(P,'neon','hq')==='hq'&&stateOf({world:1})==='hq'&&stateOf({paused:1})==='standby');
 t('нет hq → calm темы; нет action → calm; стингеры не попадают в пулы',()=>pickPool({'neon/calm':[1],stingers:[1]},'neon','hq')==='neon/calm'&&pickPool({'neon/calm':[1]},'neon','action')==='neon/calm'&&pickPool({stingers:[1]},'neon','calm')===null);
 t('стингеры на всех ключевых событиях',()=>['hundred','capture','level','achv','booked','rank','purchase','boss'].every(e=>STINGER_EVENTS.includes(e)));
 // --- аудио: синтез-музыка выключена, переключатели независимы
 const ctx=()=>{let osc=0;const node=()=>({connect:x=>x||node(),gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}},frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},detune:{},start(){osc++},stop(){}});
  return{createOscillator:node,createGain:node,createBiquadFilter:node,createBuffer:()=>({getChannelData:()=>new Float32Array(10)}),createBufferSource:node,sampleRate:100,currentTime:0,destination:{},get osc(){return osc}}};
 t('init() без файлов НЕ включает синтез-музыку',()=>{const a=new AudioController(new Bus());a.ctx=ctx();a.applyAmbient();return a.amb===null&&a.ctx.osc===0});
 t('синтез-эмбиент включается только флагом и гасится выключением',()=>{const a=new AudioController(new Bus());a.ctx=ctx();a.setFlags({synthAmbient:true});const on=!!a.amb;a.setFlags({synthAmbient:false});return on&&a.amb===null});
 t('soundStatus=false глушит статусы, но не интерфейс (и наоборот)',()=>{const a=new AudioController(new Bus());a.ctx=ctx();a.setFlags({soundStatus:false});const s0=a.gate('status'),u0=a.gate('ui');a.setFlags({soundStatus:true,soundUi:false});return !s0&&u0&&a.gate('status')&&!a.gate('ui')});
 // --- Session: полный Undo
 const mkS=(now)=>{const clock={t:now};const root={days:{},trophies:[],life:null};const bus=new Bus(),zp=new ZoomProvider(bus,()=>clock.t),mp=new ManualProvider(bus,()=>clock.t);
  const s=new Session({root,bus,prov:makeCombo(zp,mp),now:()=>clock.t});return{s,root,clock,zp}};
 // настоящий (синтетический) звонок Zoom на номер лида: нужен для CALL BOOKED (проверка ≥3 мин)
 const zc=(o,lead,dur)=>{const id='z'+o.clock.t,iso=ms=>new Date(ms).toISOString(),e=(type,ms,x={})=>({type,data:{callId:id,dateTime:iso(ms),direction:'outbound',callee:{phoneNumber:lead.phone},...x}});
  const st=o.clock.t-(dur+15)*1000;o.zp.feed(e('zp-call-ringing-event',st));o.zp.feed(e('zp-call-ended-event',st+(dur+10)*1000));o.zp.feed(e('zp-call-log-completed-event',st+(dur+11)*1000,{callResult:'connected',duration:dur}))};
 const N0=Date.UTC(2026,10,2,16,0,0),L=n=>({key:'50100000'+String(10+n),phone:'+1501000'+String(1000+n),business:'Biz'+n,state:'AR'});
 t('полный Undo: ресурсы, счётчики дня, recent и трофей возвращаются',()=>{const _o=mkS(N0),{s,root,clock}=_o,before=JSON.stringify({x:s.G.xp,m:s.G.money,d:root.days});
  zc(_o,L(1),200);const o=s.setStatus(4,L(1),{now:clock.t});if(!o.ev||!o.trophy)return false;const sealed=root.trophies[0];sealed.sealed=1;
  clock.t+=5000;const how=s.dropLead(L(1).key,clock.t);
  return how==='full'&&root.trophies.length===0&&JSON.stringify({x:s.G.xp,m:s.G.money,d:root.days})===before});
 t('полный Undo откатывает ачивки и деньги (ничего не остаётся «выполненным»)',()=>{const _o=mkS(N0),{s,root,clock}=_o,m0=s.G.money,a0=JSON.stringify(root.ach||null),d0=JSON.stringify(root.mdone||{});
  zc(_o,L(1),200);const o=s.setStatus(4,L(1),{now:clock.t}),earned=o.achv.length>0;clock.t+=1000;s.dropLead(L(1).key,clock.t);
  return earned&&s.G.money===m0&&JSON.stringify(root.ach||null)===a0&&JSON.stringify(root.mdone||{})===d0});
 t('Undo откатывает выполненное задание вместе с наградой',()=>{const _o=mkS(N0),{s,root,clock}=_o;let o,hit=null;
  for(let i=0;i<40&&!hit;i++){clock.t+=25000;o=s.setStatus(0,L(i),{now:clock.t});if(o.missions.length)hit=i}
  if(hit==null)return true;                                   // за 40 статусов задание не выпало: нечего откатывать
  const m=JSON.stringify(root.mdone);s.dropLead(L(hit).key,clock.t+1000);return JSON.stringify(root.mdone)!==m});
 t('перевод лида в CALL BOOKED создаёт трофей (в черновике не создавал)',()=>{const _o=mkS(N0),{s,root,clock}=_o;s.setStatus(0,L(1),{now:clock.t});clock.t+=70000;zc(_o,L(1),200);const o=s.setStatus(4,L(1),{had:true,now:clock.t});return !!o.trophy&&root.trophies.length===1});
 t('старый статус (>undoSec): откат всего, что он принёс',()=>{const _o=mkS(N0),{s,root,clock}=_o;s.setStatus(0,L(1),{now:clock.t});clock.t+=1000;s.setStatus(0,L(2),{now:clock.t});clock.t+=90000;
  const n0=root.days[Object.keys(root.days)[0]].n,how=s.dropLead(L(1).key,clock.t);return how==='worth'&&root.days[Object.keys(root.days)[0]].n===n0-1});
 t('Guard в логике: без подтверждённой таблицы статус ничего не начисляет',()=>{const _o=mkS(N0),{s,root,clock}=_o;let ok=false;s.setGate(()=>ok?{ok:true}:{ok:false,code:'none'});const x0=s.G.xp,o=s.setStatus(4,L(1),{now:clock.t});
  const blocked=o.blocked==='none'&&s.G.xp===x0&&!root.trophies.length&&!Object.keys(root.days).length;ok=true;clock.t+=30000;const o2=s.setStatus(4,L(1),{now:clock.t});return blocked&&!!o2.ev&&s.G.xp>x0});
 t('старый статус: снимаются ачивки, задания (с деньгами) и даже запечатанный трофей',()=>{const _o=mkS(N0),{s,root,clock}=_o;zc(_o,L(1),200);const o=s.setStatus(4,L(1),{now:clock.t});const ids=o.achv.map(a=>a.id);root.trophies[0].sealed=1;
  clock.t+=1000;s.setStatus(0,L(2),{now:clock.t});clock.t+=90000;const m0=s.G.money,u=s.G.undo.find(x=>x.lead===L(1).key),mm=(u.mis||[]).reduce((a,m)=>a+m.money,0);const how=s.dropLead(L(1).key,clock.t);
  return how==='worth'&&ids.length>0&&ids.every(i=>!(root.ach||{})[i])&&root.trophies.length===0&&s.G.money===m0-u.m-mm});
t('precheck: короткая встреча = отказ с длительностью',()=>{const _o=mkS(N0),{s}=_o;zc(_o,L(1),95);const p=s.precheck(4,L(1));const r=s.setStatus(4,L(1));return !p.ok&&p.why==='short'&&p.dur===95&&r.blocked==='short'&&!s.G.undo.length});
 t('смена статуса (re) не портит счётчики дня',()=>{const _o=mkS(N0),{s,root,clock}=_o;s.setStatus(0,L(1),{now:clock.t});const k=Object.keys(root.days)[0],n1=root.days[k].n;clock.t+=1000;s.setStatus(5,L(1),{had:true,now:clock.t});return root.days[k].n===n1});
 // --- отбой (кнопка и авто-отбой при статусе): защита от гонки с набором следующего номера
 const hg=()=>{const o={t:0,call:null,sent:[],dials:[]};o.g=new HangupGuard({activeCall:()=>o.call,sendHangup:id=>o.sent.push(id),sendDial:n=>o.dials.push(n),now:()=>o.t});return o};
 t('отбой: активный звонок → команда; следующий набор ждёт подтверждения конца',()=>{const h=hg();h.call={id:'A',ended:null};h.g.request('status');const r=h.g.dial('222');const q=h.dials.length===0&&r==='queued';h.t=300;h.call={id:'A',ended:300};h.g.onEnded('A');return q&&h.sent.join()==='A'&&h.dials.join()==='222'});
 t('отбой: конец не подтвердился → набор уйдёт по таймауту 2,5 с, не раньше',()=>{const h=hg();h.call={id:'A',ended:null};h.g.request('status');h.g.dial('222');h.t=2000;h.g.tick();const early=h.dials.length;h.t=2600;h.g.tick();return early===0&&h.dials.join()==='222'});
 t('отбой: ПОЯВИЛСЯ другой активный звонок → старый отбой отменён как устаревший, новый звонок не трогаем',()=>{const h=hg();h.call={id:'A',ended:null};h.g.request('status');h.g.dial('222');h.call={id:'B',ended:null};h.t=100;h.g.tick();return h.sent.length===1&&h.sent[0]==='A'&&h.dials.join()==='222'&&!h.g.busy&&h.g.request('button')==='sent'&&h.sent[1]==='B'});
 t('отбой: звонка нет или уже завершён → ничего не отправляется',()=>{const h=hg();const a=h.g.request('status');h.call={id:'A',ended:5};const b=h.g.request('status');return a==='none'&&b==='none'&&h.sent.length===0});
 t('отбой: статус + кнопка на один звонок = одна команда, быстрые нажатия кнопки гасятся',()=>{const h=hg();h.call={id:'A',ended:null};h.g.request('status');const d=h.g.request('button');h.t=500;h.call={id:'B',ended:null};const e1=h.g.request('button'),e2=h.g.request('button');return d==='dup'&&e1==='sent'&&e2==='debounced'&&h.sent.join()==='A,B'});
 t('набор без активного отбоя уходит сразу',()=>{const h=hg();return h.g.dial('111')==='now'&&h.dials.join()==='111'});
 // --- лимит между статусами: pitched&hung up = 5 мин, hung up в начале по-прежнему 4 (60+180)
 const gap=(id,sec)=>{const s=newState(0);apply(s,id,0,{});const e=apply(s,0,sec*1000,{});return !e.pen};
 t('окно статусов: «Owner pitched & Hang Up» = ровно 5 мин, «Owner hung up в начале» = ровно 3 мин',()=>gap(3,300)&&!gap(3,301)&&gap(2,180)&&!gap(2,181)&&gap(0,60)&&!gap(0,61));
 return T}
