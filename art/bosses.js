// 12 БОССОВ КОДОМ (R3, ТЗ §9.2): векторный «риг» из слоёв: тень, аура, левая рука, тело, голова, правая рука, аксессуар, частицы.
// Анимация — CSS (ui/boss/arena.css): дыхание тела, покачивание головы, взмахи рук, моргание, реакция на удар.
// Фазы: элементы .ph1 видны только в фазе 1, .ph2 — с фазы 2, .ph3 — в фазе 3 (трещины, аура сильнее).
// Замена картинкой: assets/boss/bNN.png (+ _hit, _defeat) — через art/overrides.js.
import {BOSSES} from '../story/bosses.js';
import {hasArt,artUrl} from './overrides.js';
const K='#050505'; // линия «тушью»
const ln=(w=4)=>`stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const eyes=(y,dx,c,r=6)=>`<g class="b-eye"><circle cx="${-dx}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${dx}" cy="${y}" r="${r}" fill="${c}"/></g>`;
const crack=(x,y,s=1)=>`<path class="ph3" d="M${x} ${y}l${8*s} ${14*s}-${10*s} ${10*s} ${12*s} ${16*s}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.5"/>`;
const P=[
 // 1 Король Свалки
 ([m,dk,a,g])=>({armL:`<path d="M-120-150h44v150h-44z" fill="${m}" ${ln()}/><path d="M-150-40l26-26h36l26 26v36l-26 26h-36l-26-26z" fill="#b8241c" ${ln()}/><path d="M-130-22h60" stroke="#fff" stroke-width="6"/>`,
  body:`<path d="M-80-200h160v300h-160z" fill="${m}" ${ln(5)}/><path d="M-80-60h160" ${ln(4)}/><path d="M60-180v90M60-40v90" stroke="#d8ccb0" stroke-width="8" stroke-linecap="round"/>
   <circle cx="-64" cy="-186" r="4" fill="${dk}"/><circle cx="64" cy="-186" r="4" fill="${dk}"/><circle cx="-64" cy="86" r="4" fill="${dk}"/><path d="M-50-150h40v24h-40z" fill="${dk}" opacity=".6"/>
   <g class="ph2"><path d="M-40-40h80v100h-80z" fill="#120a06" ${ln(3)}/><circle cx="0" cy="-4" r="10" fill="#e8c8a0"/><path d="M-20 30v-14M20 30v-14" stroke="${a}" stroke-width="5"/><circle cx="-20" cy="14" r="5" fill="#b8241c"/><circle cx="20" cy="14" r="5" fill="#ffc400"/></g>
   <path d="M-70-210v-40h22v40M48-210v-40h22v40" fill="#3a3a38" ${ln(3)}/>${crack(-30,-150)}${crack(40,0)}`,
  head:`<path d="M-44-300h88v76h-88z" fill="${dk}" ${ln(5)}/>${eyes(-262,20,a,7)}<path d="M-26-238h52" stroke="${K}" stroke-width="5"/><path d="M0-300v-14" ${ln(3)}/><circle class="b-crown" cx="0" cy="-324" r="12" fill="${g}" ${ln(3)}/>`,
  armR:`<path d="M76-150h44v150h-44z" fill="${m}" ${ln()}/><path d="M78 0h40v30h-40z" fill="${dk}" ${ln(3)}/>`,
  fx:`<circle class="b-steam" cx="-60" cy="-260" r="18" fill="#cfc8b8" opacity=".3"/><circle class="b-steam s2" cx="60" cy="-260" r="18" fill="#cfc8b8" opacity=".3"/>`}),
 // 2 Начальник Смены Ржавый
 ([m,dk,a,g])=>({armL:`<path d="M-80-170l-50 40v110" fill="none" stroke="#6a6a66" stroke-width="26" stroke-linecap="round"/><path d="M-80-170l-50 40v110" fill="none" stroke="${K}" stroke-width="4" opacity=".5"/><path d="M-160-20h60v40h-60z" fill="${dk}" ${ln()}/>`,
  body:`<path d="M-70-190h140l14 230h-168z" fill="${m}" ${ln(5)}/><path d="M-66-110h132M-62-50h124" stroke="${a}" stroke-width="12"/><path d="M-50 40l-10 70h40l10-70M50 40l10 70h-40l-10-70" fill="${dk}" ${ln(4)}/>
   <path d="M-30-170h60v40h-60z" fill="#d8ccb0" ${ln(3)}/><path d="M-22-160h44M-22-148h30" stroke="${K}" stroke-width="2"/>${crack(20,-80)}`,
  head:`<g class="ph1"><path d="M-46-300h92l6 90h-104z" fill="#3a3a38" ${ln(5)}/><path d="M-34-262h68v16h-68z" fill="#120c06"/><path class="b-eye" d="M-30-256h60" stroke="${a}" stroke-width="5"/></g>
   <g class="ph2"><path d="M-40-290q40-26 80 0v70h-80z" fill="#8a7a66" ${ln(5)}/><circle cx="16" cy="-256" r="14" fill="#ff1f3d" ${ln(3)}/><circle cx="-18" cy="-256" r="5" fill="${K}"/></g>
   <path d="M-56-300q56-50 112 0z" fill="${a}" ${ln(4)}/>`,
  armR:`<path d="M80-170l50 40v110" fill="none" stroke="#6a6a66" stroke-width="26" stroke-linecap="round"/><path d="M100-20h60v40h-60z" fill="${dk}" ${ln()}/>`,
  fx:`<g class="b-spark">${[0,1,2,3,4].map(i=>`<path d="M${-130+i*8} 30l${-10+i*5} ${-14-i*3}" stroke="${g}" stroke-width="3"/>`).join('')}</g>`}),
 // 3 Контрабандист
 ([m,dk,a,g])=>({armL:`<path d="M-60-170q-50 60-40 170" fill="none" stroke="${m}" stroke-width="30" stroke-linecap="round"/>`,
  body:`<path d="M-60-200h120l50 300h-220z" fill="${m}" ${ln(5)}/><path d="M0-200v300" stroke="${dk}" stroke-width="6"/><path d="M-110 100h220" stroke="${g}" stroke-width="3" stroke-dasharray="6 10" class="b-pix"/>
   <path d="M-60-200l-14 300M60-200l14 300" stroke="${a}" stroke-opacity=".7" stroke-width="3"/>`,
  head:`<path d="M-56-210q-6-100 56-110 62 10 56 110z" fill="${dk}" ${ln(5)}/><ellipse class="b-mask" cx="0" cy="-262" rx="32" ry="40" fill="${a}" ${ln(4)}/>
   <g class="b-eye"><path d="M-20-272l14 6M20-272l-14 6" stroke="${K}" stroke-width="6" stroke-linecap="round"/></g><path class="b-mouth" d="M-14-238q14 10 28 0" fill="none" stroke="${K}" stroke-width="4"/>`,
  armR:`<path d="M60-170q50 60 40 170" fill="none" stroke="${m}" stroke-width="30" stroke-linecap="round"/><path d="M90 0v-40" stroke="${g}" stroke-width="6"/>`,
  fx:`<g class="ph2 b-twin" opacity=".35" transform="translate(150 0)"><path d="M-60-200h120l50 300h-220z" fill="${a}"/><ellipse cx="0" cy="-262" rx="32" ry="40" fill="${g}"/></g>`}),
 // 4 Хозяин Ночного Рынка
 ([m,dk,a,g])=>({armL:[0,1,2].map(i=>`<g class="b-arm${i}"><path d="M-70 ${-150+i*50}q-60 -20 -90 ${-30+i*20}" fill="none" stroke="${m}" stroke-width="18" stroke-linecap="round"/><circle cx="-164" cy="${-180+i*70}" r="16" fill="${a}" class="b-lan" ${ln(3)}/></g>`).join(''),
  body:`<ellipse cx="0" cy="-60" rx="96" ry="150" fill="${m}" ${ln(5)}/><path d="M-80-80q80 40 160 0" stroke="${a}" stroke-width="8" fill="none"/><path d="M-40 80l-6 30h30l4-30M40 80l6 30h-30l-4-30" fill="${dk}" ${ln(4)}/>`,
  head:`<circle cx="0" cy="-240" r="44" fill="#c89a6a" ${ln(5)}/><path d="M-80-262h160l-80-86z" fill="${dk}" ${ln(5)}/><circle cx="0" cy="-300" r="14" fill="${a}" class="b-lan" ${ln(3)}/>
   <g class="ph1">${eyes(-244,16,K,5)}</g><g class="ph2">${eyes(-244,16,g,8)}</g><path d="M-14-216q14 8 28 0" fill="none" ${ln(3)}/>`,
  armR:[0,1,2].map(i=>`<g class="b-arm${i}"><path d="M70 ${-150+i*50}q60 -20 90 ${-30+i*20}" fill="none" stroke="${m}" stroke-width="18" stroke-linecap="round"/><path d="M150 ${-196+i*70}h26v40h-26z" fill="#1a1a1a" ${ln(3)}/><path d="M156 ${-190+i*70}h14v14h-14z" fill="#39ff14"/></g>`).join(''),
  fx:`<g class="ph2"><circle cx="-164" cy="-180" r="16" fill="#000"/><circle cx="-164" cy="-110" r="16" fill="#000"/></g>`}),
 // 5 Менеджер по Продажам Всего
 ([m,dk,a,g])=>({armL:`<path d="M-70-170q-60 40-70 140" fill="none" stroke="${m}" stroke-width="30" stroke-linecap="round"/><path d="M-150-40l20 20" stroke="#d8b090" stroke-width="22" stroke-linecap="round"/>`,
  body:`<path d="M-76-190h152l10 290h-172z" fill="${m}" ${ln(5)}/><path d="M-30-190l30 60 30-60z" fill="#eef3f6" ${ln(3)}/><path class="b-tie" d="M0-150l-12 30 12 20-12 30 12 20-12 30 12 20" fill="none" stroke="${a}" stroke-width="14" stroke-linejoin="round"/><path d="M-40 100v14M40 100v14" ${ln(10)}/>`,
  head:`<ellipse cx="0" cy="-262" rx="66" ry="74" fill="#e8c4a0" ${ln(5)}/><path d="M-60-310q60-40 120 0" fill="#2a1a10"/>${eyes(-280,26,K,6)}
   <g class="ph1 b-smile"><path d="M-52-240q52 34 104 0z" fill="#fff" ${ln(4)}/><path d="M-40-236v14M-26-233v18M-12-231v20M2-231v20M16-232v18M30-234v14" stroke="${K}" stroke-width="2"/></g>
   <g class="ph2 b-smile"><path d="M-66-252q66 70 132 0z" fill="#fff" ${ln(4)}/><path d="M-50-244v26M-34-238v34M-18-236v38M-2-235v40M14-236v38M30-238v34M46-244v26" stroke="${K}" stroke-width="2"/></g>`,
  armR:`<path d="M70-170q60 20 80 -60" fill="none" stroke="${m}" stroke-width="30" stroke-linecap="round"/><path d="M140-250h20v40h-20z" fill="#1a1a1a" ${ln(3)}/>`,
  fx:`<path class="b-kpi" d="M-160-320l40 20 40-30 40 26" fill="none" stroke="${a}" stroke-width="4" opacity=".7"/>`}),
 // 6 Хромированный Лоббист
 ([m,dk,a,g])=>({armL:`<path d="M-70-170q-50 50-50 160" fill="none" stroke="${m}" stroke-width="28" stroke-linecap="round"/><path d="M-70-170q-50 50-50 160" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6"/>`,
  body:`<defs><linearGradient id="chr" x1="0" x2="1"><stop offset="0" stop-color="#4a5664"/><stop offset=".35" stop-color="#f4f8fc"/><stop offset=".5" stop-color="#8a98a8"/><stop offset="1" stop-color="#2a333d"/></linearGradient></defs>
   <path d="M-74-190h148l-10 290h-128z" fill="url(#chr)" ${ln(5)}/><path d="M0-190l-12 40 12 120 12-120z" fill="#1c2430" ${ln(3)}/><rect class="b-card" x="-56" y="-90" width="40" height="26" fill="#39ff14" opacity=".45"/>
   <g class="ph2"><path d="M-40-160l20 40-16 30 24 40" fill="none" stroke="${K}" stroke-width="4"/><path d="M-30-120l10 6" stroke="#000" stroke-width="16" opacity=".8"/></g>${crack(30,-100,1.4)}`,
  head:`<rect x="-50" y="-310" width="100" height="90" rx="14" fill="url(#chr)" ${ln(5)}/><rect x="-40" y="-282" width="80" height="26" rx="6" fill="#0a1018"/><path class="b-eye" d="M-34-270h68" stroke="${g}" stroke-width="4"/><path d="M-30-306l-6-20M30-306l6-20" ${ln(4)}/>`,
  armR:`<path d="M70-170q50 50 50 160" fill="none" stroke="${m}" stroke-width="28" stroke-linecap="round"/><circle cx="120" cy="0" r="16" fill="#d8ccb0" ${ln(3)}/>`,
  fx:`<path class="b-glint" d="M-60-300l120 300" stroke="#fff" stroke-width="14" opacity=".0"/>`}),
 // 7 Киберсамурай-Аудитор
 ([m,dk,a,g])=>({armL:`<path d="M-76-170l-40 70 10 90" fill="none" stroke="${m}" stroke-width="28" stroke-linecap="round"/><path d="M-130-60h50v70h-50z" fill="#0c1a12" ${ln(3)}/><path d="M-124-50h38M-124-38h30M-124-26h34" stroke="#39ff14" stroke-width="2"/>`,
  body:`<path d="M-80-196h160l-20 120h-120z" fill="${m}" ${ln(5)}/><path d="M-60-76h120l20 170h-160z" fill="${dk}" ${ln(5)}/><path d="M-80-160h160M-74-120h148M-56-40h112M-60 0h120M-64 40h128" stroke="${a}" stroke-width="3"/>
   <path d="M-110-200l30 30M110-200l-30 30" stroke="${a}" stroke-width="10"/>`,
  head:`<g class="ph1"><path d="M-50-300h100v80h-100z" fill="${m}" ${ln(5)}/><path d="M-70-290q70-60 140 0" fill="none" stroke="${a}" stroke-width="10"/><path d="M-50-300l-30-50M50-300l30-50" stroke="${a}" stroke-width="8" stroke-linecap="round"/><path class="b-eye" d="M-30-262h60" stroke="#ff1f3d" stroke-width="6"/></g>
   <g class="ph2"><ellipse cx="0" cy="-262" rx="44" ry="48" fill="#c8a080" ${ln(5)}/><path d="M-44-290q44-30 88 0v-10q-44-34-88 0z" fill="#111"/><circle cx="18" cy="-266" r="15" fill="none" stroke="${a}" stroke-width="5"/><circle cx="18" cy="-266" r="6" fill="#ff1f3d"/><circle cx="-18" cy="-266" r="5" fill="${K}"/></g>`,
  armR:`<g class="b-katana"><path d="M76-170l50 60" fill="none" stroke="${m}" stroke-width="28" stroke-linecap="round"/><path d="M120-110L40-340" stroke="#eef3f6" stroke-width="8" stroke-linecap="round"/><path d="M120-110l14 30" stroke="${a}" stroke-width="10"/><path d="M110-130l26-10" stroke="${a}" stroke-width="8"/></g>`,
  fx:``}),
 // 8 Банкир-призрак
 ([m,dk,a,g])=>({armL:`<path d="M-60-150q-70 20-80 100" fill="none" stroke="${m}" stroke-opacity=".6" stroke-width="22" stroke-linecap="round"/>`,
  body:`<path d="M-80-190q80-30 160 0v260l-26 30-26-30-28 30-26-30-28 30-26-30z" fill="${m}" fill-opacity=".55" ${ln(4)}/><path d="M-30-190l30 50 30-50" fill="#eef3f6" fill-opacity=".6"/>
   <path class="b-chain" d="M60-120q40 60 0 140" fill="none" stroke="#d8ccb0" stroke-width="5" stroke-dasharray="10 6"/>`,
  head:`<ellipse cx="0" cy="-250" rx="50" ry="58" fill="${m}" fill-opacity=".65" ${ln(4)}/><path d="M-60-290h120v12h-120zM-40-290v-60h80v60z" fill="#111" ${ln(4)}/><path d="M-40-300h80" stroke="${a}" stroke-width="6"/>
   <g class="ph1">${eyes(-254,18,K,7)}</g><g class="ph2 b-digits" fill="${a}" font-family="monospace" font-size="16" font-weight="700"><text x="-30" y="-248">0.01</text><text x="-22" y="-226">%</text></g>`,
  armR:`<path d="M60-150q70 20 80 100" fill="none" stroke="${m}" stroke-opacity=".6" stroke-width="22" stroke-linecap="round"/><path d="M130-60h20v40h-20zM134-60v-14h12v14" fill="${a}" ${ln(3)}/>`,
  fx:`<g class="b-coins">${[0,1,2,3,4,5].map(i=>`<circle cx="${-170+i*68}" cy="${-300+((i*37)%120)}" r="10" fill="${a}" ${ln(2)}/>`).join('')}</g><g class="ph2" opacity=".3"><ellipse cx="-150" cy="-160" rx="40" ry="90" fill="${m}"/><ellipse cx="150" cy="-160" rx="40" ry="90" fill="${m}"/></g>`}),
 // 9 Барон Облаков
 ([m,dk,a,g])=>({armL:`<path d="M-90-150q-50 20-60 90" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/>`,
  body:`<ellipse cx="0" cy="-110" rx="104" ry="110" fill="${m}" ${ln(5)}/><path d="M-60-200q60 30 120 0" fill="none" stroke="${a}" stroke-width="8"/><circle cx="0" cy="-130" r="6" fill="${a}"/><circle cx="0" cy="-90" r="6" fill="${a}"/>
   <g class="b-cloud"><g class="ph1">${[[-110,30,60],[-40,40,70],[40,40,70],[110,30,60],[0,10,60]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#e6eef6" ${ln(4)}/>`).join('')}</g>
   <g class="ph2">${[[-110,30,60],[-40,40,70],[40,40,70],[110,30,60],[0,10,60]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2e38" ${ln(4)}/>`).join('')}<path d="M-30 80l-16 40 20-6-12 36" fill="none" stroke="#ffe08a" stroke-width="5"/></g></g>`,
  head:`<circle cx="0" cy="-262" r="52" fill="#e8c4a0" ${ln(5)}/><path d="M-50-240q50 90 100 0q-20 30-50 30t-50-30z" fill="#e8e0d0" ${ln(4)}/><path class="b-bolt" d="M-6-230l-10 20h12l-8 20" fill="none" stroke="#ffe08a" stroke-width="4"/>
   ${eyes(-272,20,K,5)}<circle cx="20" cy="-272" r="14" fill="none" stroke="${a}" stroke-width="3"/><path d="M-60-306h120v10h-120zM-40-306v-44h80v44z" fill="#1a1a22" ${ln(4)}/>`,
  armR:`<path d="M90-150q50 20 60 90" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/><path d="M150-60V-260" stroke="#3a2e1a" stroke-width="8"/><path d="M150-260l24-12-24-12" fill="${a}" ${ln(2)}/>`,
  fx:``}),
 // 10 Адмирал Эфира
 ([m,dk,a,g])=>({armL:`<path d="M-76-170l-30 50-40-60" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/><path d="M-150-190l10 14" stroke="#e8c4a0" stroke-width="20" stroke-linecap="round" class="b-salute"/>`,
  body:`<path d="M-80-196h160l10 296h-180z" fill="${m}" ${ln(5)}/><path d="M0-196v296" stroke="${dk}" stroke-width="4"/>${[0,1,2,3].map(i=>`<circle cx="-14" cy="${-160+i*50}" r="6" fill="#ffd45a"/><circle cx="14" cy="${-160+i*50}" r="6" fill="#ffd45a"/>`).join('')}
   <rect x="-112" y="-206" width="56" height="22" fill="#061418" stroke="${a}" stroke-width="3"/><rect x="56" y="-206" width="56" height="22" fill="#061418" stroke="${a}" stroke-width="3"/><path class="b-radar" d="M-106-195h44M62-195h44" stroke="${a}" stroke-width="2"/>
   <g class="ph2"><path d="M-60-140l40 30-30 40 50 30" fill="none" stroke="${K}" stroke-width="4"/><path d="M-52-120h40v70h-40z" fill="#3a4a54" ${ln(3)}/></g>`,
  head:`<ellipse cx="0" cy="-258" rx="46" ry="52" fill="#d8b090" ${ln(5)}/><path d="M-62-296h124l-12-26h-100z" fill="${dk}" ${ln(4)}/><path d="M-62-296h124" stroke="#ffd45a" stroke-width="6"/>
   ${eyes(-262,17,K,5)}<path d="M-50-258a50 50 0 0 1 0-40" fill="none" stroke="#111" stroke-width="6"/><path d="M-52-258l14 34" stroke="#111" stroke-width="4"/><circle cx="-38" cy="-224" r="6" fill="${a}" class="b-led"/>`,
  armR:`<path d="M76-170q30 60 34 160" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/>`,
  fx:``}),
 // 11 ARCHON
 ([m,dk,a,g])=>({armL:`<g class="b-cab">${[0,1,2].map(i=>`<path d="M-60 ${-160+i*30}q-80 ${40+i*20} -110 ${150-i*20}" fill="none" stroke="#111" stroke-width="${12-i*2}"/><path d="M-60 ${-160+i*30}q-80 ${40+i*20} -110 ${150-i*20}" fill="none" stroke="${m}" stroke-width="3"/>`).join('')}</g>`,
  body:`<path d="M0-360V-260" stroke="#111" stroke-width="16"/><circle cx="0" cy="-150" r="110" fill="${dk}" ${ln(5)}/><circle cx="0" cy="-150" r="96" fill="none" stroke="${m}" stroke-width="8"/>
   <g class="b-eyeball"><circle cx="0" cy="-150" r="62" fill="#020403" ${ln(4)}/><g class="ph1"><circle class="b-iris" cx="0" cy="-150" r="30" fill="${g}"/><circle cx="0" cy="-150" r="10" fill="#000"/></g>
   <g class="ph2">${[-28,0,28].map((x,i)=>`<circle class="b-iris" cx="${x}" cy="${-150+(i%2?-18:14)}" r="16" fill="${g}"/>`).join('')}<path d="M-50-170l30 20 20-30 30 30 20-10" fill="none" stroke="#fff" stroke-width="3"/></g></g>
   <path d="M-40-40l-20 140h120l-20-140z" fill="#0a0f0b" ${ln(4)}/>`,
  head:``,
  armR:`<g class="b-cab">${[0,1,2].map(i=>`<path d="M60 ${-160+i*30}q80 ${40+i*20} 110 ${150-i*20}" fill="none" stroke="#111" stroke-width="${12-i*2}"/><path d="M60 ${-160+i*30}q80 ${40+i*20} 110 ${150-i*20}" fill="none" stroke="${m}" stroke-width="3"/>`).join('')}</g>`,
  fx:`<path class="b-sig" d="M0-360V-260" stroke="${a}" stroke-width="3"/>`}),
 // 12 Председатель Совета
 ([m,dk,a,g])=>({armL:`<path d="M-70-120q-30 60-20 130" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/>`,
  body:`<path d="M-140-360h280v470h-280z" fill="${dk}" ${ln(5)}/><path d="M-120-340h240v200h-240z" fill="#2a251c"/><path d="M-160 20h320v40h-320z" fill="#5a503c" ${ln(4)}/>
   <g class="ph1"><path d="M-74-190h148l10 210h-168z" fill="${m}" ${ln(5)}/><path d="M0-190v210" stroke="#d8ccb0" stroke-width="3"/></g>
   <g class="ph2"><path d="M-74-190h148l10 210h-168z" fill="#1a1712" ${ln(4)}/><path d="M-40 0h80v24h-80z" fill="#111" ${ln(3)}/><circle class="b-ring" cx="0" cy="12" r="30" fill="none" stroke="${g}" stroke-width="3"/></g>`,
  head:`<g class="ph1"><ellipse cx="0" cy="-250" rx="50" ry="62" fill="#f4eedc" ${ln(5)}/><path d="M-24-250h14M10-250h14" stroke="#c8c0a8" stroke-width="4"/>${crack(-10,-290,1.2)}</g>
   <g class="ph2"><path d="M-50-250q0-62 50-62 22 0 34 14l-20 30 26 10-10 40q-14 20-30 20-50 0-50-52z" fill="#f4eedc" ${ln(4)}/></g>`,
  armR:`<path d="M70-120q30 60 20 130" fill="none" stroke="${m}" stroke-width="26" stroke-linecap="round"/><path d="M78 20h40v16h-40z" fill="#111"/>`,
  fx:``}),
];
// портрет-риг: phase 1–3; state: idle|defeated
// К24: картинка из генератора (assets/boss/bNN_smug/_hit/_down.png, 1536×1536, тёмный ровный фон) заменяет риг.
// Корень и классы те же (.bs, .b-rig, .b-body, фазы), поэтому арена, полоса района, удары и смерть работают без изменений.
// Тёмный фон картинки гасится радиальной маской; фаза 2/3 — цвет и трещины поверх; удар — вспышка кадра _hit, поражение — _down.
export const bossImg=(d,k='smug')=>`assets/boss/b${String(d).padStart(2,'0')}_${k}.png`;
// Имена из старого ASSETS.md тоже понимаем: bNN_body_ph1…3 (по фазам) вместо smug, bNN_defeat вместо down
const ALT={smug:ph=>[`body_ph${ph}`,'smug','body_ph1'],hit:()=>['hit'],down:()=>['down','defeat']};
const pick=(d,k,ph=1)=>ALT[k](ph).find(x=>hasArt(bossImg(d,x)));
export const bossHasArt=d=>!!pick(d,'smug');
const bossPng=(d,phase,cls,c)=>{const im=(k0,x='')=>{const k=pick(d,k0,phase);return k?`<image class="b-im ${x}" href="${artUrl(bossImg(d,k))}" x="-240" y="-370" width="480" height="480" mask="url(#bmk${d})" preserveAspectRatio="xMidYMid meet"/>`:''};
 return`<svg class="bs bs-png ${cls}" data-d="${d}" data-ph="${phase}" viewBox="-230 -380 460 510" aria-hidden="true">
  <defs><radialGradient id="bau${d}"><stop offset="0" stop-color="${c[3]}" stop-opacity=".55"/><stop offset="1" stop-color="${c[3]}" stop-opacity="0"/></radialGradient>
  <radialGradient id="bmg${d}" cx=".5" cy=".5" r=".5"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="bmk${d}"><rect x="-240" y="-370" width="480" height="480" fill="url(#bmg${d})"/></mask></defs>
  <ellipse cx="0" cy="112" rx="170" ry="18" fill="#000" opacity=".55"/><ellipse class="b-aura" cx="0" cy="-130" rx="230" ry="260" fill="url(#bau${d})"/>
  <g class="b-rig"><g class="b-body">${im('smug','b-im1')}${im('hit','b-im2')}${im('down','b-im3')}${crack(-60,-250,1.4)}${crack(50,-150,1.2)}${crack(-20,-40,1)}</g></g><g class="b-fx"></g></svg>`};
