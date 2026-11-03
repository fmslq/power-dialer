// КАРТА МИРА кодом (R2): единый город КОНГЛОМЕРАТ (районы-ячейки) на маршруте восхождения, достопримечательности, гербы, фигурка Звонаря.
// Всё — SVG-строки. Любой слой заменяется картинкой из генератора по id (см. ART_PROMPTS.md v2): world-bg, dist-<n>, crest-<n>, caller.
import {WORLD,NODES} from '../core/mapstate.js';
import {DIST} from '../core/meta.js';
const rng=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296);
const f1=v=>Math.round(v*10)/10;
// гладкий замкнутый контур через точки (Catmull-Rom → кубические кривые)
const smooth=pts=>{const n=pts.length;let d=`M${f1(pts[0][0])} ${f1(pts[0][1])}`;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
 d+=`C${f1(p1[0]+(p2[0]-p0[0])/6)} ${f1(p1[1]+(p2[1]-p0[1])/6)} ${f1(p2[0]-(p3[0]-p1[0])/6)} ${f1(p2[1]-(p3[1]-p1[1])/6)} ${f1(p2[0])} ${f1(p2[1])}`}return d+'Z'};
export const blob=(cx,cy,R,seed,sq=.62)=>{const r=rng(seed*7919+13),a=r()*6,b=r()*6,pts=[];for(let i=0;i<26;i++){const t=i/26*Math.PI*2,k=1+.13*Math.sin(3*t+a)+.08*Math.sin(5*t+b)+.05*(r()-.5);pts.push([cx+Math.cos(t)*R*k,cy+Math.sin(t)*R*k*sq])}return smooth(pts)};
// палитры тем: верх острова, обрыв, тёмный низ, акцент
export const PAL={industrial:['#7a5634','#4a321d','#24170c','#ffb26b'],neon:['#33264a','#1d1430','#0c0818','#ff2bd6'],chrome:['#4b5866','#2a333d','#12171c','#dfe9f2'],blackgold:['#3a3122','#1f190f','#0d0a05','#ffc400'],orbital:['#22344a','#142131','#070d16','#7fd7ff']};
const palOf=i=>PAL[(DIST[i]||[])[2]]||PAL.industrial;
// ---------- достопримечательности (своя у каждого района), локальные координаты: центр (0,0), ширина ~220 ----------
const win=(x,y,w,h,c,n,m)=>{let s='';for(let i=0;i<n;i++)for(let j=0;j<m;j++)if((i*7+j*3)%5)s+=`<rect x="${f1(x+4+i*(w-8)/n)}" y="${f1(y+6+j*(h-12)/m)}" width="${f1((w-8)/n*.5)}" height="${f1((h-12)/m*.45)}" fill="${c}" opacity="${((i+j)%3)*.25+.4}"/>`;return s};
const LM=[
 a=>`<path d="M-110 30Q-80-40-30-30Q0-70 40-40Q80-60 110 30Z" fill="#5b4330" stroke="#2a1d12" stroke-width="3"/><path d="M-70 10l20-14 18 10M10-20l22-6 10 14M50 0l16-12" stroke="${a}" stroke-width="3" fill="none" opacity=".7"/>
  <path d="M40 30V-130M40-130H-60M40-110l-30-20M40-90l-20-40" stroke="#c9a46a" stroke-width="6" fill="none"/><path d="M-60-130v40" stroke="#ddd" stroke-width="2"/><rect x="-70" y="-92" width="20" height="14" fill="#8a6a40"/><circle cx="40" cy="-134" r="6" fill="#ff3d3d"/>`,
 a=>`<rect x="-100" y="-40" width="200" height="70" fill="#5a4030" stroke="#24170c" stroke-width="3"/><path d="M-100-40l40-26v26l40-26v26l40-26v26l40-26v26" fill="#6e4d36" stroke="#24170c" stroke-width="3"/>
  <rect x="40" y="-150" width="22" height="110" fill="#7d5a3c"/><rect x="70" y="-120" width="18" height="80" fill="#7d5a3c"/>${win(-96,-34,130,56,a,6,2)}
  <g class="smoke"><circle cx="51" cy="-168" r="16" fill="#9a8f86" opacity=".55"/><circle cx="64" cy="-196" r="22" fill="#9a8f86" opacity=".4"/><circle cx="80" cy="-138" r="12" fill="#9a8f86" opacity=".5"/></g>`,
 a=>`<path d="M-120 34h240v-10h-240z" fill="#1a1426"/><g stroke="${a}" stroke-width="5" fill="none"><path d="M-80 24v-130h70M-80-106l40 40M-10-106v34"/><path d="M40 24v-110h60M40-86l34 30M100-86v28"/></g>
  ${[['#ff2bd6',-110],['#3ad7ff',-70],['#ffb020',-30],['#39ff14',10]].map(([c,x],i)=>`<rect x="${x}" y="${-4-(i%2)*24}" width="38" height="22" fill="${c}" opacity=".85" stroke="#000" stroke-width="2"/>`).join('')}`,
 a=>`${[-80,-10,60].map((x,i)=>`<path d="M${x-40} 30L${x} ${-40-i%2*14}L${x+40} 30Z" fill="${['#7a2a5a','#2a4a7a','#7a5a1a'][i]}" stroke="#0c0818" stroke-width="3"/>`).join('')}
  <path d="M-120-50Q-50-20 0-56T120-48" stroke="#ffd45a" stroke-width="2" fill="none"/>${Array.from({length:9},(_,i)=>`<circle cx="${-120+i*30}" cy="${-50+Math.sin(i*1.3)*12}" r="6" fill="${['#ffb020','#ff2bd6','#3ad7ff'][i%3]}"/>`).join('')}`,
 a=>`${[[-100,-90,60,120],[-30,-140,70,170],[50,-70,60,100]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a4a5c" stroke="#10161c" stroke-width="3"/>${win(x,y,w,h,a,3,6)}`).join('')}`,
 a=>`<ellipse cx="0" cy="18" rx="70" ry="18" fill="#9fb3c4" stroke="#2a333d" stroke-width="3"/><path d="M0 14V-30" stroke="${a}" stroke-width="4"/><path d="M-20-24Q0-60 20-24" stroke="#bfe6ff" stroke-width="4" fill="none"/>
  <defs><linearGradient id="chr" x1="0" x2="1"><stop offset="0" stop-color="#6c7a88"/><stop offset=".5" stop-color="#f2f8ff"/><stop offset="1" stop-color="#6c7a88"/></linearGradient></defs>
  <rect x="-120" y="-120" width="40" height="140" fill="url(#chr)" stroke="#2a333d" stroke-width="3"/><rect x="80" y="-150" width="44" height="170" fill="url(#chr)" stroke="#2a333d" stroke-width="3"/>`,
 a=>`<defs><linearGradient id="gls" x1="0" x2="1"><stop offset="0" stop-color="#16324a"/><stop offset=".5" stop-color="#5fb8ff"/><stop offset="1" stop-color="#16324a"/></linearGradient></defs>
  <path d="M-40 30V-170L0-210L40-170V30Z" fill="url(#gls)" stroke="#0a1622" stroke-width="3"/>${win(-38,-170,76,196,a,4,10)}<path d="M0-210v-50" stroke="#ccc" stroke-width="3"/><circle cx="0" cy="-262" r="5" fill="#ff3d3d"/>
  <rect x="-100" y="-50" width="44" height="80" fill="#22344a"/><rect x="60" y="-80" width="44" height="110" fill="#22344a"/>`,
 a=>`<path d="M-30 30L-14-180L0-290L14-180L30 30Z" fill="#2c2416" stroke="${a}" stroke-width="3"/><path d="M-14-180h28" stroke="${a}" stroke-width="3"/><circle cx="0" cy="-292" r="9" fill="${a}"/>
  ${[-90,70].map(x=>`<rect x="${x}" y="-60" width="34" height="90" fill="#1f190f" stroke="#0d0a05" stroke-width="3"/>${win(x,-60,34,90,a,2,5)}`).join('')}`,
 a=>`<ellipse cx="0" cy="40" rx="150" ry="34" fill="#e8eef5" opacity=".85"/><ellipse cx="-70" cy="30" rx="70" ry="26" fill="#fff" opacity=".9"/>${[[-90,-60,40,90],[-30,-110,60,140],[50,-80,46,110]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a3122" stroke="#0d0a05" stroke-width="3"/>${win(x,y,w,h,a,3,6)}`).join('')}
  <circle cx="110" cy="-130" r="22" fill="#ff7a2b"/><path d="M110-108v40" stroke="#555" stroke-width="2"/>`,
 a=>`<ellipse cx="0" cy="-60" rx="140" ry="44" fill="none" stroke="${a}" stroke-width="12"/><ellipse cx="0" cy="-60" rx="140" ry="44" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
  <path d="M0-16V30M-60 30L0-16L60 30" stroke="#8aa0b8" stroke-width="6" fill="none"/><path d="M-6-140l6-30 6 30z" fill="#dfe9f2"/><path d="M0-110v-30" stroke="#dfe9f2" stroke-width="8"/>`,
 a=>`<circle cx="0" cy="-60" r="44" fill="#22344a" stroke="${a}" stroke-width="4"/><circle cx="0" cy="-60" r="16" fill="${a}" opacity=".8"/><path d="M-44-60h-90M44-60h90" stroke="#8aa0b8" stroke-width="5"/>
  ${[-150,-110,110,150].map(x=>`<rect x="${x-18}" y="-90" width="36" height="60" fill="#1b4a8a" stroke="#7fd7ff" stroke-width="2"/>`).join('')}<path d="M0-16V30" stroke="#8aa0b8" stroke-width="6"/>`,
 a=>`<path d="M-160 40L-40-170L0-140L50-230L170 40Z" fill="#3c3a48" stroke="#141320" stroke-width="3"/><path d="M50-230L20-180L60-170L80-190Z" fill="#fff" opacity=".85"/><path d="M-40-170L-60-130L-20-140Z" fill="#fff" opacity=".7"/>
  <path d="M40-230v-34h20v-12h-50v12h20" fill="${a}" stroke="#6a5000" stroke-width="2"/><path d="M50-276V-420" stroke="${a}" stroke-width="6" opacity=".25"/>`];
// вехи захвата 20–100 % стоят по краям площади (не на трассе и не за достопримечательностью)
export const FLAGS=[[-1.02,.3],[-.9,.06],[-.74,-.14],[.82,-.08],[1.0,.2]];
const flags=(R,pct)=>FLAGS.map(([x,y],k)=>{const on=pct>=(k+1)*20,X=f1(x*R),Y=f1(y*R);return`<g class="fl ${on?'on':''}" transform="translate(${X} ${Y})"><ellipse rx="9" ry="4" fill="#000" opacity=".35"/><path d="M0 0v-30" stroke="#ddd" stroke-width="2.5"/><path d="M0-30l18 6-18 6z" fill="${on?'#39ff14':'#6b6b6b'}"/><text y="16" text-anchor="middle">${(k+1)*20}%</text></g>`}).join('');

// ================= ГОРОД «КОНГЛОМЕРАТ»: одна суша, 12 районов-кварталов (не острова) =================
// Внизу слева низина: свалка и цеха за рекой, в смоге. Через мост — порт у залива, рынок, офисы, центр.
// Вверху справа — Высоты: плато над смогом, где небоскрёбы, кольцо аэропорта, станция связи «ТИШИНЫ» и Саммит.
// Границы районов — ячейки Вороного вокруг узлов маршрута с «живыми» краями (общий шум, поэтому соседи совпадают).
const W=WORLD.w,H=WORLD.h;
const clipHP=(P,ax,ay,nx,ny)=>{const o=[];for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],dp=(p[0]-ax)*nx+(p[1]-ay)*ny,dq=(q[0]-ax)*nx+(q[1]-ay)*ny;
 if(dp<=0)o.push(p);if((dp<=0)!==(dq<=0)){const t=dp/(dp-dq);o.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}return o};
const nz=(x,y)=>Math.sin(x*.0107+y*.0071)*.55+Math.sin(x*.0231-y*.0173+1.3)*.3+Math.sin(x*.047+y*.039+4.1)*.15;
const organic=(P,amp=26,step=55)=>{const o=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/step));
 for(let k=0;k<n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n,e=x<2||x>W-2||y<2||y>H-2?0:1;o.push([x+nz(x,y)*amp*e,y+nz(y+900,x-400)*amp*e])}}return o};
const polyD=P=>'M'+P.map(p=>f1(p[0])+' '+f1(p[1])).join('L')+'Z';
const inPoly=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
export const UPPER=d=>d>=9; // Высоты: районы 9–12 на плато
let CELLS=null;
export const cells=()=>CELLS||(CELLS=NODES.map(([x,y,R],i)=>{let P=[[0,0],[W,0],[W,H],[0,H]];
 NODES.forEach(([x2,y2],j)=>{if(j!==i)P=clipHP(P,(x+x2)/2,(y+y2)/2,x2-x,y2-y)});
 const rc=R*2.7,n=24;for(let k=0;k<n;k++){const m=(k+.5)/n*Math.PI*2,c=Math.cos(m),s=Math.sin(m),d=rc*Math.cos(Math.PI/n);P=clipHP(P,x+c*d,y+s*d,c,s)}
 return organic(P)}));
export const cellD=d=>polyD(cells()[d-1]);
// река из залива внизу в низину слева: отделяет окраины (1–2) от города
export const RIVER='M-40 1290C260 1350 600 1480 860 1630S1090 1880 1085 2060S1040 2300 1090 2460';
const riverPts=(()=>{const o=[];const P=[[-40,1290],[260,1350],[600,1480],[860,1630],[1090,1880],[1085,2060],[1040,2300],[1090,2460]];for(let i=0;i<P.length-1;i++)for(let t=0;t<1;t+=.1)o.push([P[i][0]+(P[i+1][0]-P[i][0])*t,P[i][1]+(P[i+1][1]-P[i][1])*t]);return o})();
const nearRiver=(x,y,r)=>riverPts.some(([a,b])=>Math.hypot(a-x,b-y)<r)||Math.hypot(x-1080,(y-2400)*1.4)<300;
const routePts=(()=>{const o=[];for(let i=0;i<NODES.length-1;i++){const [x0,y0]=NODES[i],[x1,y1]=NODES[i+1],mx=(x0+x1)/2,my=(y0+y1)/2-60;for(let t=0;t<=1;t+=.04){const u=1-t;o.push([u*u*x0+2*u*t*mx+t*t*x1,u*u*(y0+40)+2*u*t*my+t*t*(y1+40)])}}return o})();
const nearRoute=(x,y,r)=>routePts.some(([a,b])=>Math.hypot(a-x,b-y)<r);
const elev=(x,y)=>Math.max(0,Math.min(1,x/W*.6+(1-y/H)*.8-.25));
// земля районов по темам: [улицы/земля, фасады, крыши, огни]
const GROUND={industrial:['#3b2a1c','#5a3f28','#8a6a48','#ffb26b'],neon:['#22182f','#35244a','#5a3f7a','#ff2bd6'],chrome:['#1e252d','#36424f','#6d7d8e','#bfe6ff'],blackgold:['#201b12','#3a3020','#6e5c3a','#ffc400'],orbital:['#141d2a','#24344a','#4a6684','#7fd7ff']};
const grOf=i=>GROUND[(DIST[i]||[])[2]]||GROUND.industrial;
// застройка: кварталы-коробки (фасад + крыша), у окраин — кучи хлама, у порта — контейнеры, на рынке — палатки
function blocks(i,P){const [cx,cy]=NODES[i],r=rng(i*977+3),[g,fa,ro,li]=grOf(i),th=(DIST[i]||[])[2],up=UPPER(i+1);const B=[];
 const ang=(r()-.5)*.5,ca=Math.cos(ang),sa=Math.sin(ang),sp=i===0?62:up?84:74;
 let st='';for(let u=-700;u<=700;u+=sp*4)st+=`M${f1(cx+u*ca+600*sa)} ${f1(cy+u*sa-600*ca)}L${f1(cx+u*ca-600*sa)} ${f1(cy+u*sa+600*ca)}`;for(let v=-520;v<=520;v+=sp*.78*4)st+=`M${f1(cx-800*ca-v*sa)} ${f1(cy-800*sa+v*ca)}L${f1(cx+800*ca-v*sa)} ${f1(cy+800*sa+v*ca)}`;
 for(let iu=-12;iu<=12;iu++)for(let iv=-12;iv<=12;iv++){if(iu%4===0||iv%4===0)continue;const u=iu*sp,v=iv*sp*.78;if(Math.abs(u)>700||Math.abs(v)>520)continue;const x=cx+u*ca-v*sa+(r()-.5)*16,y=cy+u*sa+v*ca+(r()-.5)*12;
  if(!inPoly(x,y,P)||Math.hypot((x-cx)/1.25,y-cy-10)<175||nearRoute(x,y,52)||nearRiver(x,y,95))continue;
  const e=elev(x,y),w=24+r()*24,dpt=16+r()*16,h=(5+r()*16)*(1+e*3.2)*(up?1.4:1);B.push([x,y,w,dpt,h,r()])}
 B.sort((a,b)=>a[1]-b[1]);let out=`<path d="${st}" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="20" clip-path="url(#cp-${i+1})"/><path d="${st}" fill="none" stroke="${li}" stroke-opacity=".07" stroke-width="2" clip-path="url(#cp-${i+1})"/>`;
 for(let k=0;k<B.length;k+=12){let fr='',tp='',wn='',sh='';for(const [x,y,w,dpt,h,q] of B.slice(k,k+12)){
  if(i===0){sh+=`M${f1(x-w*.8)} ${f1(y)}Q${f1(x)} ${f1(y-h*1.4-8)} ${f1(x+w*.8)} ${f1(y)}Z`;continue}
  if(i===2&&q<.5){const c=['#a8422e','#2e6aa8','#c48a2a','#3a8a5a'][Math.floor(q*8)];sh+=`M${f1(x-w/2)} ${f1(y-8)}h${f1(w)}v8h${f1(-w)}Z`;tp+=`<path d="M${f1(x-w/2)} ${f1(y-14)}h${f1(w)}v6h${f1(-w)}Z" fill="${c}"/>`;continue}
  if(i===3&&q<.45){tp+=`<path d="M${f1(x-w/2)} ${f1(y)}L${f1(x)} ${f1(y-20)}L${f1(x+w/2)} ${f1(y)}Z" fill="${['#7a2a5a','#2a4a7a','#8a6a1a'][Math.floor(q*6.6)]}"/>`;continue}
  fr+=`M${f1(x-w/2)} ${f1(y-h)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`;tp+=`<path d="M${f1(x-w/2)} ${f1(y-h-dpt*.55)}h${f1(w)}v${f1(dpt*.55)}h${f1(-w)}Z" fill="${ro}" opacity="${f1(.75+q*.25)}"/>`;
  if(h>14)for(let wy=y-h+5;wy<y-4;wy+=7)for(let wx=x-w/2+4;wx<x+w/2-3;wx+=7)if(((wx*13+wy*7)|0)%5<(up?3:2))wn+=`M${f1(wx)} ${f1(wy)}h2.6v2.6h-2.6Z`}
  out+=(sh?`<path d="${sh}" fill="${i===0?'#4a3a2a':'#1a1420'}" stroke="#000" stroke-opacity=".4"/>`:'')+(fr?`<path d="${fr}" fill="${fa}" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>`:'')+tp+(wn?`<path d="${wn}" fill="${li}" opacity=".55"/>`:'')}
 return out}
// район: земля по ячейке, кромка плато у Высот, застройка, площадь с достопримечательностью, флажки-вехи
export function districtGround(i){const d=i+1,P=cells()[i],D=polyD(P),[g,fa]=grOf(i);
 return`<g class="dgr" data-d="${d}"><clipPath id="cp-${d}"><path d="${D}"/></clipPath>${UPPER(d)?`<path d="${D}" fill="#07080c" transform="translate(0 70)"/><path d="${D}" fill="${fa}" transform="translate(0 34)" opacity=".9"/>`:''}
  <path class="dz" data-d="${d}" d="${D}" fill="${g}"/><path d="${D}" fill="url(#gtex)" opacity=".5" pointer-events="none"/></g>`}
export function district(i,pct,locked){const d=i+1,[x,y,R]=NODES[i],P=cells()[i],D=polyD(P),[g,fa,ro]=grOf(i),acc=(PAL[(DIST[i]||[])[2]]||PAL.industrial)[3];
 return`<g class="dst${locked?' lk':''}" id="dist-${d}" data-d="${d}" style="--acc:${acc}" pointer-events="none">
  <g>${blocks(i,P)}</g>
  <path d="${D}" fill="none" stroke="${acc}" stroke-opacity=".28" stroke-width="5" stroke-dasharray="26 16"/>
  ${locked?'':`<g transform="translate(${x} ${y})"><ellipse cx="0" cy="30" rx="${R*.78}" ry="${R*.34}" fill="${ro}" opacity=".35"/><ellipse cx="0" cy="30" rx="${R*.78}" ry="${R*.34}" fill="none" stroke="${acc}" stroke-opacity=".35" stroke-width="3"/>
   <g class="flg">${flags(R,pct)}</g><g class="lm">${LM[i](acc)}</g></g>`}</g>`}
// подложка мира: земля за чертой города, горизонтали рельефа к Высотам, река и залив, смог у подножия плато
export function terrain(){const r=rng(77);let topo='';for(let k=1;k<=11;k++){const rr=k*230;topo+=`<ellipse cx="3150" cy="420" rx="${rr*1.25}" ry="${rr*.82}" transform="rotate(-18 3150 420)"/>`}
 let lights='';for(let k=0;k<160;k++){const x=r()*W,y=r()*H;if(cells().some(P=>inPoly(x,y,P))||nearRiver(x,y,60))continue;lights+=`M${f1(x)} ${f1(y)}h3v3h-3Z`}
 let smog='';for(let k=0;k<26;k++){const t=k/25,x=1700+t*2100+(r()-.5)*160,y=1180-t*560+(r()-.5)*90,s=90+r()*140;smog+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s*2)}" ry="${f1(s*.45)}"/>`}
 let low='';for(let k=0;k<14;k++){const x=r()*1500,y=1500+r()*900,s=120+r()*160;low+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s*2.2)}" ry="${f1(s*.5)}"/>`}
 return`<defs><linearGradient id="wbg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1d140d"/><stop offset=".45" stop-color="#12151a"/><stop offset="1" stop-color="#0d121c"/></linearGradient>
  <pattern id="gtex" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M0 46L46 0M-10 10L10-10M36 56L56 36" stroke="#fff" stroke-opacity=".035" stroke-width="2"/><circle cx="12" cy="30" r="1.4" fill="#000" fill-opacity=".25"/></pattern></defs>
  <rect id="world-bg" width="${W}" height="${H}" fill="url(#wbg)"/>
  <g fill="none" stroke="#9fb3c4" stroke-opacity=".06" stroke-width="3">${topo}</g><path d="${lights}" fill="#ffb26b" opacity=".25"/>

  <g id="smog-low" fill="#c8a88a" opacity=".05">${low}</g><g id="smog" fill="#dfe6ee" opacity=".09">${smog}</g>`}
