// БАЗА И ЧЁРНЫЙ РЫНОК КОДОМ (R4, ТЗ §10–11): 4 стадии комнаты (гараж → лофт → офис → башня), 36 предметов + 7 косметик
// со слотами BASE_SLOTS, продавец Лом. Сцена 2400×1000, пол на y=780. Предмет рисуется от нижней середины (0,0) вверх.
// Замена картинками: assets/base/stage1..4.png (пустые интерьеры), assets/items/<id>.png — через art/overrides.js.
const K='#050505',L=(w=3)=>`stroke="${K}" stroke-width="${w}" stroke-linejoin="round"`;
export const BW=2400,BH=1000,FLOOR=780;
const rng=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296);
// ---------- спрайты предметов ----------
const SP={
 d1t0:()=>`<path d="M0-420V-300" stroke="#111" stroke-width="3"/><circle class="it-glow" cy="-286" r="16" fill="#ffc400" ${L(2)}/><circle cy="-286" r="90" fill="#ffc400" fill-opacity=".12" class="it-glow"/>`,
 d1t1:()=>`<path d="M-150-120h300v18h-300z" fill="#6a4a2a" ${L()}/><path d="M-130-102h34v102h-34zM96-102h34v102h-34z" fill="#3a2414" ${L()}/><path d="M-60-200h120v80h-120z" fill="#cfc3a5" ${L()}/><path d="M-48-190h96v58h-96z" fill="#06140a"/><path d="M-40-160h80" stroke="#39ff14" stroke-width="2"/>`,
 d1t2:()=>`<path d="M-80-110h160v110h-160z" fill="#5a4030" ${L()}/><circle cx="-30" cy="-56" r="30" fill="#2a1a10" ${L()}/><path d="M40-110v-60h14v60" fill="#3a3a38" ${L(2)}/><path class="it-smoke" d="M47-178q-10-20 6-40" stroke="#bbb" stroke-opacity=".4" stroke-width="6" fill="none"/><rect x="20" y="-90" width="44" height="20" fill="#d8ccb0" ${L(2)}/>`,
 d2t0:()=>`<path d="M-70-300h140v300h-140z" fill="#4a4e52" ${L()}/><path d="M-60-290h120v280h-120z" fill="none" stroke="#2a2e32" stroke-width="4"/><path d="M30-170h50v20h-50z" fill="#8a8a86" ${L(2)}/>${[-50,50].map(x=>[-280,-20].map(y=>`<circle cx="${x}" cy="${y}" r="4" fill="#222"/>`).join('')).join('')}`,
 d2t1:()=>Array.from({length:12},(_,i)=>{const c=i%4,r=i/4|0;return`<rect x="${-180+c*90}" y="${-260+r*80}" width="84" height="74" rx="6" fill="#bfb398" ${L(2)}/><rect x="${-172+c*90}" y="${-252+r*80}" width="68" height="54" fill="#06140a"/><path class="it-scr" style="--i:${i}" d="M${-166+c*90} ${-226+r*80}h56" stroke="#39ff14" stroke-width="2"/>`}).join(''),
 d2t2:()=>`<path d="M-90 0v-260h180V0" fill="none" stroke="#3a3a38" stroke-width="22"/><path d="M-70-200h140v40h-140z" fill="#ff7a2b" ${L()}/><path d="M-60-160h120v60h-120z" fill="#222" ${L()}/><path d="M-100 0h200v-20h-200z" fill="#2a2a28" ${L()}/><path d="M-70-200l12-20h116l12 20" fill="#ffcc00"/>`,
 d3t0:()=>`<path class="it-neon" d="M-110-60l50 50 110-110" fill="none" stroke="#ff2bd6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M-130-150h260v170h-260z" fill="none" stroke="#2a1440" stroke-width="4"/>`,
 d3t1:()=>`<path d="M-60 0l20-90h80l20 90z" fill="#2a3440" ${L()}/><ellipse cy="-90" rx="50" ry="10" fill="#3ad7ff" opacity=".6"/><path class="it-holo" d="M-40-100l40-120 40 120z" fill="#3ad7ff" fill-opacity=".22"/><path d="M-20-150h40M-30-120h60" stroke="#3ad7ff" stroke-opacity=".6"/>`,
 d3t2:()=>`<path d="M-200 0v-200h400V0z" fill="#7a2a1a" ${L()}/>${Array.from({length:13},(_,i)=>`<path d="M${-190+i*30}-190v180" stroke="#5a1a10" stroke-width="6"/>`).join('')}<rect x="-60" y="-160" width="120" height="80" fill="#ffc400" opacity=".7" ${L()}/>`,
 d4t0:()=>`<path d="M-80-90h160v70h-160z" fill="#8a4a1a" ${L()}/><circle cx="-50" cy="0" r="20" fill="#222" ${L(2)}/><circle cx="50" cy="0" r="20" fill="#222" ${L(2)}/><path d="M-40-90v-40h80v40" fill="#555" ${L(2)}/><path class="it-smoke" d="M0-140q-14-30 8-60" stroke="#ddd" stroke-opacity=".35" stroke-width="8" fill="none"/><circle cx="-90" cy="-150" r="14" fill="#ffb400" class="it-glow"/><path d="M-90-164v-30" stroke="#111"/>`,
 d4t1:()=>[[-80,-300],[0,-360],[90,-320]].map(([x,y],i)=>`<g class="it-hover" style="--i:${i}"><path d="M${x-26} ${y}h52" stroke="#222" stroke-width="6"/><circle cx="${x}" cy="${y+26}" r="16" fill="#ffb400" class="it-glow"/></g>`).join(''),
 d4t2:()=>`<path d="M-60 0l-10-200h140L60 0z" fill="#111" ${L()}/><circle cy="-240" r="40" fill="#c89a6a" ${L()}/><path d="M-30-248h24M6-248h24" stroke="#000" stroke-width="10"/><path d="M-70-200h140" stroke="#222" stroke-width="20"/>`,
 d5t0:()=>`<path d="M-60 0v-80h120V0" fill="none" stroke="#222" stroke-width="10"/><path d="M-70-80h140v-30h-140z" fill="#5a2a1a" ${L()}/><path d="M-60-110v-130q60-30 120 0v130z" fill="#6a3420" ${L()}/>`,
 d5t1:()=>`<path d="M-200 0v-300h400V0z" fill="#9cd0ff" fill-opacity=".12" stroke="#9cd0ff" stroke-opacity=".6" stroke-width="4"/><path d="M-100-110h200v14h-200z" fill="#222"/><path d="M-200-300l100 300M60-300l60 300" stroke="#fff" stroke-opacity=".12" stroke-width="10"/>`,
 d5t2:()=>`<path d="M-200-130h400v26h-400z" fill="#6a2a14" ${L()}/><path d="M-190-104h80V0h-80zM110-104h80V0h-80z" fill="#4a1c0c" ${L()}/><path d="M60-130v-60" stroke="#222" stroke-width="4"/><path d="M40-190h40l-10-24h-20z" fill="#2e6a3a" ${L(2)}/><circle cx="60" cy="-180" r="40" fill="#ffe08a" opacity=".15"/>`,
 d6t0:()=>`<ellipse rx="120" ry="20" fill="#8a98a8" ${L()}/><path d="M-20 0v-140l20-50 20 50V0z" fill="#e6f0fa" ${L()}/><path class="it-spray" d="M0-190q-70 20-100 170M0-190q70 20 100 170" stroke="#dfefff" stroke-opacity=".45" stroke-width="5" fill="none"/>`,
 d6t1:()=>`<path d="M-50 0v-140h100V0z" fill="#c9d6e2" ${L()}/><rect x="-40" y="-230" width="80" height="80" rx="16" fill="#e6f0fa" ${L()}/><path d="M-26-196h52" stroke="#3ad7ff" stroke-width="6" class="it-glow"/><path d="M-70-120h140v20h-140z" fill="#2a333d" ${L(2)}/>`,
 d6t2:()=>`<path d="M-8 0v-200h16V0z" fill="#333"/><rect x="-160" y="-380" width="320" height="180" fill="#0a1820" stroke="#3ad7ff" stroke-width="4"/><path class="it-holo" d="M-140-360h280v140h-280z" fill="#3ad7ff" fill-opacity=".16"/><path d="M-40-300l40-40 40 40-40 40z" fill="none" stroke="#39ff14" stroke-width="6"/>`,
 d7t0:()=>`<rect x="-200" y="-280" width="400" height="260" fill="#1a2030" ${L(4)}/>${winCity(-188,-268,376,236,.35,17,'#ffd76a')}<path d="M0-280v260M-200-150h400" stroke="#1a2030" stroke-width="10"/>`,
 d7t1:()=>[-90,0,90].map(x=>`<path d="M${x-40} 0v-300h80V0z" fill="#111618" ${L()}/>${Array.from({length:9},(_,i)=>`<circle class="it-led" style="--i:${i}" cx="${x-20+(i%3)*20}" cy="${-280+(i/3|0)*90}" r="4" fill="#39ff14"/>`).join('')}`).join(''),
 d7t2:()=>[-70,70].map(x=>`<path d="M${x-36} 0l6-200h60l6 200z" fill="#1a160c" ${L()}/><rect x="${x-24}" y="-250" width="48" height="50" rx="10" fill="#2a2414" ${L()}/><path d="M${x-16}-226h32" stroke="#ff1f3d" stroke-width="5"/><path d="M${x-40}-180h80" stroke="#ffc400" stroke-width="6"/>`).join(''),
 d8t0:()=>`<rect x="-200" y="-40" width="400" height="34" fill="#0a0806" stroke="#ffd45a" stroke-width="3"/><path class="it-tick" d="M-190-23h380" stroke="#ffd45a" stroke-width="10" stroke-dasharray="16 10"/><path d="M-6-6v6h12v-6" fill="#222"/>`,
 d8t1:()=>`<circle cy="-150" r="150" fill="#3a3428" ${L(5)}/><circle cy="-150" r="120" fill="#5a503c" ${L()}/>${[0,60,120].map(a=>`<path d="M0-150l${Math.cos(a/57.3)*100} ${Math.sin(a/57.3)*100}M0-150l${-Math.cos(a/57.3)*100} ${-Math.sin(a/57.3)*100}" stroke="#ffd45a" stroke-width="8"/>`).join('')}<circle cy="-150" r="24" fill="#ffd45a" ${L()}/>`,
 d8t2:()=>`<path d="M-80 0v-360h160V0z" fill="#3a2e14" ${L()}/>${Array.from({length:7},(_,i)=>`<path d="M${-70+i*23}-350v340" stroke="#c8a040" stroke-width="3"/>`).join('')}<path d="M-80-380h160v20h-160z" fill="#ffd45a" ${L(2)}/>`,
 d9t0:()=>`<path d="M-260-120h520v20h-520z" fill="#cfe6ff" fill-opacity=".4" stroke="#cfe6ff" stroke-width="3"/><path d="M-260-100v100M260-100v100" stroke="#8a98a8" stroke-width="10"/><path d="M-250-120l40-60h420l40 60" fill="none" stroke="#cfe6ff" stroke-opacity=".6" stroke-width="3"/>`,
 d9t1:()=>`<ellipse rx="150" ry="26" fill="#0a2a30" ${L()}/><ellipse rx="130" ry="18" fill="#1a5a6a"/><path class="it-koi" d="M-60-4q20-12 40 0q-20 12-40 0z" fill="#ff7a2b"/><path class="it-koi s2" d="M30 4q20-12 40 0q-20 12-40 0z" fill="#fff"/><path d="M-150 0q-20-120 30-160M150 0q20-110-40-150" stroke="#2e6a3a" stroke-width="10" fill="none"/>`,
 d9t2:()=>`<ellipse rx="160" ry="14" fill="#222"/><path d="M-110-30q0-80 90-80h60q60 0 60 50v30z" fill="#e8c35a" ${L()}/><path d="M100-60h120l10-20" fill="none" stroke="#111" stroke-width="8"/><path class="it-rotor" d="M-180-120h300" stroke="#111" stroke-width="8"/><path d="M-40-110v-10" stroke="#111" stroke-width="10"/>`,
 d10t0:()=>`<path d="M-40 0l10-60h60l10 60z" fill="#333" ${L(2)}/><path d="M-70-60l20-110 110-30 20 30-80 110z" fill="#1e3a4a" ${L()}/><path d="M-60-80h100" stroke="#7fd7ff" stroke-width="4"/>`,
 d10t1:()=>Array.from({length:7},(_,i)=>`<g class="it-hover" style="--i:${i}"><circle cx="${-150+i*50}" cy="${-300-(i%3)*40}" r="12" fill="#0a1820" stroke="#7fd7ff" stroke-width="4"/></g>`).join(''),
 d10t2:()=>`<path d="M-40 0l20-100h40l20 100z" fill="#2a333d" ${L()}/><circle class="it-globe" cy="-200" r="90" fill="#7fd7ff" fill-opacity=".14" stroke="#7fd7ff" stroke-width="3"/><ellipse cy="-200" rx="90" ry="30" fill="none" stroke="#7fd7ff" stroke-opacity=".6"/><ellipse cy="-200" rx="30" ry="90" fill="none" stroke="#7fd7ff" stroke-opacity=".6"/><circle cx="-30" cy="-230" r="8" fill="#39ff14"/>`,
 d11t0:()=>`<circle cy="-500" r="110" fill="#081208" stroke="#8a8a86" stroke-width="22"/><circle cy="-500" r="110" fill="none" ${L(3)}/>${Array.from({length:8},(_,i)=>`<circle cx="${Math.cos(i*.785)*124}" cy="${-500+Math.sin(i*.785)*124}" r="5" fill="#333"/>`).join('')}<path class="it-sig" d="M-10-610v220" stroke="#39ff14" stroke-width="4"/>`,
 d11t1:()=>`<path d="M-40 0l-10-180h100l-10 180z" fill="#111" ${L()}/><path d="M-10-180l10 60 10-60" fill="#eef3f6"/><circle cy="-220" r="36" fill="#cfd8d4" ${L()}/><circle cx="12" cy="-224" r="10" fill="#39ff14" class="it-glow"/><path d="M-60-110h120" stroke="#fff" stroke-width="16" stroke-linecap="round"/>`,
 d11t2:()=>`<path d="M-200-140q30-30 200-20t200 20l-20 30h-360z" fill="#2a2620" ${L()}/><path class="it-veins" d="M-160-130l60 6 40-14 60 12 80-8" stroke="#39ff14" stroke-opacity=".7" stroke-width="3" fill="none"/><path d="M-150-110l-20 110h60l10-110M150-110l20 110h-60l-10-110" fill="#1a1612" ${L()}/>`,
 d12t0:()=>`<path d="M-70 0h140v-40h-140z" fill="#e8e0d0" ${L()}/><path d="M-60-40q0-80 60-100l40-60 6 70q40 30 14 90z" fill="#ffd45a" ${L()}/><path d="M40-200l20-60" stroke="#fff" stroke-width="6"/>`,
 d12t1:()=>Array.from({length:6},(_,i)=>`<g class="it-bow" style="--i:${i}"><path d="M${-250+i*100} 0v-150h40V0z" fill="#3ad7ff" fill-opacity=".18" stroke="#3ad7ff" stroke-opacity=".6"/><circle cx="${-230+i*100}" cy="-172" r="20" fill="#3ad7ff" fill-opacity=".2" stroke="#3ad7ff" stroke-opacity=".6"/></g>`).join(''),
 d12t2:()=>`<path d="M-90 0v-120h180V0z" fill="#e8e0c8" ${L()}/><path d="M-80-120v-260q80-40 160 0v260z" fill="#f4eedc" ${L()}/><path d="M-60-360q60-30 120 0" stroke="#ffd45a" stroke-width="8" fill="none"/><path d="M-110-160h40v40h-40zM70-160h40v40h-40z" fill="#ffd45a" ${L(2)}/><path d="M76-176h30v-12h-30z" fill="#111"/>`,
};
// косметика: на стене трофеев (следы — неоновые полосы, печати — печати на полке)
const CS={trail:c=>`<path d="M-120-20q60-60 120 0t120 0" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" class="it-glow"/>`,
 stamp:c=>`<path d="M-30 0h60v-30h-60z" fill="${c}" ${L()}/><path d="M-10-30v-40h20v40" fill="#2a2420" ${L(2)}/><circle cy="-80" r="18" fill="#2a2420" ${L(2)}/>`};