export function bossSvg(d,{phase=1,cls=''}={}){const b=BOSSES[d-1],c=b.colors;if(bossHasArt(d))return bossPng(d,phase,cls,c);const p=P[d-1](c);
 return`<svg class="bs ${cls}" data-d="${d}" data-ph="${phase}" viewBox="-230 -380 460 510" aria-hidden="true">
  <defs><radialGradient id="bau${d}"><stop offset="0" stop-color="${c[3]}" stop-opacity=".55"/><stop offset="1" stop-color="${c[3]}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="0" cy="112" rx="170" ry="18" fill="#000" opacity=".55"/><ellipse class="b-aura" cx="0" cy="-130" rx="230" ry="260" fill="url(#bau${d})"/>
  <g class="b-rig"><g class="b-armL">${p.armL}</g><g class="b-body">${p.body}</g><g class="b-head">${p.head}</g><g class="b-armR">${p.armR}</g></g><g class="b-fx">${p.fx}</g></svg>`}
export const phaseOf=hp=>hp>2/3?1:hp>1/3?2:3; // 100–66, 66–33, 33–0
export function runBossArtTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('12 ригов: тело, рука и голова (у ARCHON голова = глаз)',()=>P.length===12&&P.every((f,i)=>{const p=f(BOSSES[i].colors);return p.body&&p.armL&&p.armR&&(p.head||i===10)}));
 t('у каждого босса есть смена во 2-й фазе (.ph2)',()=>P.every((f,i)=>bossSvg(i+1).includes('ph2')));
 t('фазы 100–66 / 66–33 / 33–0',()=>phaseOf(1)===1&&phaseOf(.5)===2&&phaseOf(.2)===3);
 return o}
