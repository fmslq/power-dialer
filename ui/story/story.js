// ПЛЕЕР СЦЕН (R5, ТЗ §6): раскадровка из панелей, камера плывёт, параллакс, печатающийся текст,
// портреты с настроением, Space — дальше, ← — назад, Esc — пропустить. Все просмотренные сцены — в «Журнале истории».
// Дайлер и звонок не останавливаются: сцена просто лежит поверх экрана (как меню и карта).
import {PROLOGUE,DISTRICTS,FINALE,EPILOGUE,ARCS} from '../../story/scenes.js';
import {DIST} from '../../core/meta.js';
import {districtLayers,cityLayers,garageLayers} from '../../art/scenes.js';
import {guideSvg} from '../../art/guide.js';
import {crest,caller} from '../../art/world.js';
import {hasArt} from '../../art/overrides.js';
import {splitAnim} from '../kit/fx.js';
import {SYS,SYS_KEYS} from '../../story/systems.js';
import {SHELF,PRE,preScene} from '../../story/shelves.js';
import {npcSvg} from '../../art/people.js';
import {lomSvg} from '../../art/base.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
// порядок сцен для Журнала истории
export const SCENES=[{key:'prologue',t:'Пролог',d:0},...DISTRICTS.flatMap(x=>[{key:'intro-'+x.d,t:'Заход',d:x.d},{key:'boss-'+x.d,t:'Босс',d:x.d},...(x.capture?[{key:'capture-'+x.d,t:'Захват',d:x.d}]:[])]),{key:'finale',t:'Финал',d:12},
 ...Object.keys(PRE).map(d=>({key:'pre-'+d,t:'Звонок изнутри '+d,g:'Звонки изнутри'})),
 ...SYS_KEYS.map(k=>({key:'sys-'+k,t:SYS[k].t,g:SYS[k].g})),
 ...Object.keys(SHELF).map(d=>({key:'shelf-'+d,t:'Полка '+d,g:'Чёрный Рынок'}))];
const chap=key=>{const [k,n]=key.split('-'),d=+n;if(k==='prologue')return'ПРОЛОГ';if(k==='sys')return'СИСТЕМЫ · '+((SYS[n]||{}).g||'').toUpperCase();if(k==='shelf')return`ЧЁРНЫЙ РЫНОК · ПОЛКА ${d}`;if(k==='pre')return`РАЙОН ${d} · ЗВОНОК ИЗНУТРИ`;if(k==='finale')return'ФИНАЛ';const arc=ARCS.find(([a,b])=>d>=a&&d<=b);return`РАЙОН ${d} · ${DIST[d-1][0].toUpperCase()}${arc?` · ${arc[2]}`:''}`};
// панели сцены с фоном: bg = {k:'dist'|'city'|'garage'|'crt'|'wake', d}
// Кусок 22: фон всегда = текущая локация. Сцены систем, полок и «звонков изнутри» с общим фоном города показываются на фоне района,
// где сейчас игрок (curD задаёт makeStory через o.district). Гараж и экран Гудка — это база, они остаются.
let curD=()=>1;const here=p=>p.bg&&p.bg.k==='city'?{...p,bg:{k:'dist',d:Math.max(1,Math.min(12,curD()|0||1))}}:p;
export function panelsOf(key){const [k,n]=key.split('-'),d=+n,X=DISTRICTS[d-1];
 if(k==='prologue')return PROLOGUE.map((p,i)=>({...p,bg:p.bg||[{k:'city'},{k:'city'},{k:'garage'},{k:'crt'},{k:'city'}][i]||{k:'city'}}));
 if(k==='intro')return X.intro.map(p=>({...p,bg:{k:'dist',d}}));
 if(k==='boss')return[{who:'boss',d,mood:'smug',text:X.boss.line,bg:{k:'dist',d,dark:1}},{who:'guide',mood:'worried',text:X.boss.guide,bg:{k:'dist',d,dark:1}}];
 if(k==='capture')return(X.capture||[]).map(p=>({...p,bg:{k:'dist',d,won:1}}));
 if(k==='finale')return FINALE.map((p,i)=>({...p,d:12,bg:p.bg||[{k:'dist',d:12},{k:'dist',d:12,dark:1},{k:'garage'},{k:'crt'},{k:'crt'},{k:'wake'}][i]}));
 if(k==='sys')return SYS[n]?SYS[n].panels.map(p=>here({...p})):[];
 if(k==='shelf')return SHELF[d]?SHELF[d].map(p=>here({...p})):[];
 if(k==='pre')return preScene(d).map(p=>p.bg&&p.bg.k==='city'?{...p,bg:{k:'dist',d}}:p);
 return[]}
const layersOf=bg=>bg.k==='dist'?districtLayers(bg.d):bg.k==='garage'||bg.k==='crt'?garageLayers():cityLayers(bg.k==='wake');
const portrait=p=>p.who==='guide'?guideSvg(p.mood||'talking'):p.who==='boss'?`<div class="st-boss">${crest((p.d||1)-1,'boss')}</div>`:p.who==='caller'?caller():p.who==='lom'?lomSvg(p.mood||'welcome'):p.who==='npc'?npcSvg(p.pic,p.mood):'';
const whoName=p=>p.who==='guide'?'ГУДОК':p.who==='boss'?DIST[(p.d||1)-1][3]:p.who==='caller'?'ТЫ':p.who==='lom'?'ЛОМ':p.who==='npc'?(p.nm||''):'';