const COS={'trail-cyan':CS.trail('#3ad7ff'),'trail-magenta':CS.trail('#ff2bd6'),'trail-gold':CS.trail('#ffd45a'),'trail-red':CS.trail('#ff1f3d'),'stamp-iron':CS.stamp('#5a5a58'),'stamp-neon':CS.stamp('#ff2bd6'),'stamp-gold':CS.stamp('#ffd45a')};
export const itemSprite=id=>SP[id]?SP[id]():COS[id]||'';
// слоты: x, y (точка опоры), масштаб, слой (wall — на стене, floor — на полу, front — передний план)
export const BASE_SLOTS={
 d1t0:[560,420,1,'wall'],d1t1:[700,FLOOR,1,'floor'],d1t2:[260,FLOOR,1,'floor'],
 d2t0:[2180,FLOOR,1,'floor'],d2t1:[1000,520,.9,'wall'],d2t2:[1500,FLOOR,.9,'floor'],
 d3t0:[1280,380,1,'wall'],d3t1:[930,FLOOR,1,'floor'],d3t2:[1900,FLOOR,.6,'floor'],
 d4t0:[400,FLOOR+60,1,'front'],d4t1:[1200,FLOOR,1,'floor'],d4t2:[2050,FLOOR,1,'floor'],
 d5t0:[820,FLOOR+20,1,'front'],d5t1:[1720,FLOOR,1,'floor'],d5t2:[1320,FLOOR,1,'floor'],
 d6t0:[1100,FLOOR+60,1,'front'],d6t1:[1600,FLOOR+20,1,'front'],d6t2:[1700,480,1,'wall'],
 d7t0:[1640,450,.75,'wall'],d7t1:[150,FLOOR,1,'floor'],d7t2:[2280,FLOOR+40,.9,'front'],
 d8t0:[1200,200,1,'wall'],d8t1:[1500,640,.9,'wall'],d8t2:[2300,FLOOR,1,'floor'],
 d9t0:[1200,FLOOR-180,1,'wall'],d9t1:[600,FLOOR+90,1,'front'],d9t2:[1950,FLOOR-330,.9,'wall'],
 d10t0:[1040,FLOOR+40,1,'front'],d10t1:[1500,FLOOR,1,'floor'],d10t2:[1400,FLOOR+50,1,'front'],
 d11t0:[420,FLOOR,1,'wall'],d11t1:[880,FLOOR+40,1,'front'],d11t2:[1200,FLOOR+70,1,'front'],
 d12t0:[1700,FLOOR-130,.8,'wall'],d12t1:[1200,FLOOR+10,1,'floor'],d12t2:[1200,FLOOR+60,1,'front'],
 'trail-cyan':[300,230,.8,'wall'],'trail-magenta':[300,280,.8,'wall'],'trail-gold':[300,330,.8,'wall'],'trail-red':[300,380,.8,'wall'],
 'stamp-iron':[2050,330,1,'wall'],'stamp-neon':[2150,330,1,'wall'],'stamp-gold':[2250,330,1,'wall']};
