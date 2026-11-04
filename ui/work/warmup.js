// РАЗГОН v2 (кусок 18, просьба пользователя): при входе, когда список загружен и за день 0 наборов, — большой «входящий вызов».
// Принять → первые 5 наборов ×3 XP и $ (кроме CALL BOOKED и DISCOVERY), после 5-го — «Разгон пройден» с бонусом.
// Отклонить → до завтра. Один раз в день; тестировщику — при каждой загрузке страницы.
// Сюжет (story/systems.js, sys-warm): на «Заре» ночная смена начиналась с пяти пробных соединений — «прогреть пульт».
import * as A from '../../core/addict.js';
const PH='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor"/></svg>';
export function makeWarm({save,persist,sfx=()=>{},toast=()=>{},tester=false,now=Date.now,dayN=()=>0,ready=()=>false,busy=()=>false,onAnswer=()=>{}}){
 let shown=false,el=null,ring=0;
 const close=()=>{if(!el)return;clearInterval(ring);removeEventListener('keydown',kd,true);el.classList.add('out');const e=el;el=null;setTimeout(()=>e.remove(),260)};
 const answer=yes=>{if(!el)return;A.warmAnswer(save,now(),yes);persist();close();
  if(yes){sfx('levelup');toast(`РАЗГОН принят: первые ${A.AD.warm.n} звонков ×${A.AD.warm.k} XP и $`,'gold')}else toast('Вызов отклонён. Завтра линия позвонит снова');onAnswer(yes)};
 const kd=e=>{if(!el)return;e.stopPropagation();if(e.code==='Enter'||e.code==='Space'||e.code==='KeyY'){e.preventDefault();answer(true)}else if(e.code==='Escape'){e.preventDefault();answer(false)}};
 const open=()=>{if(el)return;shown=true;el=document.createElement('div');el.className='wu-wrap';
  el.innerHTML=`<div class="wu" role="alertdialog" aria-label="Входящий вызов: начнём разогрев?">
   <div class="wu-ph"><i></i><i></i><i></i><b>${PH}</b></div>
   <em class="wu-k">ВХОДЯЩИЙ ВЫЗОВ</em><div class="wu-from">ГУДОК · линия разогрева</div>
   <h3>Начнём разогрев?</h3>
   <p class="wu-l">«Линия за ночь остыла. Пять быстрых наборов — и она запоёт. Возьмёшь?»</p>
   <div class="wu-x"><b>×${A.AD.warm.k}</b><span>XP и $ за первые ${A.AD.warm.n} звонков<small>на все статусы, кроме CALL BOOKED и DISCOVERY · после пятого ещё бонус «Разгон пройден»</small></span></div>
   <div class="wu-b"><button class="no" data-no>${PH}<span>Отклонить</span><kbd>Esc</kbd></button><button class="yes" data-yes>${PH}<span>Принять</span><kbd>Enter</kbd></button></div>
   <p class="wu-f">Сегодня только одна возможность</p></div>`;
  el.querySelector('[data-yes]').onclick=()=>answer(true);el.querySelector('[data-no]').onclick=()=>answer(false);
  document.body.appendChild(el);addEventListener('keydown',kd,true);sfx('chime');let n=0;ring=setInterval(()=>{if(++n>5){clearInterval(ring);return}sfx('chime')},2200)};
 const check=()=>{if(shown||el||!ready()||busy())return;if(A.warmOffer(save,now(),dayN(),tester))open();else shown=true};
 return{check,open,close,isOpen:()=>!!el}}
