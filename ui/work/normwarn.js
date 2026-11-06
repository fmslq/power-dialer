// К24: предупреждения о штрафе за невыполненную норму звонков (Ночная чистка, core/addict.js nightly).
// Первое — сразу после запуска (через 20–40 с; занято окном — повтор каждые 10 с), дальше — изредка, раз в 18–35 минут.
// Как только норма дня выполнена (или день выходной), больше не появляются. Не всплывают поверх сцен, окон и звонка — ждут.
import {AD} from '../../core/addict.js';
import {isWork} from '../../core/stats.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// текст предупреждения: k — номер показа (чтобы тексты чередовались), st — {n, norm, ops, nd, shield}
export function warnText(st,k=0){const {n,norm}=st,left=Math.max(0,norm-n),L=[];
 L.push(`Сегодня ${n} из ${norm} звонков. Если не доделаешь норму до конца дня, ночью ARCHON проведёт чистку и заберёт часть XP и денег.`);
 L.push(`До нормы осталось ${left} звонков. Если не дойдёшь до нормы, ночью снимут XP и деньги. Чем больше звонков, тем меньше потеря денег.`);
 if(st.ops>0&&n<norm/2)L.push(`Ты сделал меньше половины нормы. Если так и останется, ночью от тебя может уйти один связист. Сейчас ${n} из ${norm}.`);
 if(st.nd>0)L.push(`Ты выполнял норму ${st.nd} ${st.nd===1?'день':st.nd<5?'дня':'дней'} подряд, и за это идёт прибавка. Если сегодня не сделаешь норму, серия и прибавка обнулятся. До нормы ${left}.`);
 if(st.shield>0)L.push(`У тебя есть щит: одну ночную чистку он отобьёт. Но лучше его не тратить, до нормы осталось ${left}.`);
 return L[k%L.length]}
export const warnOn=(n,norm,t)=>{const d=new Date(t),m=d.getHours()*60+d.getMinutes();return isWork(t)&&n<norm&&(m<50||m>=830)};
const num=v=>Math.round(v||0).toLocaleString('ru');
// Цена недобора в цифрах (кусок 26б): p — purgePreview() из core/addict.js
export function costText(p){if(!p||p.left<=0||(!(p.dx>0)&&!(p.dm>0)&&!p.op))return'';
 if(p.shield>0)return`Сейчас щит отобьёт чистку. Без щита ночью ушло бы ${num(p.dx)} XP и $${num(p.dm)}.`;
 const pc=p.pct>=1?Math.round(p.pct):p.pct.toFixed(1);
 return`Если так и останется, ночью снимут <b>${num(p.dx)} XP</b> (это ${pc}% пути по району, примерно ${p.calls} ${p.calls%10===1&&p.calls%100!==11?'звонок':p.calls%10>=2&&p.calls%10<=4&&(p.calls%100<12||p.calls%100>14)?'звонка':'звонков'} работы) и <b>$${num(p.dm)}</b>${p.op?' и одного связиста':''}${p.lostStreak?`, а серия нормы (${p.lostStreak} дн.) обнулится`:''}. Звонки уменьшают потерю денег; выполни норму, чтобы избежать чистки.`}