export const water=()=>{const r=rng(91);let waves='';for(let k=0;k<40;k++){const [a,b]=riverPts[Math.floor(r()*riverPts.length)];waves+=`M${f1(a+(r()-.5)*40)} ${f1(b+(r()-.5)*30)}q10-6 20 0t20 0`}return`<g id="water"><path d="${RIVER}" fill="none" stroke="#0a1c26" stroke-width="190"/><ellipse cx="1080" cy="2440" rx="330" ry="200" fill="#0a1c26"/>
   <path d="${RIVER}" fill="none" stroke="#12303e" stroke-width="140"/><ellipse cx="1080" cy="2440" rx="290" ry="170" fill="#12303e"/><path d="${waves}" fill="none" stroke="#7fb6c8" stroke-opacity=".22" stroke-width="3"/></g>`};
// дороги поверх районов: трасса маршрута (асфальт, кромка, разметка); над рекой это мост, на плато — подъёмник
export function roads(){const d=routeD();const lift=segD(8,9);return`<g id="roads" pointer-events="none"><path d="${d}" fill="none" stroke="#050607" stroke-width="44" stroke-linecap="round" opacity=".7"/>
 <path d="${d}" fill="none" stroke="#2a2e33" stroke-width="32" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e9dcb8" stroke-opacity=".35" stroke-width="3" stroke-dasharray="22 18"/>
 <path d="M1040 1950l70 50M990 2010l70 50" stroke="#8a8f96" stroke-width="5" opacity=".7"/>
 <path d="${lift}" fill="none" stroke="#c9d6e2" stroke-opacity=".5" stroke-width="3" stroke-dasharray="2 10" transform="translate(0 -26)"/></g>`}
