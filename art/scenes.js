// СЦЕНЫ КОДОМ (R2 §9.1 / R5): слои параллакса 1600×900 для панелей сюжета и «окна в район».
// Заглушка до картинок из генератора: картинка assets/story/<scene>_<n>.png или assets/scene/dNN_<layer>.png
// подменяет слой целиком (ART_PROMPTS v3 §7, §12). Стиль — STYLE LOCK кодом: тёмная бирюза, янтарный свет, 3 тона, зерно.
import {DIST} from '../core/meta.js';
export const SW=1600,SH=900;
const rng=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296);
const f=n=>Math.round(n*10)/10;
// небо (верх, низ), цвет окон/света, акцент района, дымка
export const TINT=[['#0b0f12','#3a2414','#ffb26b','#c28a4a','#5a3a22'],['#0b0d10','#40200c','#ff9a3d','#ff7a2b','#5c2c10'],
 ['#0a0716','#2a0f34','#ff7ae8','#ff2bd6','#3a1446'],['#0d0a08','#3a2608','#ffcc66','#ffb400','#4a3210'],
 ['#070b14','#12243f','#9cd0ff','#4aa3ff','#1a3252'],['#0a0d10','#26303a','#e6f0fa','#c9d6e2','#34404c'],
 ['#08070a','#2b2208','#ffd76a','#ffc400','#3a2e0c'],['#070604','#2e2406','#ffe08a','#ffd45a','#3c300c'],
 ['#0a0f1a','#4a3a28','#ffe3a0','#e8c35a','#5a4a36'],['#050b12','#0d2a3a','#a8ecff','#7fd7ff','#123848'],
 ['#040a06','#0c2a12','#7dff6a','#39ff14','#10361a'],['#08080a','#2a1010','#ffffff','#ff1f3d','#381414']];
const sky=(t,id)=>`<defs><linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset=".72" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[4]}"/></linearGradient>
 <radialGradient id="gl${id}" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="${t[2]}" stop-opacity=".28"/><stop offset="1" stop-color="${t[2]}" stop-opacity="0"/></radialGradient></defs>
 <rect width="${SW}" height="${SH}" fill="url(#sk${id})"/><rect y="300" width="${SW}" height="600" fill="url(#gl${id})"/>
 <radialGradient id="mn${id}"><stop offset="0" stop-color="${t[2]}" stop-opacity=".35"/><stop offset=".25" stop-color="${t[2]}" stop-opacity=".12"/><stop offset="1" stop-color="${t[2]}" stop-opacity="0"/></radialGradient>
 <circle cx="1080" cy="300" r="520" fill="url(#mn${id})"/>${clouds(id,t)}`;