// ---------- 4 стадии ----------
export const STAGES=[['Гараж','гараж на свалке'],['Лофт','лофт в контейнерах доков'],['Офис','этаж в Downtown'],['Башня','пентхаус над облаками']];
const winCity=(x,y,w,h,lit,seed,col='#ffc400')=>{const r=rng(seed);let b='',wi='';for(let xx=x;xx<x+w;){const bw=30+r()*70,bh=h*.2+r()*h*.7;b+=`M${xx} ${y+h}V${y+h-bh}h${bw}V${y+h}z`;for(let yy=y+h-bh+10;yy<y+h-8;yy+=16)for(let k=xx+6;k<xx+bw-8;k+=14)if(r()<lit)wi+=`M${k} ${yy}h6v8h-6z`;xx+=bw+4}
 return`<clipPath id="wc${seed}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#wc${seed})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a1016"/><path d="${b}" fill="#05080a"/><path d="${wi}" fill="${col}"/></g>`};
export function stageBack(st,lit=.1,dark=false){const lamp=dark?0:1;
 if(st===0)return`<rect width="${BW}" height="${FLOOR}" fill="#151a17"/>${Array.from({length:60},(_,i)=>`<path d="M${i*40} 0V${FLOOR}" stroke="#0e1210" stroke-width="10"/>`).join('')}
  <rect x="1000" y="180" width="420" height="260" fill="none" stroke="#2a3430" stroke-width="16"/>${winCity(1008,188,404,244,lit,5)}<path d="M1210 180v260M1000 310h420" stroke="#2a3430" stroke-width="8"/>
  <rect x="1900" y="200" width="460" height="${FLOOR-200}" fill="#07090a"/><path d="M1900 200h460" stroke="#3a4440" stroke-width="10"/>${winCity(1904,420,452,FLOOR-420,lit*.6,9,'#ff7a2b')}<path d="M1920 ${FLOOR}l80-140 60 60 70-120 90 200z" fill="#1a1410"/>`;
 if(st===1)return`<rect width="${BW}" height="${FLOOR}" fill="#3a1a14"/>${Array.from({length:80},(_,i)=>`<path d="M${i*30} 0V${FLOOR}" stroke="#2a100c" stroke-width="8"/>`).join('')}<path d="M0 260H${BW}" stroke="#1a0806" stroke-width="20"/>
  <circle cx="1210" cy="330" r="150" fill="#0a0612" stroke="#5a3a30" stroke-width="22"/><clipPath id="lp"><circle cx="1210" cy="330" r="140"/></clipPath><g clip-path="url(#lp)">${winCity(1060,190,300,280,lit,7,'#ff7ae8')}</g>`;
 if(st===2)return`<rect width="${BW}" height="${FLOOR}" fill="#10141c"/>${winCity(140,80,2120,600,lit,11,'#ffd76a')}${Array.from({length:8},(_,i)=>`<rect x="${120+i*300}" y="60" width="40" height="${FLOOR-60}" fill="#1a2030"/>`).join('')}<path d="M0 60H${BW}M0 ${FLOOR-60}H${BW}" stroke="#1a2030" stroke-width="40"/>`;
 return`<rect width="${BW}" height="${FLOOR}" fill="#1a1812"/>${winCity(100,60,2200,560,lit,13,'#fff2c0')}<path d="M100 520Q700 470 1200 520T2300 510V620H100z" fill="#d8d0c8" opacity=".25"/>${Array.from({length:6},(_,i)=>`<rect x="${80+i*440}" y="40" width="40" height="${FLOOR-40}" fill="#e8e0c8"/><path d="M${80+i*440} 40h40" stroke="#ffd45a" stroke-width="10"/>`).join('')}`}