export function makeStory(o){ // o: {mount, save, persist, fx:()=>'full'|'off', sfx(name)}
 if(o.district)curD=o.district;
 let el=null,list=[],pi=0,key='',queue=[],done=null,typer=0,full='',shown=0,jr=null;
 const reduce=()=>RM.matches||o.fx()==='off';
 const root=()=>{const s=o.save;s.story=s.story||{seen:{}};s.story.seen=s.story.seen||{};return s.story};
 const seen=k=>!!root().seen[k];
 const mark=k=>{if(!k||seen(k))return;root().seen[k]=Date.now();if(k==='prologue')root().prologue=true;o.persist&&o.persist()};
 const isOpen=()=>!!el;
 const bgSig=p=>JSON.stringify(p.bg)+(hasArt(`assets/story/${key}_${pi+1}.png`)?'#'+pi:'');
 const stage=p=>{const img=hasArt(`assets/story/${key}_${pi+1}.png`)?`<img class="sc-img" src="assets/story/${key}_${pi+1}.png" alt="">`:'';
  const L=img?[img]:layersOf(p.bg);
  return`<div class="st-st ${p.bg.dark?'dark':''} ${p.bg.won?'won':''} k-${p.bg.k}">${L.map((s,i)=>`<div class="st-p" style="--z:${i}">${s}</div>`).join('')}
   ${p.bg.k==='crt'?`<div class="st-crt">${guideSvg(p.mood||'talking','big')}</div>`:''}${p.bg.k!=='garage'&&p.bg.k!=='crt'?'<div class="st-rain"><i class="far"></i><i class="near"></i></div>':''}<i class="st-shade"></i><i class="st-vig"></i></div>`};
 const type=()=>{clearInterval(typer);const tx=el.querySelector('.st-t');if(reduce()){tx.textContent=full;shown=full.length;return}
  shown=0;tx.textContent='';typer=setInterval(()=>{shown=Math.min(full.length,shown+2);tx.textContent=full.slice(0,shown);if(shown>=full.length)clearInterval(typer)},28)};
 const draw=()=>{const p=list[pi];if(!p)return;full=p.text||'';clearInterval(typer);{const tx=el.querySelector('.st-t');if(tx)tx.textContent=''}   // J9: прошлая реплика не мелькает в новом окне
  const box=el.querySelector('.st-stw'),old=[...box.querySelectorAll('.st-st')].filter(x=>!x.classList.contains('out')).pop(),sig=bgSig(p);
  // A7: та же картинка — фон не трогаем (без затемнения и без перезапуска анимаций), меняются только текст и портрет
  if(old&&old.dataset.sig===sig){const c=old.querySelector('.st-crt');if(c)c.innerHTML=guideSvg(p.mood||'talking','big')}
  else{box.insertAdjacentHTML('beforeend',stage(p));const nw=box.lastElementChild;nw.dataset.sig=sig;splitAnim(nw);
   if(old&&!reduce()){old.classList.add('out');setTimeout(()=>old.remove(),600)}else if(old)old.remove();
   requestAnimationFrame(()=>nw.classList.add('in'))}
  const cap=el.querySelector('.st-cap');cap.className='st-cap '+(p.who?'who-'+p.who:'narr');
  el.querySelector('.st-por').innerHTML=p.bg.k==='crt'&&p.who==='guide'?'':portrait(p);el.querySelector('.st-cap').classList.toggle('nopor',p.bg.k==='crt'&&p.who==='guide');el.querySelector('.st-who').textContent=whoName(p);
  el.querySelector('.st-dots').innerHTML=list.map((_,i)=>`<i class="${i===pi?'on':i<pi?'was':''}"></i>`).join('');
  el.querySelector('.st-ch').textContent=chap(key);{const n=1+queue.length;el.querySelector('.st-skip span').textContent=key==='prologue'?'Пропустить пролог целиком':n>1?`Пропустить сцены (${n})`:'Пропустить сцену'}type();if(pi===0)o.sfx&&o.sfx('tick')};
 const next=()=>{if(!el)return;if(shown<full.length){clearInterval(typer);shown=full.length;el.querySelector('.st-t').textContent=full;return}
  if(pi<list.length-1){pi++;draw()}else finish()};
 const prev=()=>{if(el&&pi>0){pi--;draw()}};
 const finish=()=>{mark(key);const k=queue.shift();if(k){start(k);return}close()};
 const start=k=>{key=k;list=panelsOf(k);if(o.mode&&o.mode()==='short'&&list.length>1){const g=list.filter(p=>p.who==='guide');list=[g.at(-1)||list.at(-1)]}pi=0;if(!list.length)return finish();draw()};
 const build=()=>{el=document.createElement('div');el.className='st';el.setAttribute('role','dialog');el.setAttribute('aria-label','Сцена');
  el.innerHTML=`<div class="st-stw"></div><i class="st-lb t"></i><i class="st-lb b"></i><div class="st-ch"></div>
   <div class="st-cap"><div class="st-por"></div><div class="st-tx"><b class="st-who"></b><p class="st-t" aria-live="polite"></p></div></div>
   <button class="st-skip" type="button"><span></span><kbd>Esc</kbd></button><div class="st-ui"><span class="st-dots"></span><span class="st-k"><kbd>Space</kbd> дальше <kbd>←</kbd> назад <kbd>Esc</kbd> пропустить</span></div>`;
  el.classList.toggle('rm',reduce());o.mount.append(el);
  el.addEventListener('click',e=>{if(e.target.closest('.st-skip')){close();return}if(e.target.closest('.st-k'))return;next()});
  el.addEventListener('mousemove',e=>{if(reduce())return;el.style.setProperty('--mx',(e.clientX/innerWidth-.5).toFixed(3));el.style.setProperty('--my',(e.clientY/innerHeight-.5).toFixed(3))});
  requestAnimationFrame(()=>el&&el.classList.add('in'))};
 // play('prologue') или play(['capture-3','intro-4'], done); force — сыграть даже просмотренную
 const play=(keys,cb,force=false)=>{keys=[].concat(keys).filter(k=>force||!seen(k)).filter(k=>panelsOf(k).length);if(!keys.length){cb&&cb();return false}
  if(el){queue.push(...keys);const d0=done;done=()=>{d0&&d0();cb&&cb()};return true}
  done=cb||null;queue=keys.slice(1);build();start(keys[0]);return true};
 const close=()=>{if(!el)return;clearInterval(typer);mark(key);for(const k of queue)mark(k);queue=[];const n=el;el=null;n.classList.remove('in');n.classList.add('out');setTimeout(()=>n.remove(),reduce()?0:300);const d=done;done=null;d&&d()};
 const key_=e=>{if(jr)return jrKey(e);if(!el)return false;
  if(e.code==='Escape'){close();return true}
  if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight'){next();return true}
  if(e.code==='ArrowLeft'||e.code==='Backspace'){prev();return true}
  return e.code!=='Tab'};
 // ---------- Журнал истории ----------
 const jrHtml=()=>{let last=-1;return`<div class="sj-in"><header><b>ЖУРНАЛ ИСТОРИИ</b><span>${Object.keys(root().seen).length} из ${SCENES.length} сцен</span><button class="sj-x" aria-label="Закрыть">✕</button></header>
  <div class="sj-g">${SCENES.map(s=>{const ok=seen(s.key),hd=s.d!==last?(last=s.d,`<h4>${s.d?`${s.d}. ${esc(DIST[s.d-1][0])}`:'Начало'}</h4>`):'';
   return hd+`<button class="sj-c ${ok?'':'lk'}" data-k="${s.key}" ${ok?'':'disabled'}>${s.d?crest(s.d-1,ok?'':'locked'):s.g==='Чёрный Рынок'?lomSvg(ok?'welcome':'closed'):guideSvg('neutral')}<span>${ok?esc(s.t):'???'}</span></button>`}).join('')}</div>
  <footer>Сцена открывается, когда ты до неё дошёл. Клик — пересмотреть.</footer></div>`};
 const openJournal=()=>{if(jr)return;jr=document.createElement('div');jr.className='sj';jr.setAttribute('role','dialog');jr.setAttribute('aria-label','Журнал истории');jr.innerHTML=jrHtml();o.mount.append(jr);
  jr.addEventListener('click',e=>{const b=e.target.closest('.sj-c');if(b&&!b.disabled){closeJournal();play(b.dataset.k,()=>openJournal(),true);return}if(e.target.closest('.sj-x')||e.target===jr)closeJournal()});
  requestAnimationFrame(()=>jr&&jr.classList.add('in'))};
 const closeJournal=()=>{if(!jr)return;const n=jr;jr=null;n.remove()};
 const jrKey=e=>{if(e.code==='Escape'){closeJournal();return true}return e.code!=='Tab'};
 return{play,close,isOpen:()=>!!el||!!jr,key:key_,seen,mark,openJournal,closeJournal,_state:()=>({key,pi,n:list.length,queue:[...queue]})}}

export function runStoryUiTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('у каждой сцены журнала есть панели',()=>SCENES.every(s=>panelsOf(s.key).length>0));
 t('у каждой панели есть фон',()=>SCENES.every(s=>panelsOf(s.key).every(p=>p.bg&&p.bg.k)));
 t('сцены: пролог, 12 заходов, 12 боссов, 11 захватов, финал + звонки изнутри, системы, полки',()=>SCENES.length===1+12+12+11+1+11+SYS_KEYS.length+12);
 t('npc и Лом в сценах — с портретом и именем',()=>SCENES.every(s=>panelsOf(s.key).every(p=>(p.who!=='npc'&&p.who!=='lom')||(portrait(p).includes('<svg')&&whoName(p)))));
 return o}
