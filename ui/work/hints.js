// Кусок 25 (сверка, ТЗ §7): контекстные подсказки Гудка при первом событии. Тексты — story/guide.js HINTS.
// Каждая показывается один раз за всю игру (save.hints[key] = время), через рацию, не блокирует ввод.
import {HINTS} from '../../story/guide.js';
export const HINT_MOOD={firstBooked:'happy',firstStamp:'happy',firstStreakBreak:'sarcastic',bossPhase:'warning',finishHim:'warning',firstOverdrive:'happy',newDistrict:'happy',emptyDay:'talking',levelUp:'happy'};
export function hintOnce(save,key,now=Date.now()){if(!HINTS[key])return false;const h=save.hints||(save.hints={});if(h[key])return false;h[key]=now;return true}
// какие подсказки положены после статуса: e — событие движка, out — итог сессии, st — состояние босса, day — {n, booked}
export function hintsFor(e,out,st,day){const k=[];if(!e||e.spam)return k;
 if(e.cls==='BOOKED')k.push('firstBooked');if(out&&out.trophy)k.push('firstStamp');if(e.pen==='drop')k.push('firstStreakBreak');   // кусок 26в: 'reset' (долгий перерыв, новый день) — не «сгорела серия», её и не было
 if(e.odStart)k.push('firstOverdrive');if(e.captured)k.push('newDistrict');else if(st==='finish')k.push('finishHim');else if(st==='boss')k.push('bossPhase');
 if(out&&out.levelUp!=null)k.push('levelUp');if(day&&day.n>=100&&!day.booked)k.push('emptyDay');return k}
export function makeHints({save,say,persist=()=>{}}){
 const show=(key,now)=>{if(!hintOnce(save,key,now))return false;persist();setTimeout(()=>say({who:'guide',mood:HINT_MOOD[key]||'talking',text:HINTS[key]},'hint-'+key,0),1600);return true};
 const after=(e,out,st,day,now=Date.now())=>hintsFor(e,out,st,day).slice(0,1).forEach(k=>show(k,now));   // не больше одной за статус
 return{show,after}}
export function runHintTests(){const o=[],T=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 T('подсказки: каждая один раз за игру',()=>{const s={};return hintOnce(s,'firstBooked',1)&&!hintOnce(s,'firstBooked',2)&&!hintOnce(s,'nope',3)});
 T('подсказки: встреча, срыв серии, фаза босса, добивание, пустой день',()=>{const a=hintsFor({cls:'BOOKED'},{trophy:{}},'scenery',{n:5,booked:1}),b=hintsFor({cls:'TRASH',pen:'drop'},{},'boss',{n:100,booked:0}),c=hintsFor({cls:'TALK'},{},'finish',{n:1});
  return a[0]==='firstBooked'&&a.includes('firstStamp')&&b.includes('firstStreakBreak')&&b.includes('bossPhase')&&b.includes('emptyDay')&&c.includes('finishHim')&&!hintsFor({cls:'TALK',spam:1},{},'boss').length});
 return o}
