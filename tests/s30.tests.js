import {mkS,N0,L,zc} from './addict.tests.js';
import {newState} from '../core/engine.js';
import {districtThr} from '../core/config.js';
import {dayKey} from '../core/stats.js';
import {purgePreview,nightly,ensure} from '../core/addict.js';
import {warnOn} from '../ui/work/normwarn.js';
export function runS30Tests(){const r=[],T=(s,f)=>{try{r.push([s,!!f()])}catch(e){r.push([s+' '+e.message,false])}};
 T('штраф: 10% полного района, не текущего остатка, если это больше 30 звонков',()=>{const root={},g=newState(N0);g.district=12;g.dxp=districtThr(12);const p=purgePreview(root,g,N0,99);return p.dx===Math.round(districtThr(12)*.1)&&p.left===1});
 T('штраф: минимум 30 звонков по недавнему среднему, с ограничением накопленным',()=>{const root={days:{[dayKey(N0-864e5)]:{n:50,xp:5000}}},g=newState(N0);g.dxp=3200;let p=purgePreview(root,g,N0,99);g.dxp=400;let q=purgePreview(root,g,N0,99);return p.dx===3000&&p.calls===30&&q.dx===400});
 T('штраф: защита применяется и при выполненной норме нет списания',()=>{const root={},g=newState(N0);g.dxp=3000;ensure(root).tree.grit=1;const p=purgePreview(root,g,N0,1),q=purgePreview(root,g,N0,100);return p.dx===966&&q.dx===0});
 T('прогноз и ночное списание совпадают по прошлой истории',()=>{const root={days:{[dayKey(N0-864e5)]:{n:50,xp:2500},[dayKey(N0)]:{n:40,xp:99999}}},g=newState(N0);g.dxp=3400;ensure(root).purge.chk=dayKey(N0-864e5);const p=purgePreview(root,g,N0,40),o=nightly(root,g,N0+864e5);return o[0].dx===p.dx&&o[0].dx===1500});
 T('пять ручных встреч дают полную награду и отметку без Zoom, шестую нельзя; после смены дня снова пять',()=>{const o=mkS(N0);for(let i=0;i<5;i++){o.clock.t=N0+i*70000;const x=o.s.setStatus(14,L(i),{manualWin:true});if(!x.ev||x.ev.cls!=='DISCOVERY'||!x.trophy||x.trophy.verified!=='UNVERIFIED'||x.ev.settle||!x.meta.manualWin)return false}const x=o.s.setStatus(14,L(6),{manualWin:true});return x.blocked==='manualLimit'&&o.s.manualLeft()===0&&o.s.manualLeft(N0+864e5)===5});
 T('ручное подтверждение не потребляет попытку при закрытом доступе или неверном статусе',()=>{const o=mkS(N0);o.s.setGate(()=>({ok:false,code:'none'}));let a=o.s.setStatus(14,L(1),{manualWin:true});o.s.setGate(()=>({ok:true}));let b=o.s.setStatus(0,L(1),{manualWin:true});return !!a.blocked&&!!b.blocked&&o.s.manualLeft()===5});
 T('слишком быстрый ручной статус не пишет и не расходует лимит',()=>{const o=mkS(N0);o.s.setStatus(2,L(1));const check=o.s.precheck(14,L(2),{now:N0+1000,manualWin:true}),x=o.s.setStatus(14,L(2),{now:N0+1000,manualWin:true});return !check.ok&&check.why==='manualWait'&&x.blocked==='manualWait'&&o.s.manualLeft()===5});
 T('ручное подтверждение не связывает чужой или короткий Zoom-звонок и не создаёт бонус',()=>{const o=mkS(N0);zc(o,L(1),30);const x=o.s.setStatus(14,L(1),{manualWin:true});return x.ev.cls==='DISCOVERY'&&!x.ev.settle&&x.meta.verified==='UNVERIFIED'&&o.s.G.undo.at(-1).manualWin===1});
 T('лимит сохраняется при повторном создании сессии и не возвращается при отмене',()=>{const o=mkS(N0);o.s.setStatus(14,L(1),{manualWin:true});o.s.dropLead(L(1).key,N0+1000);const p=mkS(N0+1000,o.root);return p.s.manualLeft()===4});
 T('тишина предупреждений до 13:50 и после 00:50 по локальным часам',()=>{const d=(h,m)=>new Date(2026,10,4,h,m).getTime();return warnOn(0,100,d(0,49))&&!warnOn(0,100,d(0,50))&&!warnOn(0,100,d(13,49))&&warnOn(0,100,d(13,50))});
 return r}