export function stageFloor(st){const f=[['#1c1e1c','#262826'],['#2a1c14','#34241a'],['#1a1e26','#222834'],['#e8e0d4','#d8cfc0']][st];
 return`<rect y="${FLOOR}" width="${BW}" height="${BH-FLOOR}" fill="${f[0]}"/>${Array.from({length:12},(_,i)=>`<path d="M${i*220} ${FLOOR}l-120 ${BH-FLOOR}" stroke="${f[1]}" stroke-width="4"/>`).join('')}<path d="M0 ${FLOOR}H${BW}" stroke="#000" stroke-width="6"/>`}
// свет: лампа (гараж), неон (лофт), ряды ламп (офис), закат/белое золото (башня)
export function stageLight(st,dark=false,k=1){if(dark)return`<rect width="${BW}" height="${BH}" fill="#000" opacity=".55"/>`;const c=['#ffc400','#ff7ae8','#cfe6ff','#ffe8b0'][st];
 return`<radialGradient id="hl${st}" cx=".3" cy=".1" r=".8"><stop offset="0" stop-color="${c}" stop-opacity="${(.22*k).toFixed(3)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><rect width="${BW}" height="${BH}" fill="url(#hl${st})" class="hq-flick"/>${k<1?`<rect width="${BW}" height="${BH}" fill="#000" opacity="${((1-k)*.5).toFixed(2)}"/>`:''}`}
