// РАЗГОН v3 (кусок 20, просьба пользователя). Входящий вызов, когда список загружен и за день 0 наборов.
// • На принятие — 10 минут: в окне идёт обратный отсчёт 10:00 → 0:00, потом вызов пропущен.
// • Принял → ×3 XP и $ (кроме CALL BOOKED и DISCOVERY), пока идут ОБА условия: не прошло 10 минут И не сделано 5 наборов.
//   Что наступит раньше — то и конец. За 2 минуты до конца — предупреждение; в конце — карточка «Разгон закончился / пройден».
// • Кусок 22: только пн–пт, 13:55–23:10 по часам компьютера (и тестировщику). Отклонил — сегодня всё. Пропустил — ещё раз через час.
// • Тестировщику — при каждой загрузке (но тоже только в это окно). Сюжет: story/systems.js, sys-warm — играет ДО первого вызова (кусок 23).
import * as A from '../../core/addict.js';
const PH='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor"/></svg>';
const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
export function makeWarm({save,persist,sfx=()=>{},toast=()=>{},tester=false,now=Date.now,dayN=()=>0,ready=()=>false,busy=()=>false,onAnswer=()=>{},onEnd=()=>{},intro=()=>false}){
 const W=A.AD.warm,loadedAt=now();
 let el=null,ring=0,tick=0,until=0,testerShown=false,warned=false,endEl=null;
 const close=()=>{if(!el)return;clearInterval(ring);clearInterval(tick);removeEventListener('keydown',kd,true);el.classList.add('out');const e=el;el=null;setTimeout(()=>e.remove(),260)};
 const answer=(yes,miss=false)=>{if(!el)return;A.warmAnswer(save,now(),yes,dayN(),miss);persist();close();warned=false;
  if(yes){sfx('levelup');toast(`РАЗГОН принят: ×${W.k} XP и $ — ${W.n} звонков или ${W.min} минут, что раньше`,'gold')}
  else if(miss){const t=now()+W.retry*60000,again=A.warmOffer(save,t,0,false,loadedAt);toast(again?'Вызов пропущен. Гудок перезвонит ещё раз примерно через час, если ты к тому времени не начнёшь звонить':'Вызов пропущен. Сегодня Гудок больше не позвонит')}
  else toast('Вызов отклонён. Сегодня Гудок больше не позвонит, следующий — в рабочий день после обеда');onAnswer(yes)};
 const kd=e=>{if(!el)return;e.stopPropagation();if(e.code==='Enter'||e.code==='Space'||e.code==='KeyY'){e.preventDefault();answer(true)}else if(e.code==='Escape'){e.preventDefault();answer(false)}};
 const open=()=>{if(el)return;until=now()+W.ask*60000;el=document.createElement('div');el.className='wu-wrap';
  el.innerHTML=`<div class="wu" role="alertdialog" aria-label="Входящий вызов: начнём разогрев?">
   <div class="wu-ph"><i></i><i></i><i></i><b>${PH}</b></div>
   <em class="wu-k">ВХОДЯЩИЙ ВЫЗОВ</em><div class="wu-from">ГУДОК · линия разогрева</div>
   <h3>Начнём разогрев?</h3>
   <p class="wu-l">«Слушай, линия с утра холодная. Давай сделаем пять быстрых звонков подряд, пока я на связи, — она разогреется, и дальше пойдёт легче. Ну что, берёшь?»</p>
   <p class="wu-once">Если откажешься, сегодня это предложение больше не появится.</p>
   <div class="wu-x"><b>×${W.k}</b><span>XP и $ за первые ${W.n} звонков<small>действует ${W.min} минут или ${W.n} звонков — что наступит раньше · на все статусы, кроме CALL BOOKED и DISCOVERY · успеешь все ${W.n} — ещё бонус «Разгон пройден»</small></span></div>
   <div class="wu-b"><button class="no" data-no>${PH}<span>Отклонить</span><kbd>Esc</kbd></button><button class="yes" data-yes>${PH}<span>Принять</span><kbd>Enter</kbd></button></div>
   <div class="wu-cd" aria-live="off"><span>Вызов сбросится через</span><b id="wu-cd">${mmss(W.ask*60000)}</b><i><em id="wu-cdb"></em></i></div></div>`;
  el.querySelector('[data-yes]').onclick=()=>answer(true);el.querySelector('[data-no]').onclick=()=>answer(false);
  document.body.appendChild(el);addEventListener('keydown',kd,true);sfx('chime');let n=0;ring=setInterval(()=>{if(++n>5){clearInterval(ring);return}sfx('chime')},2200);
  const cd=()=>{if(!el)return;const l=until-now();const b=el.querySelector('#wu-cd'),bar=el.querySelector('#wu-cdb');if(b)b.textContent=mmss(l);if(bar)bar.style.width=(100*l/(W.ask*60000)).toFixed(2)+'%';
   el.querySelector('.wu-cd').classList.toggle('hurry',l<60000);if(l<=0)answer(false,true)};cd();tick=setInterval(cd,1000)};
 // карточка в конце разгона (не мешает работать: снизу по центру, сама уходит через 7 с)
 const endCard=(ok,n,extra='')=>{if(endEl)endEl.remove();endEl=document.createElement('div');endEl.className='wu-end '+(ok?'ok':'over');
  endEl.innerHTML=`<em>${ok?'РАЗГОН ПРОЙДЕН':'РАЗГОН ЗАКОНЧИЛСЯ'}</em><b>${ok?`${W.n} из ${W.n} за ${W.min} минут`:`Время вышло · ${n} из ${W.n}`}</b><span>${ok?extra||'Линия прогрелась. Дальше — обычный темп.':`Бонус ×${W.k} больше не действует. Завтра — новая попытка.`}</span>`;
  document.body.appendChild(endEl);endEl.onclick=()=>endEl&&endEl.remove();const e=endEl;setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),400)},7000)};
 // раз в секунду: таймер активного разгона, предупреждение, конец по времени
 const live=()=>{const t=now(),st=A.warmState(save,t,dayN());if(!st||!st.on){if(st&&!st.done){const r=A.warmTick(save,t,dayN());if(r){persist();sfx('fail');endCard(false,r.n);onEnd(false)}}return}
  if(!warned&&st.left<=120000){warned=true;sfx('tick');toast(`РАЗГОН: осталось ${mmss(st.left)} и ${W.n-st.n} звонк${W.n-st.n===1?'а':'ов'} до бонуса`,'gold')}};
 setInterval(live,1000);
 const done=o=>{endCard(true,W.n,`+${o.moneyTxt} и +${o.sig} Сигнала. Линия прогрелась.`);onEnd(true)};
 const check=()=>{if(el||!ready()||busy()||(typeof document!=='undefined'&&document.visibilityState==='hidden'))return;
  // кусок 23: сначала сцена-знакомство (один раз), потом сам вызов — и то и другое только в окне warmWin (ночью — ничего)
  const go=()=>{if(intro())return;open()};
  if(!A.warmWin(now()))return;
  if(tester&&!testerShown){if(intro())return;testerShown=true;open();return}if(A.warmOffer(save,now(),dayN(),false,loadedAt))go()};
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>setTimeout(check,600));
 return{check,open,close,done,isOpen:()=>!!el,state:()=>A.warmState(save,now(),dayN())}}
