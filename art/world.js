// КАРТА МИРА кодом (R2): острова-районы на маршруте восхождения, достопримечательности, гербы, фигурка Звонаря.
// Всё — SVG-строки. Любой слой заменяется картинкой из генератора по id (см. ART_PROMPTS.md v2): world-bg, isl-<n>, crest-<n>, caller.
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
// мелочи для приближения: домики и деревья/хлам по теме, флажки-вехи захвата 20/40/60/80/100 % (Cuphead)
const props=(i,R,seed,a)=>{const r=rng(seed*31+5),th=(DIST[i]||[])[2];let s='';for(let k=0;k<14;k++){const t=r()*Math.PI*2,d=R*(.45+r()*.38),x=Math.cos(t)*d,y=Math.sin(t)*d*.55;if(Math.abs(x)<70&&y<20)continue;
  if(k%3===0)s+=`<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-9" y="-12" width="18" height="12" fill="${th==='industrial'?'#6e4d36':'#2e3a48'}" stroke="#000" stroke-width="1.5"/><path d="M-11-12L0-22L11-12Z" fill="${a}" opacity=".8"/></g>`;
  else s+=th==='orbital'?`<circle cx="${f1(x)}" cy="${f1(y-6)}" r="4" fill="${a}" opacity=".7"/>`:`<g transform="translate(${f1(x)} ${f1(y)})"><path d="M0 0v-8" stroke="#3a2a1a" stroke-width="3"/><circle cy="-14" r="9" fill="${th==='neon'?'#3a1f4a':th==='industrial'?'#5b6a2a':'#2a4a3a'}" stroke="#000" stroke-width="1.5"/></g>`}return s};
export const FLAGS=[[-.62,.28],[-.3,.42],[.05,.48],[.38,.38],[.64,.18]];
const flags=(R,pct)=>`<path d="M${FLAGS.map(([x,y])=>`${f1(x*R)} ${f1(y*R*.6)}`).join('L')}" stroke="#e9dcb8" stroke-width="5" stroke-dasharray="2 7" stroke-linecap="round" fill="none" opacity=".75"/>`+
 FLAGS.map(([x,y],k)=>{const on=pct>=(k+1)*20,X=f1(x*R),Y=f1(y*R*.6);return`<g class="fl ${on?'on':''}" transform="translate(${X} ${Y})"><ellipse rx="9" ry="4" fill="#000" opacity=".35"/><path d="M0 0v-30" stroke="#ddd" stroke-width="2.5"/><path d="M0-30l18 6-18 6z" fill="${on?'#39ff14':'#6b6b6b'}"/><text y="16" text-anchor="middle">${(k+1)*20}%</text></g>`}).join('');
export function island(i,pct){const [x,y,R]=NODES[i],[top,cliff,low,acc]=palOf(i),sky=i>=8,seed=i+1;
 return`<g class="isl" id="isl-${i+1}" data-d="${i+1}" transform="translate(${x} ${y})" style="--acc:${acc}">
  <path d="${blob(0,0,R*1.08,seed)}" fill="${sky?'#bcd3e6':'#9fd0d8'}" opacity="${sky?.12:.18}" transform="translate(0 24)"/>
  <path d="${blob(0,46,R,seed)}" fill="${low}"/><path d="${blob(0,26,R,seed)}" fill="${cliff}"/>
  ${sky?`<path d="${blob(0,70,R*.7,seed+3)}" fill="${low}" opacity=".9"/>`:''}
  <path d="${blob(0,0,R,seed)}" fill="${top}" stroke="rgba(255,255,255,.14)" stroke-width="3"/>
  <path d="${blob(0,-10,R*.78,seed+9)}" fill="#fff" opacity=".04"/>
  <g class="pr">${props(i,R,seed,acc)}</g><g class="flg">${flags(R,pct)}</g><g class="lm">${LM[i](acc)}</g></g>`}
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
// ---------- фон мира: ржавая земля внизу слева → вода и облака → космос вверху справа ----------
export function worldBg(){const r=rng(77),W=WORLD.w,H=WORLD.h;let stars='';for(let i=0;i<220;i++){const x=r()*W,y=r()*H*.62,k=Math.max(0,(x/W)*.7+(1-y/H)*.8-.75);if(k<=0)continue;stars+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.8+r()*2)}" fill="#fff" opacity="${f1(Math.min(1,k*2.2))}"/>`}
 let waves='';for(let i=0;i<70;i++){const x=r()*W*.8,y=H*.55+r()*H*.45;if(x/W-(1-y/H)>.5)continue;waves+=`<path d="M${f1(x)} ${f1(y)}q14-8 28 0t28 0" stroke="#bfe3ea" stroke-width="3" fill="none" opacity="${f1(.08+r()*.12)}"/>`}
 let clouds='';for(let i=0;i<38;i++){const x=W*.35+r()*W*.7,y=H*.12+r()*H*.55,s=60+r()*140;clouds+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s*1.8)}" ry="${f1(s*.5)}" fill="#dfeaf5" opacity="${f1(.03+r()*.05)}"/>`}
 return`<defs><linearGradient id="wbg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3a2414"/><stop offset=".28" stop-color="#1f2b2a"/><stop offset=".5" stop-color="#14303c"/><stop offset=".72" stop-color="#101c34"/><stop offset="1" stop-color="#05060f"/></linearGradient>
  <radialGradient id="wvg" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs>
  <rect id="world-bg" width="${W}" height="${H}" fill="url(#wbg)"/>${waves}${clouds}${stars}
  <ellipse cx="${W*.7}" cy="${H*.46}" rx="${W*.5}" ry="140" fill="#e8f0f8" opacity=".05"/><ellipse cx="${W*.6}" cy="${H*.42}" rx="${W*.3}" ry="60" fill="#e8f0f8" opacity=".05"/>`}
