import {record,unrecord,dominance,rankOf,levelOf,window3,dayKey,isWork,ironWeek,nextRank} from '../core/stats.js';import {runAchvTests} from '../core/achv.js';
const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
const at=(y,m,d,h=12)=>new Date(y,m-1,d,h).getTime(),ev=c=>({cls:c,x:10,m:5});
t('запись и откат статуса',()=>{const r={},n=at(2026,11,2);record(r,ev('BOOKED'),n);unrecord(r,{t:n,cls:'BOOKED',x:10,m:5});return r.days[dayKey(n)].n===0&&r.life.booked===0});
t('окно: понедельник захватывает пятницу-среду, выходные внутри',()=>{const k=window3(at(2026,11,2));return k.length===5&&k[0]==='2026-11-02'});
t('выходные не штрафуются, но звонки в них считаются',()=>{const r={};record(r,ev('BOOKED'),at(2026,11,1));return dominance(r,at(2026,11,2)).pts===10});
t('3 рабочих без звонков = idle (база обесточена)',()=>dominance({days:{}},at(2026,11,4)).idle===true);
t('ранги по порогам 100/250/400/650',()=>[0,99,100,250,400,650].map(rankOf).join()==='0,0,1,2,3,4');
t('до следующего ранга',()=>nextRank(380).left===20&&nextRank(700)===null);
t('15 уровней по XP',()=>levelOf(0)===0&&levelOf(1500)===1&&levelOf(1.1e6)===14);
t('Iron Week: 5 рабочих по 100+',()=>{const r={days:{}};for(const d of[26,27,28,29,30])r.days['2026-10-'+d]={n:120};return ironWeek(r,at(2026,10,30))===5});
t('железный стандарт 3×100 даёт ~420 очков',()=>{const r={};for(const d of[28,29,30]){for(let i=0;i<100;i++){const c=i<45?'TRASH':i<65?'GATEKEEPER':i<87?'TALK':i<93?'CALLBACK':i<99?'MINOR':'BOOKED';record(r,ev(c),at(2026,10,d))}}const p=dominance(r,at(2026,10,30)).pts;return p>=330&&p<=480});
t('часы для тепловой карты: запись и откат',()=>{const r={},n=at(2026,11,2,10);record(r,ev('TALK'),n);record(r,ev('TRASH'),n+6e4);const a=r.days[dayKey(n)].h[10];unrecord(r,{t:n,cls:'TALK',x:10,m:5});return a===2&&r.days[dayKey(n)].h[10]===1});
export const run=()=>[...o,...runAchvTests()];
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('stats.tests.js')){const r=run();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL (stats)')}
import {runMissionTests} from '../core/missions.js';
if(typeof process!=='undefined'&&process.argv[1]&&process.argv[1].endsWith('stats.tests.js')){const r=runMissionTests();r.forEach(([n,ok])=>console.log(ok?'PASS':'FAIL',n));console.log(r.filter(x=>!x[1]).length+' FAIL (missions)')}