const clouds=(id,t)=>{const r=rng(String(id).length*97+String(id).charCodeAt(1));let c='';for(let i=0;i<9;i++){const y=90+r()*330,x=r()*SW,w=260+r()*520;c+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(14+r()*26)}" fill="${i%3?t[4]:t[2]}" opacity="${f(.05+r()*.08)}"/>`}return c};
// контровой свет (STYLE LOCK: «thin rim light on silhouettes»): копия силуэта цветом света со сдвигом вверх-влево
const rim=(body,col,dx=-4,dy=-4)=>`<g class="sc-rim" style="--rim:${col}" transform="translate(${dx} ${dy})" opacity=".55">${body}</g>${body}`;
const wrap=(body,cls='')=>`<svg class="sc-l ${cls}" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${body}</svg>`;
// ряд домов с окнами: base — линия земли, h — диапазон высот, lit — доля горящих окон
function row(seed,{base,h0,h1,w0=50,w1=130,col,win,lit=.25,gap=4,x0=-40,x1=SW+40,wx=7,wy=9}){const r=rng(seed);let b='',w='';
 for(let x=x0;x<x1;){const bw=w0+r()*(w1-w0),bh=h0+r()*(h1-h0),y=base-bh;b+=`M${f(x)} ${base}V${f(y)}h${f(bw)}V${base}z`;
  if(win)for(let yy=y+14;yy<base-12;yy+=wy+8)for(let xx=x+8;xx<x+bw-10;xx+=wx+7)if(r()<lit)w+=`M${f(xx)} ${f(yy)}h${wx}v${wy}h-${wx}z`;
  if(r()<.25)b+=`M${f(x+bw*.45)} ${f(y)}v-${f(10+r()*30)}h3v${f(10+r()*30)}z`;x+=bw+gap+r()*14}
 return`<path d="${b}" fill="${col}"/>${win?`<path d="${w}" fill="${win}"/>`:''}`}
const rain=(seed,n=110,op=.18,live=false)=>{if(!live)return'';  // A7: в сценах дождь теперь живой (CSS-слой плеера .st-rain), статичные штрихи не рисуем
 const r=rng(seed);let d='';for(let i=0;i<n;i++){const x=r()*SW,y=r()*SH,l=18+r()*30;d+=`M${f(x)} ${f(y)}l-6 ${f(l)}`}return`<path d="${d}" stroke="#bfe" stroke-opacity="${op}" stroke-width="1.4"/>`};
const ground=(t,y=820)=>`<rect y="${y}" width="${SW}" height="${SH-y}" fill="#050607"/><path d="M0 ${y}H${SW}" stroke="${t[2]}" stroke-opacity=".25" stroke-width="2"/>`+
 Array.from({length:7},(_,i)=>`<ellipse cx="${120+i*230}" cy="${y+40+(i%2)*22}" rx="${70+(i%3)*30}" ry="6" fill="${t[2]}" opacity=".12"/>`).join('');
// достопримечательность района (средний план), центр около x=1040
const LMK=[
 t=>`<path d="M760 820l90-150 70 40 80-120 90 90 60-40 110 180z" fill="#1a1410"/><path d="M800 820l60-90 50 30 70-70 60 50 40 80z" fill="#2a1e14"/>
  <path d="M1160 820V300h18v520zM1169 310L1460 360v14L1169 330z" fill="#141210"/><path d="M1400 372v120" stroke="#0e0d0b" stroke-width="4"/><rect x="1370" y="490" width="60" height="24" rx="4" fill="#232020"/>
  <rect x="640" y="770" width="34" height="50" fill="#2a1a10"/><ellipse cx="657" cy="768" rx="26" ry="16" fill="${t[2]}" opacity=".55" class="sc-flick"/>
  <rect x="880" y="740" width="70" height="50" fill="#120e0a"/><rect x="896" y="752" width="22" height="16" fill="${t[2]}"/>`,
 t=>[0,1,2].map(i=>`<path d="M${880+i*130} 820V${360-i*40}h56V820z" fill="#16110c"/><rect x="${880+i*130}" y="${390-i*40}" width="56" height="10" fill="${t[3]}" opacity=".5"/>
  <circle class="sc-smoke" style="--i:${i}" cx="${908+i*130}" cy="${330-i*40}" r="40" fill="#6a5a4a" opacity=".22"/>`).join('')+`<path d="M700 820V620h560v200z" fill="#100c08"/><path d="M720 660h520" stroke="${t[2]}" stroke-opacity=".6" stroke-width="6" stroke-dasharray="30 18"/>`,
 t=>[0,1].map(i=>`<path d="M${820+i*330} 820l40-380h20l40 380zM${830+i*330} 470h220v14h-220z" fill="#120a18"/><path d="M${1050+i*330} 484v120" stroke="${t[3]}" stroke-width="3" opacity=".8"/>`).join('')+
  Array.from({length:12},(_,k)=>{const c=k%3,r=k/3|0;return`<rect x="${760+c*110+(r%2)*40}" y="${780-r*42}" width="104" height="40" fill="${['#1e1030','#2a1440','#180c26'][c]}" stroke="${t[3]}" stroke-opacity=".35"/>`}).join(''),
 t=>`<path d="M600 520Q1040 460 1500 520" stroke="#0a0806" stroke-width="10" fill="none"/>`+Array.from({length:14},(_,k)=>`<circle class="sc-lan" style="--i:${k}" cx="${640+k*62}" cy="${512-Math.sin(k/13*Math.PI)*46+12}" r="11" fill="${t[2]}"/>`).join('')+
  Array.from({length:6},(_,k)=>`<path d="M${620+k*150} 820V660l70-50 70 50v160z" fill="${k%2?'#1c1206':'#241808'}"/><rect x="${640+k*150}" y="700" width="100" height="40" fill="${t[2]}" opacity=".35"/>`).join(''),
 t=>`<path d="M760 820V600h560v220z" fill="#0c1424"/><path d="M820 600a220 160 0 0 1 440 0z" fill="#16243c"/><path d="M820 600a220 160 0 0 1 440 0" fill="none" stroke="${t[2]}" stroke-opacity=".5" stroke-width="3"/>
  <path d="M1040 440V600M900 520l280 0" stroke="${t[2]}" stroke-opacity=".25" stroke-width="2"/>`+row(55,{base:820,h0:60,h1:150,w0:60,w1:90,col:'#0e1828',win:t[2],lit:.5,x0:780,x1:1300}),
 t=>`<ellipse cx="1040" cy="800" rx="260" ry="34" fill="#1a2028"/><path d="M1000 800V620l40-90 40 90v180z" fill="#c9d6e2"/><path d="M1040 530l40 90v180h-40z" fill="#7a8896"/>
  <path class="sc-spray" d="M1040 560q-120 40-180 220M1040 560q120 40 180 220" stroke="#dfefff" stroke-opacity=".35" stroke-width="5" fill="none"/>
  <path d="M640 820V420h150v400zM1290 820V380h170v440z" fill="#2a333d"/><path d="M650 430h20v390M1300 390h20v430" fill="#dfe9f2" opacity=".35"/>`,
 t=>[[700,260,110],[840,140,130],[1000,60,150],[1180,180,120],[1330,300,110]].map(([x,y,w])=>`<path d="M${x} 820V${y}h${w}V820z" fill="#0e0c08"/><path d="M${x+6} ${y+20}h${w-12}M${x+6} ${y+80}h${w-12}M${x+6} ${y+140}h${w-12}" stroke="${t[3]}" stroke-opacity=".55" stroke-width="2"/>
  <rect x="${x+w*.2}" y="${y+180}" width="${w*.6}" height="60" fill="${t[2]}" opacity=".25" class="sc-holo"/>`).join(''),
 t=>`<path d="M980 820V300l60-240 60 240v520z" fill="#0b0906"/><path d="M1040 60l60 240v520h-60z" fill="#16120a"/><path d="M1000 320h80M995 420h90M990 520h100" stroke="${t[3]}" stroke-width="3" opacity=".7"/>
  <circle cx="1040" cy="760" r="52" fill="#1c160a" stroke="${t[3]}" stroke-width="4" opacity=".9"/><path d="M1040 708v104M988 760h104" stroke="${t[3]}" stroke-width="3" opacity=".6"/>
  <rect x="700" y="600" width="240" height="18" fill="${t[2]}" opacity=".3" class="sc-tick"/>`,
 t=>`<path d="M0 640Q400 600 800 640T1600 630V900H0z" fill="#8a7c6a" opacity=".35"/>`+[[760,220,120],[960,120,140],[1180,240,110]].map(([x,y,w])=>`<path d="M${x} 660V${y}h${w}V660z" fill="#1a160f"/><rect x="${x+10}" y="${y+30}" width="${w-20}" height="8" fill="${t[2]}" opacity=".5"/>`).join('')+
  `<path d="M880 400h80M1100 360h80" stroke="#cbb48a" stroke-opacity=".5" stroke-width="8"/><path d="M0 700Q400 660 800 700T1600 690V900H0z" fill="#a89880" opacity=".25"/>`,
 t=>`<ellipse cx="1040" cy="790" rx="520" ry="60" fill="none" stroke="${t[3]}" stroke-opacity=".35" stroke-width="6" stroke-dasharray="20 22"/><path d="M1000 820V440h80v380z" fill="#0a1820"/><path d="M960 440h160l-20-60h-120z" fill="#123040"/><rect x="980" y="396" width="120" height="20" fill="${t[2]}" opacity=".45"/>
  <path d="M640 820a150 110 0 0 1 300 0zM1160 820a150 110 0 0 1 300 0z" fill="#0c1e28"/>`,
 t=>`<path d="M1040 0V560" stroke="#123018" stroke-width="10"/><path d="M1040 0V560" stroke="${t[3]}" stroke-opacity=".35" stroke-width="2" class="sc-sig"/><path d="M800 600a240 160 0 0 0 480 0z" fill="#0c1c10" transform="rotate(-14 1040 600)"/>
  <path d="M1040 610l-30 210h60z" fill="#081208"/><circle cx="1040" cy="560" r="10" fill="${t[3]}" class="sc-blink"/><path d="M640 820V700h200v120zM1240 820V680h220v140z" fill="#081408"/>`,
 t=>`<path d="M1000 820V140h80v680z" fill="#0c0c0e"/><path d="M1040 140h40v680h-40z" fill="#16161a"/><rect x="990" y="120" width="100" height="40" fill="${t[2]}" opacity=".85"/><path d="M1040 120V60" stroke="#222" stroke-width="4"/><circle cx="1040" cy="56" r="9" fill="${t[3]}" class="sc-blink"/>
  <path d="M0 520Q400 480 800 520T1600 510V900H0z" fill="#d8d0c8" opacity=".14"/>`];
// передний план: силуэты
const fore=(d,t)=>{const r=rng(d*31+7);let p='';for(let i=0;i<9;i++){const x=i*190+r()*80,h=30+r()*70;p+=`M${f(x)} 900V${f(900-h)}h${f(40+r()*90)}V900z`}
 return`<path d="${p}" fill="#030404"/><path d="M0 900V860H${SW}V900z" fill="#020303"/><path d="M0 860H${SW}" stroke="${t[2]}" stroke-opacity=".15"/>`};
// district: 5 слоёв (небо, дальний, средний, ориентир, передний) + дождь
export function districtLayers(d){const i=d-1,t=TINT[i],up=d>=9;
 return[wrap(sky(t,'d'+d),'z0'),wrap(row(d*13+1,{base:up?600:700,h0:120,h1:up?460:400,w0:40,w1:110,col:t[4],win:t[2],lit:.05,gap:2})+`<rect y="${up?560:640}" width="${SW}" height="300" fill="${t[1]}" opacity=".35"/>`+row(d*13,{base:up?660:760,h0:80,h1:up?380:300,col:t[1],win:t[2],lit:.1}),'z1'),
  wrap(row(d*17+3,{base:up?680:820,h0:60,h1:220,w0:70,w1:150,col:'#0a0c0d',win:t[2],lit:.22})+ground(t),'z2'),
  wrap(`<radialGradient id="lg${d}"><stop offset="0" stop-color="${t[3]}" stop-opacity=".22"/><stop offset="1" stop-color="${t[3]}" stop-opacity="0"/></radialGradient><ellipse cx="1040" cy="600" rx="620" ry="360" fill="url(#lg${d})"/>`+rim(LMK[i](t),t[2]),'z3'),wrap(fore(d,t)+rain(d*5,d===12?0:110),'z4')]}
// город целиком: от свалки слева внизу до башни справа
export function cityLayers(wake=false){const t=['#06080a','#1a1a24','#ffc400','#ff1f3d','#24222c'];
 const tower=`<path d="M1360 760V400h56v360z" fill="#08080a"/><rect x="1352" y="384" width="72" height="26" fill="${wake?'#ffc400':'#ffffff'}" opacity="${wake?.9:.5}"/><path d="M1388 384V342" stroke="#08080a" stroke-width="6"/><radialGradient id="bcn"><stop offset="0" stop-color="#ff1f3d" stop-opacity=".75"/><stop offset="1" stop-color="#ff1f3d" stop-opacity="0"/></radialGradient><g class="sc-beacon"><circle cx="1388" cy="334" r="70" fill="url(#bcn)"/><circle cx="1388" cy="334" r="13" fill="#ff3b52"/></g>`;
 return[wrap(sky(t,'c'),'z0'),wrap(row(5,{base:780,h0:60,h1:300,col:'#141620',win:'#ffc400',lit:wake?.5:.02})+tower,'z1'),
  wrap(row(9,{base:840,h0:40,h1:200,w0:60,w1:120,col:'#07080a',win:'#ffc400',lit:wake?.6:.04})+ground(t,840),'z2'),wrap(rain(3,140,.16),'z4')]}
// гараж Звонаря: интерьер (эталон стиля E1)
export function garageLayers(lit=1){const a='#ffc400';
 return[wrap(`<rect width="${SW}" height="${SH}" fill="#0a0c0b"/><rect x="0" y="0" width="${SW}" height="640" fill="#101412"/><path d="M0 640H${SW}" stroke="#1c2420" stroke-width="4"/>
  <rect x="980" y="150" width="380" height="250" fill="#070a0c" stroke="#1b2320" stroke-width="10"/><path d="M1170 150v250M980 275h380" stroke="#1b2320" stroke-width="6"/><clipPath id="gwin"><rect x="990" y="160" width="360" height="230"/></clipPath><g clip-path="url(#gwin)">${row(21,{base:400,h0:20,h1:120,col:'#0d1316',win:'#ffc400',lit:.04,x0:980,x1:1370})}${rain(11,60,.3)}</g>
  <radialGradient id="bulb"><stop offset="0" stop-color="${a}" stop-opacity="${.45*lit}"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient><circle cx="560" cy="230" r="520" fill="url(#bulb)" class="sc-flick"/>`,'z0'),
  wrap(`<path d="M560 0V200" stroke="#050505" stroke-width="3"/><circle cx="560" cy="214" r="16" fill="${a}" opacity="${lit}" class="sc-flick"/>
  <rect x="300" y="560" width="620" height="22" fill="#2a2016"/><rect x="330" y="582" width="70" height="230" rx="10" fill="#3a2414"/><rect x="820" y="582" width="70" height="230" rx="10" fill="#3a2414"/>
  <rect x="1180" y="560" width="230" height="250" rx="8" fill="#2b2a24"/><rect x="1196" y="580" width="196" height="40" fill="#1a1a16"/><circle cx="1240" cy="700" r="40" fill="#141412" stroke="#4a3a28" stroke-width="6"/>`,'z2'),
  wrap(`<rect x="470" y="400" width="230" height="170" rx="16" fill="#cfc3a5"/><rect x="492" y="418" width="186" height="128" rx="12" fill="#06140a"/><path d="M505 482h160" stroke="#39ff14" stroke-width="3" opacity=".85" class="sc-sig"/>
  <path d="M760 548h90v14h-90z" fill="#141210"/><path d="M780 548q25-30 50 0" fill="#1c1a16"/><path d="M850 556q60 40 20 90t40 70" stroke="#141210" stroke-width="4" fill="none"/>`,'z3'),
  wrap(`<path d="M0 900V820h${SW}v80z" fill="#050606"/><path d="M80 820l60-70 50 30 40-40 70 80z" fill="#0b0a08"/><path d="M1460 820l40-60 60 60z" fill="#0b0a08"/>`,'z4')]}
// фон кабинета Саммита (финал)
export const summitLayers=()=>districtLayers(12);