// лёгкий слой «Радар»: контуры районов, река, трасса, сетка, координаты (без заливок и фильтров)
export function radarWorld(open){let g='';for(let x=0;x<=W;x+=200)g+=`M${x} 0V${H}`;for(let y=0;y<=H;y+=200)g+=`M0 ${y}H${W}`;
 const ds=NODES.map(([x,y],i)=>{const on=open.includes(i+1);return`<g class="ri ${on?'on':'lk'}" data-d="${i+1}"><path d="${cellD(i+1)}" class="o" data-d="${i+1}"/>${on?`<circle cx="${x}" cy="${y}" r="60" class="h"/><circle cx="${x}" cy="${y}" r="120" class="h"/><text x="${x+70}" y="${y+120}">${String(i+1).padStart(2,'0')}·${(x/10|0)}.${(y/10|0)}</text>`:''}</g>`}).join('');
 return`<rect width="${W}" height="${H}" fill="#020a04"/><path d="${g}" class="rg"/><path d="${RIVER}" class="rw"/>${ds}<path d="${routeD()}" class="rr"/>`}
// ---------- гербы районов (Ведьмак 3): щит + свой знак ----------
const GLY=['M-6-8a8 8 0 1 0 12 0M0-14v8M-9 4l-4 6M9 4l4 6','M-9 8V-4l6-4v4l6-4v4l6-4V8zM5-12v-4','M0-12v20M-8 0h16M-9 4a9 7 0 0 0 18 0M0-14a2 2 0 1 0 0 .1','M-5-10h10M-6-10v14h12v-14M0 4v6M-3-14h6','M-9-4h18v12h-18zM-4-4v-4h8v4M-9 2h18','M0-12l9 8-9 14-9-14z','M-10 10l20-20M6-14l8 8M-6 4l2 2','M-9 8h18M-7 8V-6M0 8V-6M7 8V-6M-10-6h20l-10-7z','M-10 4a6 6 0 0 1 4-10a7 7 0 0 1 13 2a5 5 0 0 1-1 8z','M0-14c6 6 6 14 0 22c-6-8-6-16 0-22zM-6 6l-4 6M6 6l4 6','M-3-3h6v6h-6zM-12-6h7v12h-7zM5-6h7v12h-7z','M-10 6l-2-14 7 6 5-9 5 9 7-6-2 14z'];
export const crest=(i,state)=>{const c=(DIST[i]||[])[1]||'#888';return`<svg class="crest" viewBox="-20 -24 40 48" aria-hidden="true"><path d="M-16-20h32v18c0 14-9 21-16 24C-7 19-16 12-16-2z" fill="${state==='locked'?'#1a1d24':'#0d1114'}" stroke="${state==='locked'?'#3a404c':c}" stroke-width="2.4"/>
 <path d="M-16-20h32v6h-32z" fill="${state==='locked'?'#2a2f38':c}" opacity="${state==='locked'?1:.9}"/><path d="${state==='locked'?'M-5 0v-4a5 5 0 0 1 10 0v4M-7 0h14v9h-14z':GLY[i]}" transform="translate(0 4)" fill="none" stroke="${state==='locked'?'#6b7380':'#fff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`};
