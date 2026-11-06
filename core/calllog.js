// Кусок 27: ЖУРНАЛ ЗВОНКОВ для универсальной статистики (скрипты, штаты, местное время лида, дни недели).
// Одна строка = один звонок со статусом: [t сек, id статуса, штат, мин. местного времени лида (-1 нет), день недели лида (0=вс, -1 нет),
//   длительность Zoom сек (-1 нет), id скрипта (-1 = до журнала / из таблицы), хвост номера (7 цифр, для правки и длительности)].
// Хранится отдельным ключом localStorage ct_clog (не в ct1: ct1 копируется в ct1_bak, журнал на 20 000 звонков удвоил бы место).
import {TZ} from '../dialer/geo.js';
export const CL={key:'ct_clog',max:20000,fixH:6,durMin:40};
export const OWNER=[2,3,4,12,13,14],GATE=[5],PICK=[...OWNER,...GATE,6],PITCH=[3,4,14],MEET=[4,14],VM=[0,1,7],DEAD=[10],MENU=[8];
const tail=p=>{const s=String(p||'').replace(/\D/g,'');return s?+s.slice(-7):0};
const FMT={};const fmt=z=>FMT[z]||(FMT[z]=new Intl.DateTimeFormat('en-US',{timeZone:z,hour:'numeric',minute:'numeric',weekday:'short',hour12:false}));
const WD={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
export function leadClock(t,st){const z=TZ[String(st||'').toUpperCase()];if(!z)return[-1,-1];const P={};for(const x of fmt(z).formatToParts(new Date(t)))P[x.type]=x.value;
 return[((+P.hour)%24)*60+(+P.minute),WD[P.weekday]??-1]}
export const clLoad=(ls=globalThis.localStorage)=>{try{const r=JSON.parse(ls.getItem(CL.key)||'[]');return Array.isArray(r)?r:[]}catch(e){return[]}};
export const clSave=(L,ls=globalThis.localStorage)=>{try{ls.setItem(CL.key,JSON.stringify(L));return true}catch(e){return false}};
const lastBy=(L,ph,lo)=>{for(let i=L.length-1;i>=0&&L[i][0]>=lo;i--)if(L[i][7]===ph)return i;return -1};
// статус поставлен. changed — у лида уже был статус (правка): меняем последнюю строку этого номера за CL.fixH часов, а не добавляем
export function clAdd(L,{t,id,st,phone,sc=0,dur=-1,changed=false}){const ph=tail(phone),s=Math.round(t/1000);
 if(changed){const i=lastBy(L,ph,s-CL.fixH*3600);if(i>=0){L[i][1]=id;L[i][6]=sc;return L[i]}}
 const [lm,dw]=leadClock(t,st),r=[s,id,String(st||'').toUpperCase().slice(0,2),lm,dw,dur,sc,ph];L.push(r);if(L.length>CL.max)L.splice(0,L.length-CL.max);return r}
// «Убрать статус» / откат — последняя строка этого номера за CL.fixH часов исчезает
export function clDrop(L,phone,t){const i=lastBy(L,tail(phone),Math.round(t/1000)-CL.fixH*3600);if(i>=0){L.splice(i,1);return true}return false}
// Zoom прислал длительность (callLogged): к последней строке номера за CL.durMin минут
export function clDur(L,phone,dur,t){const i=lastBy(L,tail(phone),Math.round(t/1000)-CL.durMin*60);if(i<0||dur==null)return false;L[i][5]=Math.round(dur);return true}
// импорт истории из таблицы: [{res:id, eng:'2026-11-05 3:40 PM CST' | '2026-11-05', st, phone}] → строки со скриптом -1, без дублей по номеру и дню
export function parseEngaged(s){const m=String(s||'').match(/^(\d{4})-(\d\d)-(\d\d)(?:\s+(\d{1,2}):(\d\d)\s*([AP]M))?/i);if(!m)return null;
 const y=+m[1],mo=+m[2],d=+m[3];let lm=-1;if(m[4]){let h=+m[4]%12;if(/p/i.test(m[6]))h+=12;lm=h*60+(+m[5])}
 const dw=new Date(Date.UTC(y,mo-1,d)).getUTCDay();const t=new Date(y,mo-1,d,lm>=0?Math.floor(lm/60):12,lm>=0?lm%60:0).getTime();return{t,lm,dw}}
export function clImport(L,rows){const seen=new Set(L.map(r=>r[7]+'|'+Math.floor(r[0]/86400)));let add=0,skip=0;const A=[];
 for(const x of rows||[]){const e=parseEngaged(x.eng),ph=tail(x.phone);if(!e||x.res==null||x.res<0||!ph){skip++;continue}const s=Math.round(e.t/1000),k=ph+'|'+Math.floor(s/86400);
  if(seen.has(k)){skip++;continue}seen.add(k);A.push([s,x.res,String(x.st||'').toUpperCase().slice(0,2),e.lm,e.dw,-1,-1,ph]);add++}
 L.push(...A);L.sort((a,b)=>a[0]-b[0]);if(L.length>CL.max)L.splice(0,L.length-CL.max);return{add,skip,total:L.length}}
// ---------- статистика ----------
export const SLOTS=Array.from({length:22},(_,i)=>420+i*30);          // 7:00 … 17:30, шаг полчаса
export const slotOf=lm=>lm<0?-1:lm<420?0:lm>=1080?1080:420+Math.floor((lm-420)/30)*30;   // до 7:00 → «раньше 7», после 18:00 → «18:00+»
export const slotName=s=>s<0?'нет времени':s===0?'до 7:00':s===1080?'18:00 и позже':`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}–${Math.floor((s+30)/60)}:${String((s+30)%60).padStart(2,'0')}`;
export const DOW=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const dayOf=s=>{const d=new Date(s*1000);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
export const tzOf=st=>({'America/New_York':'Eastern','America/Chicago':'Central','America/Denver':'Mountain','America/Phoenix':'Mountain','America/Los_Angeles':'Pacific'})[TZ[st]]||'Другой';
// f: {sc:[], st:[], slot:[], dow:[], tz:[], from:'YYYY-MM-DD', to:'YYYY-MM-DD'} — пустой список = все
export function clFilter(L,f={}){const has=(a,v)=>!a||!a.length||a.includes(v);
 return L.filter(r=>has(f.sc,r[6])&&has(f.st,r[2])&&has(f.slot,slotOf(r[3]))&&has(f.dow,r[4])&&has(f.tz,tzOf(r[2]))&&(!f.from||dayOf(r[0])>=f.from)&&(!f.to||dayOf(r[0])<=f.to))}
export const GROUPS={all:['Всё вместе',()=>'all'],sc:['Скрипт',r=>r[6]],st:['Штат',r=>r[2]||'—'],tz:['Пояс',r=>tzOf(r[2])],slot:['Время у лида',r=>slotOf(r[3])],dow:['День недели лида',r=>r[4]],day:['Дата',r=>dayOf(r[0])],hour:['Мой час',r=>new Date(r[0]*1000).getHours()]};
export function agg(R){const c=new Array(15).fill(0);let dS=0,dN=0;for(const r of R){c[r[1]]=(c[r[1]]||0)+1;if(r[5]>0&&PICK.includes(r[1])){dS+=r[5];dN++}}
 const sum=a=>a.reduce((s,i)=>s+(c[i]||0),0),n=R.length;
 // активное время: промежутки между соседними звонками короче 15 минут (дольше — перерыв, не считаем)
 const T=R.map(r=>r[0]).sort((a,b)=>a-b);let act=0;for(let i=1;i<T.length;i++){const g=T[i]-T[i-1];if(g<900)act+=g}
 return{n,c,pick:sum(PICK),own:sum(OWNER),gate:sum(GATE),pitch:sum(PITCH),meet:sum(MEET),vm:sum(VM),dead:sum(DEAD),menu:sum(MENU),dS,dN,act,days:new Set(R.map(r=>dayOf(r[0]))).size}}
const pc=(a,b)=>b?a/b*100:null,per=(a,b)=>b?a/b*100:null;
// [ключ, название, функция(agg) → число|null, формат: 'n' штуки, '%' проценты, 'p' на 100 наборов, 's' секунды, 'h' в час]
export const METRICS=[['n','Наборы',a=>a.n,'n'],['pick','Пикапы (взял человек)',a=>a.pick,'n'],['pickR','Пикап-рейт',a=>pc(a.pick,a.n),'%'],
 ['own','Владельцы',a=>a.own,'n'],['ownS','Доля владельцев среди пикапов',a=>pc(a.own,a.pick),'%'],['gateS','Доля гейткиперов среди пикапов',a=>pc(a.gate,a.pick),'%'],
 ['own100','Владельцев на 100 наборов',a=>per(a.own,a.n),'p'],['pitch','Питчи',a=>a.pitch,'n'],['pitch100','Питчей на 100 наборов',a=>per(a.pitch,a.n),'p'],
 ['ownPitch','Владелец → питч',a=>pc(a.pitch,a.own),'%'],['meet','Встречи',a=>a.meet,'n'],['meet100','Встреч на 100 наборов',a=>per(a.meet,a.n),'p'],
 ['pitchMeet','Питч → встреча',a=>pc(a.meet,a.pitch),'%'],['ownMeet','Владелец → встреча',a=>pc(a.meet,a.own),'%'],['vmR','Автоответчики',a=>pc(a.vm,a.n),'%'],
 ['menuR','Меню (не мобильный)',a=>pc(a.menu,a.n),'%'],['deadR','Номер не рабочий',a=>pc(a.dead,a.n),'%'],['dur','Средний разговор (взял человек)',a=>a.dN?a.dS/a.dN:null,'s'],
 ['cph','Наборов в час (без перерывов)',a=>a.act>600?a.n/(a.act/3600):null,'h'],['perDay','Наборов в день',a=>a.days?a.n/a.days:null,'n']];
export const DEF_METRICS=['n','pickR','own100','pitch100','meet100','pitchMeet','vmR','dur'];
export function fmtM(v,k){if(v==null||!isFinite(v))return'—';if(k==='%')return(v>=10?v.toFixed(0):v.toFixed(1))+'%';if(k==='p')return v.toFixed(1);if(k==='s'){const m=Math.floor(v/60),s=Math.round(v%60);return m?`${m}:${String(s).padStart(2,'0')}`:s+' с'}if(k==='h')return v.toFixed(0);return Number.isInteger(v)?v.toLocaleString('ru'):v.toFixed(1)}
// таблица: [{key, name, a(agg)}], отсортировано: время и дни по порядку, остальное — по наборам
export function clTable(L,f,g='all',scName=id=>String(id)){const G=GROUPS[g]||GROUPS.all,M=new Map();for(const r of clFilter(L,f)){const k=G[1](r);if(!M.has(k))M.set(k,[]);M.get(k).push(r)}
 const nm=k=>g==='sc'?scName(k):g==='slot'?slotName(k):g==='dow'?DOW[k]||'—':g==='hour'?`${k}:00`:g==='all'?'Все звонки':String(k);
 const out=[...M].map(([k,R])=>({key:k,name:nm(k),a:agg(R)}));const ord=g==='slot'||g==='hour'||g==='day'?(x,y)=>x.key<y.key?-1:1:g==='dow'?(x,y)=>((x.key+6)%7)-((y.key+6)%7):(x,y)=>y.a.n-x.a.n;return out.sort(ord)}
export function runCallLogTests(){const o=[],T=(nm,f)=>{try{o.push([nm,!!f()])}catch(e){o.push([nm+' ('+e.message+')',false])}};
 const t0=new Date('2026-11-04T15:40:00Z').getTime();   // ср, 9:40 у Central (CST = UTC-6)
 T('журнал звонков: местное время и день недели лида по штату',()=>{const [lm,dw]=leadClock(t0,'TX');return lm===9*60+40&&dw===3});
 T('журнал звонков: правка статуса меняет строку, «убрать статус» удаляет, длительность Zoom цепляется',()=>{const L=[];clAdd(L,{t:t0,id:0,st:'TX',phone:'+1 501-838-9095',sc:1});clAdd(L,{t:t0+5e3,id:3,st:'TX',phone:'5018389095',sc:1,changed:true});
  const a=L.length===1&&L[0][1]===3;clDur(L,'5018389095',95,t0+6e4);const b=L[0][5]===95;clDrop(L,'5018389095',t0+7e4);return a&&b&&L.length===0});
 T('журнал звонков: лимит строк',()=>{const L=[];for(let i=0;i<CL.max+5;i++)L.push([i,0,'TX',-1,-1,-1,0,i]);clAdd(L,{t:t0,id:1,st:'TX',phone:'1'});return L.length===CL.max});
 T('журнал звонков: импорт из таблицы (Date Engaged старого и нового вида), без дублей',()=>{const L=[];const r=clImport(L,[{res:4,eng:'2026-11-05 3:40 PM CST',st:'TX',phone:'111'},{res:0,eng:'2026-11-05',st:'NY',phone:'222'},{res:0,eng:'2026-11-05',st:'NY',phone:'222'},{res:-1,eng:'2026-11-05',phone:'3'}]);
  const x=L.find(r=>r[2]==='TX'),y=L.find(r=>r[2]==='NY');return r.add===2&&r.skip===2&&x[3]===15*60+40&&x[4]===4&&y[3]===-1&&x[6]===-1});
 T('статистика: пикапы, питчи только 3/4/14, встречи 4/14, проценты',()=>{const L=[0,0,0,0,5,3,4,2,10,14].map((id,i)=>[i*60,id,'TX',600,3,id===4?300:-1,0,i]);const a=agg(L),m=k=>METRICS.find(x=>x[0]===k)[2](a);
  return a.n===10&&a.pick===5&&a.own===4&&a.pitch===3&&a.meet===2&&m('pickR')===50&&m('pitchMeet').toFixed(0)==='67'&&m('deadR')===10&&m('dur')===300&&fmtM(300,'s')==='5:00'});
 T('статистика: фильтры и группировка по слотам времени лида и дням недели',()=>{const L=[[0,0,'TX',425,1,-1,1,1],[60,3,'TX',455,1,-1,2,2],[120,4,'NY',1100,5,-1,2,3]];
  const s=clTable(L,{},'slot'),d=clTable(L,{sc:[2]},'dow'),z=clTable(L,{tz:['Eastern']},'all');return s.map(x=>x.name).join()==='7:00–7:30,7:30–8:00,18:00 и позже'&&d.length===2&&d[0].name==='Пн'&&z[0].a.n===1&&slotName(780)==='13:00–13:30'});
 return o}