// Нарастание (кусок 26в): уровень по минутам без звонков. Чем выше — тем чаще, громче, неприятнее и ярче.
export const warnLevel=idle=>idle>=40?3:idle>=20?2:idle>=10?1:0;
export const WARN_GAP=[[18,35],[10,15],[6,9],[3,5]];         // минуты до следующего показа на каждом уровне
export const WARN_HOLD=[11000,14000,22000,0];                  // сколько висит; 0 — пока не позвонишь или не закроешь
export function makeNormWarn({now=Date.now,dayN=()=>0,save,busy=()=>false,sfx=()=>{},preview=()=>null,idle=()=>0,docked=()=>false}){
 let k=0,tm=0,el=null;const rnd=(a,b)=>a+Math.random()*(b-a);
 const st=()=>{const a=(save.ad||{});return{n:dayN(),norm:AD.norm,ops:((a.ops||{}).n|0),nd:a.normDays|0,shield:a.shield|0}};
 const hide=()=>{document.body.classList.remove('nw-docked');if(!el)return;const e=el;el=null;e.classList.remove('in');setTimeout(()=>e.remove(),300)};
 let lv=0,dockT=0;
 const show=()=>{const s=st();if(!warnOn(s.n,s.norm,now()))return false;hide();const mins=idle();lv=warnLevel(mins);const im=mins==null?null:Math.floor(mins);
  el=document.createElement('div');el.className='nw nw-l'+lv+(docked()?' dock':'');el.setAttribute('role','status');
  el.innerHTML=`<i class="nw-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></i>
   <div class="nw-b"><b>${lv>=2?`Ты не звонишь уже ${im} мин. Норма не выполнена`:lv===1?`${im} минут без звонков. Штраф за норму всё ближе`:'Штраф за невыполненную норму'}</b><p>${esc(warnText(s,k++))}</p>${(()=>{const c=costText(preview(s.n));return c?`<p class="nw-c">${c}</p>`:''})()}<span class="nw-p"><i style="--p:${Math.min(100,s.n/s.norm*100).toFixed(0)}%"></i><em>${s.n}/${s.norm}</em></span></div>
   <button class="nw-x" aria-label="Закрыть"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
  el.onclick=hide;document.body.appendChild(el);requestAnimationFrame(()=>el&&el.classList.add('in'));sfx('warn'+lv);
  clearInterval(dockT);dockT=setInterval(()=>{if(!el){clearInterval(dockT);return}const dk=docked();el.classList.toggle('dock',dk);document.body.classList.toggle('nw-docked',dk)},400);
  const hold=WARN_HOLD[lv];if(hold){const e0=el;setTimeout(()=>{if(el===e0&&!el.matches(':hover'))hide()},hold)}return true};
 const plan=ms=>{clearTimeout(tm);tm=setTimeout(tick,ms)};
 const tick=()=>{const s=st();if(!warnOn(s.n,s.norm,now())){plan(5*60e3);return}   // норма есть — молчим; проверим позже (вдруг наступил новый день)
  if(busy()){plan(10e3);return}show();const g=WARN_GAP[lv];plan(rnd(g[0],g[1])*60e3)};
 const start=()=>plan(rnd(20,40)*1e3);   // кусок 26б: первое — сразу после входа (через 20–40 с), а не через 1–4 минуты
 const check=()=>{if(el){const s=st();if(!warnOn(s.n,s.norm,now())||(lv>=2&&idle()!=null&&idle()<1))hide()}};   // норма выполнена или ты снова звонишь — убрать   // после каждого звонка: норма выполнена — убрать сразу
 return{start,show,hide,check}}
export function runNormWarnTests(){const o=[],T=(nm,f)=>{try{o.push([nm,!!f()])}catch(e){o.push([nm+' ('+e.message+')',false])}};
 const wd=new Date('2026-11-04T14:00:00').getTime(),we=new Date('2026-11-07T12:00:00').getTime();
 T('предупреждение о норме: только в рабочий день и пока норма не выполнена',()=>warnOn(10,100,wd)&&!warnOn(100,100,wd)&&!warnOn(5,100,we));
 T('предупреждение: по часам ноутбука 00:50–13:49 тихо; 00:49 и 13:50 разрешено',()=>{const t=(h,m)=>new Date(2026,10,4,h,m).getTime();return warnOn(1,100,t(0,49))&&!warnOn(1,100,t(0,50))&&!warnOn(1,100,t(13,49))&&warnOn(1,100,t(13,50))});
 T('предупреждение о норме: тексты чередуются и честно говорят о последствиях',()=>{const s={n:20,norm:100,ops:2,nd:3,shield:1},a=[0,1,2,3,4].map(k=>warnText(s,k));return new Set(a).size===5&&a[0].includes('20 из 100')&&a[2].includes('связист')&&a[3].includes('3 дня')});
 T('предупреждение о норме: нарастает — 5/15/30/50 минут без звонков = уровни 0/1/2/3, чем выше, тем чаще и дольше висит',()=>[5,15,30,50].map(warnLevel).join()==='0,1,2,3'&&WARN_GAP[3][1]<WARN_GAP[0][0]&&WARN_HOLD[3]===0);
 T('предупреждение о норме: цена в цифрах — XP, доля района, звонки, деньги; щит и выполненная норма',()=>{const c=costText({left:60,dx:1234,dm:560,pct:4.2,calls:35,op:1,shield:0,lostStreak:3}).replace(/\s/g,' ');return c.includes('1 234 XP')&&c.includes('4% пути')&&c.includes('35 звонков')&&c.includes('$560')&&c.includes('связиста')&&c.includes('3 дн.')&&/щит/.test(costText({left:10,dx:5,dm:5,pct:.1,calls:1,shield:1}))&&costText({left:0})===''});
 return o}
