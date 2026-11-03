import {CONFIG as C,districtThr} from '../../core/config.js';
import {SaveManager as SM} from '../../core/save.js';
import {levelOf,LEVELS,rankOf,RANKS,dominance} from '../../core/stats.js';
import {EventBus} from '../../core/eventbus.js';
import {AudioController} from '../../audio/audio.js';
import {cityScene} from '../../art/city.js';

const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function boot(root=document.getElementById('ct-app')){
 document.title=C.tabTitle;
 let save=SM.load(),started=false;const bus=new EventBus(),au=new AudioController(bus);
 const S=()=>save.settings;au.setFlags({soundUi:S().soundUi,hum:S().hum});au.v.sfx=S().sfx;au.v.music=S().music??.3;
 root.innerHTML=`<div class="ct-stage" id="ct-stage"></div>
  <div class="ct-logo build" id="ct-logo"><h1><span data-t="UPLINK">UPLINK</span><span data-t="SYNDICATE">SYNDICATE</span></h1><div class="tag">${esc(C.subtitle)} // оператор терминала</div></div>
  <div class="ct-start" id="ct-start">НАЖМИ ЛЮБУЮ КЛАВИШУ<small>звук включится после нажатия</small></div>
  <div class="ct-band" id="ct-band" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
  <nav class="ct-menu ct-panel" id="ct-menu" aria-label="Главное меню"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i></nav>
  <div class="ct-ver">${esc(C.version)}</div><div class="ct-toastc" id="ct-toast"></div>
  <div class="ct-modal" id="ct-modal"><div class="ct-panel" id="ct-mbox"><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><i class="ct-bolt"></i><div id="ct-mc"></div></div></div>`;
 const scene=cityScene($('#ct-stage'));scene.setFx(S().fx);
 const tone=(f,d,t='square',g=.12,sl=0)=>au.tone(f,d,t,g,sl,'ui');
 const click=()=>{tone(900,.05,'square',.1,.6);tone(110,.1,'sine',.18,.5)},hover=()=>tone(1700,.025,'triangle',.04),open=()=>{[330,494,660].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.1),i*60))};
 let tt;const toast=m=>{const t=$('#ct-toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)};
 // --- превью сохранения
 const g=save.game,has=!!(g&&g.lifeXp>0);
 const preview=()=>{if(!has)return'<div class="ct-save">Сохранения нет. Начни первую смену: проводник встретит тебя на базе.</div>';
  const lv=levelOf(g.lifeXp),d=C.districts[Math.min(11,(g.district||1)-1)],dm=dominance(save,Date.now()),last=Object.keys(save.days||{}).sort().pop();
  return`<div class="ct-save">LVL <b>${lv}</b> ${esc(LEVELS[lv][1])}<br>Район <b>${g.district||1}. ${esc(d[1])}</b> · Ранг <b>${esc(RANKS[rankOf(dm.pts)][1])}</b><br>Капитал <b>$${Math.round(g.money||0).toLocaleString('ru')}</b>${last?' · Смена '+last:''}</div>`};
 const items=[['cont','Продолжить',has?'':'новая',has?'primary':''],['new','Новая игра','',''],['train','Тренировочный звонок','R3',''],['map','Карта мира','R2',''],['base','База','R2',''],['set','Настройки','',''],['log','Журнал истории','R4',''],['work','Рабочий экран','','']];
 const menu=$('#ct-menu');
 menu.insertAdjacentHTML('beforeend',`<h2>Главное меню</h2>${preview()}`+items.map(([id,t,tag,cls],i)=>`<button class="ct-key ${cls}${id==='new'?' danger':''}" data-id="${id}" style="--i:${i}"><span class="led"></span>${t}${tag&&tag!=='новая'?`<small class="soon">${tag}</small>`:''}</button>`).join(''));
 if(!has)menu.querySelector('[data-id=cont]').firstChild.nextSibling.textContent='Начать первую смену';
 // --- модалка
 const modal=(html)=>{$('#ct-mc').innerHTML=html;$('#ct-modal').classList.add('open');open()},close=()=>$('#ct-modal').classList.remove('open');
 $('#ct-modal').addEventListener('click',e=>{if(e.target.id==='ct-modal')close()});
 const persist=()=>SM.save(save);
 const settings=()=>{const s=S();modal(`<h3>Настройки</h3><div class="ct-row"><label>Громкость звуков</label><input class="ct-slider" id="s-sfx" type="range" min="0" max="100" value="${s.sfx*100|0}" style="flex:1;--v:${s.sfx*100}%"><output>${s.sfx*100|0}</output></div>
   <div class="ct-row"><label>Гул города</label><div class="ct-seg" id="s-hum"><button data-v="1" class="${s.hum?'on':''}">Вкл</button><button data-v="0" class="${s.hum?'':'on'}">Выкл</button></div></div>
   <div class="ct-row"><label>Звуки интерфейса</label><div class="ct-seg" id="s-ui"><button data-v="1" class="${s.soundUi?'on':''}">Вкл</button><button data-v="0" class="${s.soundUi?'':'on'}">Выкл</button></div></div>
   <div class="ct-row"><label>Эффекты</label><div class="ct-seg" id="s-fx">${['off','low','full'].map(v=>`<button data-v="${v}" class="${s.fx===v?'on':''}">${{off:'Выкл',low:'Мало',full:'Полно'}[v]}</button>`).join('')}</div></div>
   <p style="font:12px var(--ct-mono);color:#7a8a78;margin:18px 0 8px">Синтез-музыка по умолчанию выключена. Остальные настройки появятся вместе с экранами в следующих частях.</p>
   <button class="ct-key" id="s-close"><span class="led"></span>Закрыть</button>`);
  const sl=$('#s-sfx');sl.oninput=()=>{const v=sl.value/100;s.sfx=v;au.v.sfx=v;sl.style.setProperty('--v',sl.value+'%');sl.nextElementSibling.textContent=sl.value;persist();tone(700,.08,'triangle',.2)};
  const seg=(id,fn)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$(id).children].forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);persist();click()});
  seg('#s-hum',v=>{s.hum=v==='1';au.setFlags({hum:s.hum});au.hum(s.hum)});seg('#s-ui',v=>{s.soundUi=v==='1';au.setFlags({soundUi:s.soundUi})});seg('#s-fx',v=>{s.fx=v;scene.setFx(v)});
  $('#s-close').onclick=()=>{click();close()}};
 const newGame=()=>{modal(`<h3 style="color:var(--ct-red)">Новая игра</h3><p style="font:14px/1.5 var(--ct-text);color:#cfdccb">Текущий прогресс будет стёрт. Сначала скачай сохранение: так ничего не потеряется.</p>
   <button class="ct-key" id="n-exp"><span class="led"></span>Скачать сохранение</button><button class="ct-key danger" id="n-go" disabled><span class="led"></span>Стереть и начать заново</button><button class="ct-key" id="n-no"><span class="led"></span>Отмена</button>`);
  $('#n-exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([SM.exportJson(save)],{type:'application/json'}));a.download='uplink-syndicate-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();$('#n-go').disabled=false;toast('Сохранение скачано');click()};
  $('#n-go').onclick=()=>{const s=SM.defaults();s.settings=save.settings;save=s;persist();close();toast('Новая игра: прогресс сброшен');setTimeout(()=>location.reload(),700)};$('#n-no').onclick=()=>{click();close()}};
 const soon=m=>toast(m);
 const work=(demo=null)=>{removeEventListener('keydown',kd);scene.stop&&scene.stop();return import('../work/work.js').then(m=>{const w=m.startWork(root,{save,au,demo});window.ctw=w;
   if(demo&&demo.leads!==false)fetch('tests/fixture-leads.csv').then(r=>r.text()).then(t=>{w.d.loadText(t,'demo-leads.csv');w.layout();demo.after&&demo.after(w)});else demo&&demo.after&&demo.after(w);return w})};
 menu.addEventListener('click',e=>{const b=e.target.closest('.ct-key');if(!b)return;click();const id=b.dataset.id;
  ({cont:()=>work(),new:newGame,train:()=>soon('Тренировочный звонок: фаза R3'),map:()=>soon('Карта мира: фаза R2'),base:()=>soon('База: фаза R2'),set:settings,log:()=>soon('Журнал истории: фаза R4'),work:()=>work()})[id]()});
 menu.addEventListener('pointerover',e=>{if(e.target.closest('.ct-key'))hover()});
 // --- старт
 // ч.6: сначала запускаем анимации (они идут на видеокарте), звук создаём кадром позже — создание AudioContext на Mac может занять десятки мс
 const begin=()=>{if(started)return;started=true;$('#ct-start').style.display='none';$('#ct-logo').classList.add('small');
  requestAnimationFrame(()=>setTimeout(()=>{const c=au.init();if(c&&c.state==='suspended'){const r=()=>c.resume();addEventListener('pointerdown',r,{once:true});addEventListener('keydown',r,{once:true})}au.setFlags({hum:S().hum});au.hum(S().hum);open()},0));setTimeout(()=>{menu.classList.add('in');$('#ct-band').classList.add('in');menu.querySelector('.ct-key').focus({preventScroll:true})},450)};
 const kd=e=>{if(!started){if(!e.metaKey&&!e.ctrlKey&&e.key!=='Tab'&&!/^F\d/.test(e.key)){e.preventDefault();begin()}return}
  if(e.key==='Escape')close();const ks=[...menu.querySelectorAll('.ct-key')];const i=ks.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault();ks[(i+1)%ks.length].focus()}if(e.key==='ArrowUp'){e.preventDefault();ks[(i-1+ks.length)%ks.length].focus()}};
 addEventListener('keydown',kd);$('#ct-start').addEventListener('click',begin);addEventListener('pointerdown',()=>{if(!started)begin()},{once:true});
 const q=new URLSearchParams(location.search);
 if(q.has('demo')){const v=q.get('demo');started=true;work({mode:v||'1',leads:v!=='empty',after:w=>{if(v==='gate'){w.d.zoom.gate='failed';w.gateWin('failed')}if(v==='set')w.openSettings();if(v==='pick')w.openPicker();
   if(v==='1'||v===''||v==='set'||v==='pick'){const g=w.save.game,G=w.ses.G;g.lifeXp=1850;g.money=4200;Object.assign(G,{streak:7,step:1,odBase:0,last:Date.now()-25000,lastCls:'TRASH',lastId:0,lastEnd:null});w.hud()}}})}
 else if(q.has('work')){started=true;work()}
 return{au,scene,begin,get started(){return started}}}
