import {idleMinutes} from '../core/lastdial.js';
import {dayKey} from '../core/stats.js';
import {nightly,ensure} from '../core/addict.js';
import {newState} from '../core/engine.js';
import {mkS} from './addict.tests.js';
import {OWNER,GATE,PICK,PITCH,MEET,agg} from '../core/calllog.js';
import {underSvg} from '../ui/under/under.js';
import * as CO from '../core/collector.js';
export function runS31Tests(){const r=[],T=(s,f)=>{try{r.push([s,!!f()])}catch(e){r.push([s+' '+e.message,false])}};
 T('таймер набора: точные 3 часа, после перезагрузки, активный звонок',()=>{const n=Date.now(),a={lastDialAt:n-10800000};return idleMinutes(a,n)===180&&idleMinutes(JSON.parse(JSON.stringify(a)),n)===180&&idleMinutes(a,n,true)===0});
 T('таймер набора: нет точных данных или дата в будущем — не выдумывать минуты',()=>idleMinutes({game:{last:1}},Date.now())===null&&idleMinutes({lastDialAt:Date.now()+1e6},Date.now())===null);
 T('ночная чистка при переходе на 10:00 не откатывает пройденный день',()=>{const n=new Date(2026,10,6,8).getTime(),root={},g=newState(n),old='2026-11-05';ensure(root).purge.chk=old;nightly(root,g,n);return root.ad.purge.chk===old});
 T('лимит ручных статусов не сбрасывается раньше 10 при обновлении старого сохранения',()=>{const n=new Date(2026,10,6,8).getTime(),root={manualWins:{day:'2026-11-06',used:4}};const a=mkS(n,root);return a.s.manualLeft(n)===1&&a.root.manualWins.day===dayKey(n)&&a.s.manualLeft(new Date(2026,10,6,10).getTime())===5});
 T('владелец всегда пикап; гейткипер и другое тоже пикапы; категории пересекаются',()=>{const o=[2,3,4,12,13,14];return JSON.stringify(OWNER)===JSON.stringify(o)&&o.every(i=>PICK.includes(i))&&GATE.every(i=>PICK.includes(i))&&PICK.includes(6)&&PITCH.every(i=>OWNER.includes(i))&&MEET.every(i=>PICK.includes(i))&&agg(o.map(id=>[1,id,'AR',1,1,0,0,1])).pick===6});
 T('коллектор: маршрут обходчика только при доме и связисте',()=>{const x=CO.colEnsure({ops:{n:1}});x.plot=1;x.bld=['tent'];const yes=underSvg({o:x,st:0,district:1,sel:-1,n:1}).svg;const no=underSvg({o:x,st:0,district:1,sel:-1,n:0}).svg;return yes.includes('ug-actor')&&yes.includes('ug-lift')&&!yes.includes('ug-walk')&&!no.includes('ug-actor')});
 return r}