// ---------- тема «Радар»: отдельный лёгкий слой (контуры, сетка высот, координаты) вместо CSS-фильтра по большой картинке (фильтр ронял FPS до 13) ----------
export function radarWorld(open){const W=WORLD.w,H=WORLD.h;let g='';for(let x=0;x<=W;x+=200)g+=`M${x} 0V${H}`;for(let y=0;y<=H;y+=200)g+=`M0 ${y}H${W}`;
 const isl=NODES.map(([x,y,R],i)=>{const on=open.includes(i+1),sd=i+1;return`<g class="ri ${on?'on':'lk'}" data-d="${i+1}"><path d="${blob(x,y+20,R,sd)}" class="o"/>${on?`<path d="${blob(x,y+10,R*.68,sd+9)}" class="h"/><path d="${blob(x,y,R*.36,sd+4)}" class="h"/><text x="${x+R*.55}" y="${y+R*.62}">${String(i+1).padStart(2,'0')}·${(x/10|0)}.${(y/10|0)}</text>`:''}</g>`}).join('');
 return`<rect width="${W}" height="${H}" fill="#020a04"/><path d="${g}" class="rg"/><path d="${routeD()}" class="rr"/>${isl}`}
// маршрут: пунктир по всем узлам (Inscryption), пройденная часть — светлая сплошная
export const routeD=()=>{let d=`M${NODES[0][0]} ${NODES[0][1]+40}`;for(let i=1;i<NODES.length;i++){const [x0,y0]=NODES[i-1],[x1,y1]=NODES[i],mx=(x0+x1)/2,my=(y0+y1)/2-60;d+=`Q${f1(mx)} ${f1(my)} ${x1} ${y1+40}`}return d};
export const segD=(a,b)=>{const [x0,y0]=NODES[a-1],[x1,y1]=NODES[b-1],mx=(x0+x1)/2,my=(y0+y1)/2-60;return`M${x0} ${y0+40}Q${f1(mx)} ${f1(my)} ${x1} ${y1+40}`};
export const RIDDLES=['','Там, где кончается свалка, что-то стучит молотом всю ночь.','Портовые краны поворачиваются сами. Кто-то ими управляет.','Фонари рынка не гаснут. Говорят, торгуют даже голосами.','Офисы без окон. Внутри кто-то всё время улыбается.','Хром отражает тебя чуть раньше, чем ты двинешься.','Что-то большое дышит за стеклянной стеной.','Шпиль звенит, когда кто-то теряет деньги.','Город над облаками держится на чьих-то долгах.','Кольцо верфей молчит. Слишком тихо для стройки.','Станция отвечает на звонки сама. Голосом, которого нет.','Наверху ждёт тот, кто купил всё остальное.'];
