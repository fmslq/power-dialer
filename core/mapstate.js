// Состояние карты мира (R2) — чистые функции, без DOM. Хранится в root.map: {open:[районы], pos:район фигурки, seen:[раскрытые с анимацией], theme}.
// Открыт = район ≤ текущего (G.district). Захвачен = меньше текущего. Фигурка стоит только на открытом районе.
import {CONFIG as C,districtThr} from './config.js';
import {bossState} from './engine.js';
export const WORLD={w:3600,h:2400};
// Узлы маршрута: восхождение снизу слева (земля, ржавчина) вверх направо (облака, космос). [x, y, радиус острова]
export const NODES=[[330,2080,230],[830,1890,215],[1330,2070,225],[1770,1790,220],[1360,1470,215],[1900,1250,225],[2430,1420,215],[2920,1160,230],[2480,860,240],[2990,610,215],[2470,370,210],[3220,250,235]];
export function mapState(root,G){const m=root.map||(root.map={open:[1],pos:1,fog:{}});const cur=Math.max(1,Math.min(12,G.district||1));
 const open=Array.from({length:cur},(_,i)=>i+1);m.open=open;if(!(m.pos>=1&&m.pos<=cur))m.pos=cur;m.seen=Array.isArray(m.seen)?m.seen.filter(d=>d<=cur):[];
 if(m.theme!=='radar')m.theme='art';
 const st=d=>d<cur?'captured':d>cur?'locked':(bossState(G)==='finish'?'finish':bossState(G)==='boss'?'boss':'current');
 return{cur,open,pos:m.pos,theme:m.theme,reveal:open.filter(d=>d>1&&!m.seen.includes(d)),state:st,
  pct:d=>d<cur?100:d>cur?0:Math.max(0,Math.min(99,Math.floor(G.dxp/districtThr(d)*100)))}}
export const markSeen=(root,d)=>{const m=root.map;if(!m.seen.includes(d))m.seen.push(d)};
export const moveTo=(root,G,d)=>{const s=mapState(root,G);if(d<1||d>s.cur)return false;root.map.pos=d;return true};
// Камера: весь мир вписан в окно — уровень 1; район — уровень 2; деталь района — уровень 3.
export const fitScale=(vw,vh)=>Math.min(vw/WORLD.w,vh/WORLD.h)*0.96;
export const LEVEL_MULT=[1,2.7,5.2];
export const levelOf=(s,fit)=>s<fit*1.6?0:s<fit*3.8?1:2;
// pr/pb — сколько экрана справа/снизу может быть «пустым» за краем мира (под карточкой района)
export function clampCam(cam,vw,vh,pr=.25,pb=.25){const s=cam.s,ax=(v,w,p,c)=>{if(w<=v){const mid=(v-w)/2;if(p<=.25)return mid;return Math.min(mid,Math.max(v*(1-p)-w,c))}return Math.min(v*.25,Math.max(v*(1-p)-w,c))};
 return{s,x:ax(vw,WORLD.w*s,pr,cam.x),y:ax(vh,WORLD.h*s,pb,cam.y)}}
export const camOn=(x,y,s,vw,vh)=>({s,x:vw/2-x*s,y:vh/2-y*s});
// Путь фигурки между районами: по узлам маршрута, без срезов (Fallout/Cuphead: идёт от точки к точке).
export const pathBetween=(a,b)=>{const o=[];const st=a<b?1:-1;for(let d=a;d!==b+st;d+=st)o.push(d);return o};
export function runMapTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 const G=(d,dxp=0)=>({district:d,dxp});
 t('карта: открыты районы до текущего, остальные в тумане',()=>{const r={};const s=mapState(r,G(4));return s.open.join()==='1,2,3,4'&&s.state(3)==='captured'&&s.state(5)==='locked'&&s.state(4)==='current'});
 t('карта: после перезагрузки всё то же (открытые, фигурка, без повторной анимации)',()=>{const r={};mapState(r,G(3));moveTo(r,G(3),2);markSeen(r,2);markSeen(r,3);const j=JSON.parse(JSON.stringify(r));const s=mapState(j,G(3));return s.pos===2&&s.reveal.length===0&&s.open.length===3});
 t('карта: новый открытый район раскрывается один раз',()=>{const r={};const a=mapState(r,G(2));markSeen(r,2);const b=mapState(r,G(2));return a.reveal.join()==='2'&&b.reveal.length===0});
 t('карта: на закрытый район фигурка не идёт',()=>{const r={};mapState(r,G(2));const p0=r.map.pos;return moveTo(r,G(2),5)===false&&r.map.pos===p0&&moveTo(r,G(2),2)&&r.map.pos===2});
 t('карта: процент захвата текущего района, не больше 99 до захвата',()=>{const r={},thr=districtThr(1);const s=mapState(r,G(1,thr*.5));return s.pct(1)===50&&mapState(r,G(1,thr*5)).pct(1)===99});
 t('карта: путь по узлам в обе стороны',()=>pathBetween(2,5).join()==='2,3,4,5'&&pathBetween(4,1).join()==='4,3,2,1');
 t('камера: мир вписан и не уезжает за край',()=>{const f=fitScale(1280,720);const c=clampCam({s:f,x:-5000,y:9000},1280,720);return f>0&&c.x>=0&&c.y>=0});
 t('камера: под карточкой района можно сдвинуть край мира выше',()=>{const s=1,a=clampCam({s,x:0,y:-1e5},400,800),b=clampCam({s,x:0,y:-1e5},400,800,.25,.6);return b.y<a.y&&b.y===800*.4-WORLD.h});
 t('камера: уровни зума 1/2/3',()=>{const f=.3;return levelOf(f,f)===0&&levelOf(f*LEVEL_MULT[1],f)===1&&levelOf(f*LEVEL_MULT[2],f)===2});
 t('12 узлов маршрута в пределах мира',()=>NODES.length===12&&NODES.every(([x,y])=>x>0&&x<WORLD.w&&y>0&&y<WORLD.h));
 return o}
