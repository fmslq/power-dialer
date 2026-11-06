// Кусок 25. «Лента эфира» — киллфид смены (DECISIONS §5 №15, §6: лор-строки исходов, бегущая строка; §44).
// Только значимые события. Мусор подряд схлопывается в одну строку «×N». В компактном окне (<900 px) скрыта.
// Плюс «туннельное зрение» (§5 №12): через 15 с после соединения по Zoom края экрана темнеют, в центре карточка и шпаргалка.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// лор-строки исходов: коротко, живой речью (NARRATIVE_GUIDE §3), без спойлеров сюжета
export const LORE={
 TRASH:['Гудки ушли в пустоту','Автоответчик проглотил звонок','Никто не взял, линия просто гудела','Пустой эфир, набирай дальше'],
 GATEKEEPER:['Ресепшен закрыл дверь перед носом','Секретарь не пустил дальше приёмной','Дверь держат, но ты уже знаешь, кто за ней'],
 MINOR:['Звонок ушёл в сторону, но засчитан','Не то, что ждал, но линия ожила'],
 TALK:['Владелец взял трубку, голос прошёл','Хозяин на линии, ты успел сказать главное','Живой разговор, район это почувствовал'],
 CALLBACK:['Владелец просит перезвонить, нить держится','Договорились созвониться позже, не забудь время'],
 BOOKED:['Встреча назначена! Район дрогнул','CALL BOOKED, вот это победа','Встреча в календаре, босс уже нервничает'],
 DISCOVERY:['Discovery проведён, контракт почти твой','Разговор по делу состоялся, это редкость']};
const JUNK={TRASH:'Мусор',GATEKEEPER:'Ресепшен',MINOR:'Мелочь'};
const COL={TRASH:'#7d8590',GATEKEEPER:'#ff6b3d',MINOR:'#9aa4ad',TALK:'#39ff14',CALLBACK:'#4fd1ff',BOOKED:'#ffc400',DISCOVERY:'#e8e6ff',ev:'#ff2bd6',bad:'#ff1f3d'};
const pick=a=>a[Math.floor(Math.random()*a.length)];
export function feedPush(L,it,max=3){const top=L[0];
 if(it.junk&&top&&top.junk===it.junk){top.n++;top.x+=it.x||0;top.m+=it.m||0;top.t=it.t;top.text=it.text;return L}
 L.unshift({n:1,x:0,m:0,...it});if(L.length>max)L.length=max;return L}
export function makeFeed({now=Date.now,money=v=>'$'+Math.round(v)}={}){const L=[];let tunT=0;
 const hm=t=>new Date(t).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 const row=it=>`<li class="fd-i${it.fresh?' new':''}" style="--fc:${COL[it.c]||COL.ev}"><i></i><time>${hm(it.t)}</time><b>${it.junk?esc(JUNK[it.junk])+(it.n>1?` ×${it.n}`:''):esc(it.head||'')}</b><span>${esc(it.text)}</span>${it.x||it.m?`<em>+${Math.round(it.x)} XP · +${money(it.m)}</em>`:''}</li>`;
 const render=()=>{const el=document.getElementById('wk-feed');if(!el)return;
  el.innerHTML=`<div class="wk-lbl">ЛЕНТА ЭФИРА</div>`+(L.length?`<ul>${L.map(row).join('')}</ul>`:`<p class="fd-e">Тут появится, кто взял трубку и что открылось.</p>`);
  L.forEach(it=>it.fresh=0)};
 const add=it=>{feedPush(L,{t:now(),fresh:1,...it});render()};
 const status=(e,name)=>{if(!e||e.spam)return;const c=e.cls;
  if(JUNK[c])add({c,junk:c,text:pick(LORE[c]),x:e.x||0,m:e.m||0});
  else add({c,head:({TALK:'Разговор',CALLBACK:'Перезвон',BOOKED:'Встреча',DISCOVERY:'Discovery'})[c]||name||c,text:pick(LORE[c]||['Статус записан']),x:e.x||0,m:e.m||0});
  if(e.pen==='drop')add({c:'bad',head:'Окно сгорело',text:'Жар упал на ступень'});
  if(e.pen==='reset')add({c:'bad',head:'Перерыв',text:'Больше 40 минут без набора, серия с нуля'});
  if(e.odStart)add({c:'ev',head:'OVERDRIVE',text:'Разгон пошёл, разговоры сейчас стоят втрое'});
  if(e.captured)add({c:'BOOKED',head:'Район захвачен',text:'Открой карту, дальше мост'})};
 const event=(head,text,c='ev')=>add({c,head,text});
 // туннельное зрение: соединение → через 15 с затемнить края; отбой или статус → снять
 const tunnel=on=>{clearTimeout(tunT);if(on)tunT=setTimeout(()=>document.body.classList.add('ct-tunnel'),15000);else document.body.classList.remove('ct-tunnel')};
 return{status,event,render,tunnel,list:()=>L}}
export function runFeedTests(){const o=[],T=(nm,f)=>{try{o.push([nm,!!f()])}catch(e){o.push([nm+' ('+e.message+')',false])}};
 T('лента эфира: мусор подряд схлопывается в одну строку ×N',()=>{const L=[];for(let i=0;i<12;i++)feedPush(L,{junk:'TRASH',c:'TRASH',text:'x',x:8,m:6,t:i});return L.length===1&&L[0].n===12&&L[0].x===96});
 T('лента эфира: разговор разрывает мусор, длина ограничена',()=>{const L=[];feedPush(L,{junk:'TRASH',t:1});feedPush(L,{c:'TALK',head:'TALK',t:2});feedPush(L,{junk:'TRASH',t:3});for(let i=0;i<10;i++)feedPush(L,{c:'TALK',t:4+i});return L.length===3&&L[0].c==='TALK'});
 T('лента эфира: лор-строки на каждый класс, без «Тишины»',()=>['TRASH','GATEKEEPER','MINOR','TALK','CALLBACK','BOOKED','DISCOVERY'].every(k=>LORE[k]&&LORE[k].length>=2)&&!JSON.stringify(LORE).includes('ишин'));
 return o}