// ---------- фигурка Звонаря: гарнитура, плащ, огонёк антенны ----------
export const caller=()=>`<svg class="caller" id="caller" viewBox="-20 -52 40 58" aria-hidden="true"><ellipse cx="0" cy="3" rx="11" ry="3.5" fill="#000" opacity=".45"/>
 <g class="cl-body"><path class="lg l" d="M-3-8l-2 10" stroke="#1d2a36" stroke-width="4" stroke-linecap="round"/><path class="lg r" d="M3-8l2 10" stroke="#1d2a36" stroke-width="4" stroke-linecap="round"/>
 <path d="M-9-10Q-10-30 0-31Q10-30 9-10Z" fill="#14221a" stroke="#39ff14" stroke-width="1.6"/><path d="M-9-12h18" stroke="#39ff14" stroke-width="1.2" opacity=".6"/>
 <circle cx="0" cy="-38" r="7.5" fill="#e8c9a8" stroke="#2a1d12" stroke-width="1.2"/><path d="M-7.5-40a7.5 7.5 0 0 1 15 0" fill="none" stroke="#0d1114" stroke-width="3"/>
 <path d="M-8.5-38a8.5 8.5 0 0 1 17 0" fill="none" stroke="#39ff14" stroke-width="1.6"/><path d="M8-37q3 4-3 7" fill="none" stroke="#39ff14" stroke-width="1.4"/><circle cx="4.5" cy="-30" r="1.5" fill="#39ff14"/>
 <path d="M-5-45l-3-6" stroke="#9fb3a8" stroke-width="1.2"/><circle class="ant" cx="-8" cy="-51.5" r="1.8" fill="#ff2bd6"/></g></svg>`;