// Гудок на базе (ЭЛТ на столе) и рычаг «Начать смену», дверь на Чёрный Рынок
export const LEVER=`<g class="hq-lever"><path d="M-40 0h80v-30h-80z" fill="#2a2a28" ${L()}/><path class="hq-arm" d="M0-30l40-110" stroke="#8a8a86" stroke-width="14" stroke-linecap="round"/><circle class="hq-arm" cx="40" cy="-140" r="22" fill="#ff1f3d" ${L()}/></g>`;
export const HATCH=`<g class="hq-hatch"><path d="M-90 0v-250q90-60 180 0V0z" fill="#120a14" ${L(4)}/><path d="M-70 0v-230q70-46 140 0V0" fill="none" stroke="#ff2bd6" stroke-width="4" class="it-neon"/><circle cx="50" cy="-110" r="8" fill="#ffc400"/></g>`;
// ---------- продавец Лом ----------
export const LOM_MOODS=['welcome','haggle','closed','happy','secret'];
// Лом v2: коренастый старьёвщик. Сварочная маска поднята на лоб (в «closed» опущена, визор светится красным),
// на правом глазу латунная лупа часовщика с янтарной линзой, седая щетина, шарф, кожаная куртка с меховым воротником,
// фартук с ключом и отвёрткой. На плече попугай Тостер: корпус из хромированного тостера, гребень — два ломтика хлеба.
export const lomSvg=(mood='welcome')=>{const M=LOM_MOODS.includes(mood)?mood:'welcome',down=M==='closed';
 const brow={welcome:['M-52-196l30-8','M14-204l30 6'],haggle:['M-52-206l30 4','M12-200l32-12'],closed:['M-52-198h30','M14-198h30'],happy:['M-52-200q15-10 30-2','M14-202q15-8 30 2'],secret:['M-52-192l30-6','M14-198l30 8']}[M];
 const mouth={welcome:'M-26-136q20 12 44-2',haggle:'M-28-134q10-6 22 0t26-4',closed:'M-24-136h44',happy:'M-32-142q30 34 62 0z',secret:'M-22-132q20-6 40 0'}[M];
 const eyeL=M==='happy'?'<path d="M-44-184q9-8 18 0" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>':M==='secret'?'<path d="M-44-182h18" stroke="#111" stroke-width="5" stroke-linecap="round"/>':'<circle class="lom-eye" cx="-35" cy="-184" r="7" fill="#111"/><circle cx="-33" cy="-186" r="2" fill="#fff" opacity=".7"/>';
 return`<svg class="lom" data-mood="${M}" viewBox="-160 -330 320 360" aria-hidden="true">
 <path d="M-150 34q4-118 70-140l80-8 80 8q66 22 70 140z" fill="#3b2a20" ${L(5)}/>
 <path d="M-112-96q-30 30-38 130M112-96q30 30 38 130" fill="none" stroke="#2a1d16" stroke-width="10"/>
 <path d="M-96-112q30 30 96 30t96-30l14 22q-40 40-110 40t-110-40z" fill="#8a7458" ${L(4)}/><path d="M-80-98q16 10 26 4M40-96q14 6 30 0" stroke="#6a5640" stroke-width="5" fill="none"/>
 <path d="M-62-66h124l14 100h-152z" fill="#6b5a40" ${L(4)}/><path d="M-36-26h30v34h-30zM12-30h28v38h-28z" fill="#54462f" ${L(3)}/>
 <path d="M-26-60l-8 34" stroke="#9aa0a4" stroke-width="7" stroke-linecap="round"/><circle cx="-26" cy="-62" r="9" fill="none" stroke="#9aa0a4" stroke-width="6"/><path d="M30-62v30" stroke="#ffc400" stroke-width="8" stroke-linecap="round"/><path d="M30-32v10" stroke="#9aa0a4" stroke-width="4"/>
 <path d="M-44-112q44 22 88 0l-6 20q-38 18-76 0z" fill="#8a2a20" ${L(3)}/><path d="M20-100l18 34-14 4z" fill="#7a221a" ${L(3)}/>
 <path d="M-70-196q-2-58 70-60 72 2 70 60l-6 56q-8 34-64 40-56-6-64-40z" fill="#c4905e" ${L(5)}/>
 <path d="M-66-150q4 40 66 48 62-8 66-48q-10 26-66 30-56-4-66-30z" fill="#9a9590" opacity=".75"/><path d="M-60-160q60 22 120 0" stroke="#8a6a4a" stroke-width="3" fill="none" opacity=".35"/>
 <ellipse cx="-74" cy="-176" rx="10" ry="16" fill="#b07e50" ${L(4)}/>
 <path d="M-6-178q-8 26-2 34 10 6 18 0" fill="#b07e50" ${L(3)}/>
 <path d="M30-214l14 40" stroke="#8a4a30" stroke-width="3" opacity=".7"/><path d="M26-208l8-2M30-198l8-2M34-188l8-2" stroke="#8a4a30" stroke-width="2.5" opacity=".7"/>
 ${eyeL}
 <path d="${brow[0]}" stroke="#d8d4cc" stroke-width="9" stroke-linecap="round"/><path d="${brow[1]}" stroke="#d8d4cc" stroke-width="9" stroke-linecap="round"/>
 <g class="lom-loupe"><path d="M10-200h40l6 30h-52z" fill="#b8862e" ${L(4)}/><ellipse cx="30" cy="-170" rx="26" ry="10" fill="#7a5818" ${L(3)}/><ellipse cx="30" cy="-171" rx="18" ry="6" fill="#ffc400" class="lom-lens"/><path d="M50-196q30-6 26-40" fill="none" stroke="#3a2a1a" stroke-width="4"/></g>
 <path d="${mouth}" fill="${M==='happy'?'#3a1410':'none'}" stroke="#111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${M==='happy'||M==='haggle'?`<rect x="${M==='happy'?4:-4}" y="${M==='happy'?-142:-138}" width="9" height="9" rx="2" fill="#ffc400" ${L(2)}/>`:''}
 <g class="lom-mask" transform="translate(0 ${down?-176:-262}) ${down?'':'rotate(-4)'}"><path d="M-78 ${down?-26:0}q0-${down?60:44} 78-${down?66:50}t78 ${down?66:50}${down?'v52q-20 40-78 44-58-4-78-44z':'l-10 16h-136z'}" fill="#2a2e30" ${L(5)}/>
  <rect x="-48" y="${down?-6:-24}" width="96" height="${down?30:22}" rx="6" fill="#0c1012" ${L(3)}/><rect x="-40" y="${down?0:-20}" width="80" height="${down?18:14}" fill="${down?'#ff1f3d':'#39ff14'}" opacity="${down?.75:.35}" class="lom-visor"/>
  <circle cx="-66" cy="${down?8:-6}" r="7" fill="#6a6e70" ${L(2)}/><circle cx="66" cy="${down?8:-6}" r="7" fill="#6a6e70" ${L(2)}/></g>
 <g class="lom-bird" transform="translate(104 -112)">
  <path d="M-22-44v-16q0-12 13-12t13 12v16z" fill="#e9c27e" stroke="#7a4a1e" stroke-width="4" stroke-linejoin="round" transform="rotate(-10 -9 -44)"/><path d="M2-44v-20q0-12 13-12t13 12v20z" fill="#dcae64" stroke="#7a4a1e" stroke-width="4" stroke-linejoin="round" transform="rotate(8 15 -44)"/>
  <rect x="-30" y="-48" width="58" height="46" rx="12" fill="#b9c2c8" ${L(4)}/><path d="M-22-40h40" stroke="#6a7278" stroke-width="5" stroke-linecap="round"/><path d="M-26-14h50" stroke="#e8eef2" stroke-width="3" opacity=".7"/>
  <path d="M28-34l20 8-20 8z" fill="#ffc400" ${L(3)}/><circle cx="14" cy="-28" r="6" fill="#050505"/><circle cx="14" cy="-28" r="3.4" fill="#39ff14" class="lom-led"/>
  <path d="M-30-24q-22 6-26 30" fill="none" stroke="#2a2a28" stroke-width="5" stroke-linecap="round"/><rect x="-64" y="4" width="14" height="10" rx="2" fill="#9aa0a4" ${L(2)}/>
  <path d="M-14-2v14M8-2v14" stroke="#555" stroke-width="5" stroke-linecap="round"/></g></svg>`};
export const LOM_LINES={welcome:['Заходи. Тут всё списанное, но работает.','О, Звонарь. Деньги есть? Тогда мы друзья.','Не трогай попугая. Он из тостера.'],
 short:['Не хватает. Позвони ещё кому-нибудь.','Приходи с деньгами. Я подожду. Я всегда жду.'],locked:['Это не продаётся. Пока. Сначала район.','Видишь силуэт? Это всё, что я могу показать.'],
 sold:['Продано. Возврата нет, гарантия — моё честное слово.','Хороший выбор. Ну, нормальный.'],empty:['Ты купил всё. Мне даже неловко.']};
export function runBaseArtTests(SHOP_ITEMS,COSMETICS){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('BASE_SLOTS: 36 + 7 слотов',()=>SHOP_ITEMS.every(x=>BASE_SLOTS[x.id])&&COSMETICS.every(x=>BASE_SLOTS[x.id])&&Object.keys(BASE_SLOTS).length===43);
 t('спрайт есть у каждого предмета',()=>[...SHOP_ITEMS,...COSMETICS].every(x=>itemSprite(x.id)));
 t('4 стадии базы',()=>[0,1,2,3].every(s=>stageBack(s).length>100&&stageFloor(s)));
 return o}
