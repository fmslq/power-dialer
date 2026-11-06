// Кусок 28: игровые сутки с 5:00, часы лидов в ачивках и бонусах, находки не чаще раза в 25 неудач, без щита, автонабор ждёт окно находки.
import {dayKey,isWork,usHour,DAY_START} from '../core/stats.js';
import * as A from '../core/addict.js';
import {ACH} from '../core/achv.js';
import {newState} from '../core/engine.js';
import {itemTotals} from '../core/buffs.js';
export function runS28Tests(){const o=[],T=(nm,f)=>{try{o.push([nm,!!f()])}catch(e){o.push([nm+' ('+e.message+')',false])}};
 T('сутки игры начинаются в 10:00: 09:59 — вчера, 10:00 — сегодня',()=>{const a=new Date(2026,10,6,23,50).getTime(),b=new Date(2026,10,7,9,59).getTime(),c=new Date(2026,10,7,10,0).getTime();
  return DAY_START===10&&dayKey(a)===dayKey(b)&&dayKey(c)!==dayKey(b)&&isWork(b)});
 T('часы лидов: 16:22 у Central = 0:22 в Киеве; без штата — по Central',()=>{const t=Date.UTC(2026,10,5,22,22);return usHour(t,'AR')===16&&usHour(t,'NY')===17&&usHour(t,'')===16});
 T('«Жаворонок» и «Сова» по часам лидов: в 0:22 по Киеву (16:22 у лида) жаворонка нет',()=>{const E=ACH.find(a=>a.id==='early'),W=ACH.find(a=>a.id==='owl'),t=Date.UTC(2026,10,5,22,22);
  return!E.f({d:{first:t},st:'AR'})&&E.f({d:{first:Date.UTC(2026,10,5,13,30)},st:'AR'})&&!W.f({now:t,st:'AR'})&&W.f({now:Date.UTC(2026,10,5,23,30),st:'AR'})});
 T('ночной бонус предметов — по часу лида (16:00+)',()=>{const id=Object.keys({d4t1:1})[0];return itemTotals({[id]:1},50,16).xAll>itemTotals({[id]:1},50,15).xAll});
 T('«Ключ от щитовой» (пропуск ночной чистки) больше не выпадает, старые щиты → Сигнал',()=>{const r={ad:{...A.DEF(),shield:2,sig:0,sigLife:0}};delete r.ad.noShield;A.ensure(r);return!A.LOOT.some(x=>x.shield)&&r.ad.shield===0&&r.ad.sig===300});
 T('находки не чаще раза в 25 неудач (CALL BOOKED и Discovery не в счёт)',()=>{const root={},G=newState(Date.now());G.district=1;let t=Date.UTC(2026,10,4,15),got=[],n=0;
  for(let i=0;i<400;i++){t+=60e3;const cls=i%37===36?'BOOKED':'TRASH';const r=A.adAfter(root,G,{cls,x:1,m:1},t,{state:'AR',dayN:i,rnd:()=>0.001});if(cls!=='BOOKED')n++;if(r&&r.spin&&!r.spin.track){got.push(n);n=0}}
  return got.length>3&&got.slice(1).every(g=>g>=25)});
 T('Trash Cleared: секретки за 10 и 20 мусорных подряд, встреча в середине сбивает',()=>{const a=ACH.find(x=>x.id==='eggtr10'),b=ACH.find(x=>x.id==='eggtr20'),tr=n=>Array(n).fill('TRASH');
  return a.hid&&b.hid&&a.f({root:{recent:tr(10)}})&&!a.f({root:{recent:[...tr(9),'TALK']}})&&!b.f({root:{recent:[...tr(10),'BOOKED',...tr(9)]}})&&b.f({root:{recent:tr(20)}})});
 return o}