// маршрут: пунктир по всем узлам (Inscryption), пройденная часть — светлая сплошная
export const routeD=()=>{let d=`M${NODES[0][0]} ${NODES[0][1]+40}`;for(let i=1;i<NODES.length;i++){const [x0,y0]=NODES[i-1],[x1,y1]=NODES[i],mx=(x0+x1)/2,my=(y0+y1)/2-60;d+=`Q${f1(mx)} ${f1(my)} ${x1} ${y1+40}`}return d};
export const segD=(a,b)=>{const [x0,y0]=NODES[a-1],[x1,y1]=NODES[b-1],mx=(x0+x1)/2,my=(y0+y1)/2-60;return`M${x0} ${y0+40}Q${f1(mx)} ${f1(my)} ${x1} ${y1+40}`};
export const RIDDLES=['','Там, где кончается свалка, что-то стучит молотом всю ночь.','Портовые краны поворачиваются сами. Кто-то ими управляет.','Фонари рынка не гаснут. Говорят, торгуют даже голосами.','Офисы без окон. Внутри кто-то всё время улыбается.','Хром отражает тебя чуть раньше, чем ты двинешься.','Что-то большое дышит за стеклянной стеной.','Шпиль звенит, когда кто-то теряет деньги.','Город над облаками держится на чьих-то долгах.','Кольцо верфей молчит. Слишком тихо для стройки.','Станция отвечает на звонки сама. Голосом, которого нет.','Наверху ждёт тот, кто купил всё остальное.'];
