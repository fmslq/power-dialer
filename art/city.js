// Сцена «Ночной мегаполис»: слои SVG (небо, дальний/средний/ближний силуэты, башня The Summit, гараж с одним окном, мокрая улица с отражением)
// + canvas дождь + параллакс от курсора. Всё кодом, без файлов. Детерминированный генератор: город всегда одинаковый.
const rng=seed=>()=>(seed=(seed*16807)%2147483647)/2147483647;
const W=1600,H=900,GY=640;                                   // ширина, высота, линия горизонта (земля)
function skyline(seed,{min,max,fill,win,density,neon=0,x0=0,x1=W,wMin=40,wMax=110}){const r=rng(seed);let x=x0,out='',sg='';
 while(x<x1){const w=wMin+r()*(wMax-wMin),h=min+r()*(max-min),y=GY-h;out+=`<rect x="${x|0}" y="${y|0}" width="${w|0}" height="${h|0}" fill="${fill}"/>`;
  if(r()<.25)out+=`<rect x="${(x+w*.3)|0}" y="${(y-14-r()*22)|0}" width="${(w*.4)|0}" height="${(16+r()*20)|0}" fill="${fill}"/><rect x="${(x+w*.5)|0}" y="${(y-50-r()*20)|0}" width="2" height="${50}" fill="${fill}"/>`;
  for(let wy=y+10;wy<GY-8;wy+=11)for(let wx=x+6;wx<x+w-6;wx+=9){if(r()<density){const c=r()<.7?win[0]:r()<.5?win[1]:win[2];sg+=`<rect x="${wx|0}" y="${wy|0}" width="4" height="5" fill="${c}" opacity="${(.35+r()*.6).toFixed(2)}"/>`}}
  if(neon&&r()<neon){const c=['#ff2bd6','#3ad7ff','#39ff14','#ffc400'][r()*4|0],sy=y+20+r()*h*.4,sh=30+r()*50;out+=`<rect x="${(x+w-5)|0}" y="${sy|0}" width="5" height="${sh|0}" fill="${c}" filter="url(#glow)" class="flick" style="animation-delay:${(r()*5).toFixed(1)}s"/>`}
  x+=w+r()*6}
 return out+sg}
export function cityScene(el){
 const far=skyline(11,{min:120,max:330,fill:'#150d27',win:['#ffb347','#3ad7ff','#ff2bd6'],density:.16,wMin:30,wMax:80});
 const mid=skyline(29,{min:200,max:470,fill:'#0b0818',win:['#ffc400','#3ad7ff','#ff2bd6'],density:.22,neon:.28,wMin:50,wMax:120});
 const near=skyline(47,{min:140,max:300,fill:'#040308',win:['#7a5a1c','#14485a','#5a145a'],density:.05,x0:-30,x1:W*.17,wMin:70,wMax:130})
  +skyline(53,{min:120,max:340,fill:'#040308',win:['#7a5a1c','#14485a','#5a145a'],density:.05,x0:W*.62,x1:W+40,wMin:70,wMax:130});
 const refl=mid.replace(/filter="url\(#glow\)"/g,'');
 const summit=`<g id="summit" transform="translate(-480,60)"><path d="M1140 ${GY} L1158 330 L1174 296 L1188 200 L1195 120 L1205 120 L1212 200 L1226 296 L1242 330 L1260 ${GY}Z" fill="#1a1236" stroke="#9a4ad0" stroke-width="2" filter="url(#glow)"/><path d="M1195 120 L1188 200 L1174 296 L1158 330 L1140 ${GY} L1170 ${GY} L1190 330 L1200 120Z" fill="#0c0820" opacity=".7"/>
  ${[360,420,480,540,600].map((y,i)=>`<rect x="${1160-i*3}" y="${y}" width="${80+i*6}" height="3" fill="${i%2?'#ff2bd6':'#3ad7ff'}" opacity=".75" filter="url(#glow)"/>`).join('')}
  <rect x="1193" y="60" width="2" height="62" fill="#1a1230"/><circle cx="1194" cy="58" r="4" fill="#ff1f3d" filter="url(#glow)" class="beacon"/>
  <polygon points="1200,128 1040,-520 1360,-520" fill="url(#beam)" opacity=".5" class="sweep" style="transform-origin:1200px 128px"/>
  <text x="1250" y="372" font-family="Black Ops One,Impact,sans-serif" font-size="14" fill="#ff1f3d" opacity=".95" filter="url(#glow)" letter-spacing="3">THE SUMMIT</text></g>`;
 const garage=`<g id="garage">
  <ellipse cx="350" cy="${GY+78}" rx="260" ry="26" fill="#ffb347" opacity=".13" filter="url(#blur8)"/>
  <polygon points="150,${GY+30} 180,${GY-60} 520,${GY-60} 550,${GY+30}" fill="#1a1612" stroke="#3a2e22" stroke-width="2"/>
  <rect x="165" y="${GY-30}" width="370" height="100" fill="#14110e" stroke="#3a2e22" stroke-width="2"/>
  <rect x="200" y="${GY-5}" width="170" height="75" fill="#0b0a09"/><g stroke="#2a241c" stroke-width="2">${Array.from({length:7},(_,i)=>`<line x1="200" y1="${GY-5+i*11}" x2="370" y2="${GY-5+i*11}"/>`).join('')}</g>
  <rect x="200" y="${GY-5}" width="170" height="28" fill="#0b0a09"/>
  <rect x="420" y="${GY-10}" width="80" height="55" fill="#ffb347" filter="url(#glow)" class="lamp"/><rect x="420" y="${GY-10}" width="80" height="55" fill="url(#win)"/>
  <path d="M460 ${GY-10}V${GY+45}M420 ${GY+17}H500" stroke="#2a1c0a" stroke-width="3"/>
  <circle cx="450" cy="${GY+45}" r="0"/>
  <rect x="190" y="${GY-110}" width="2" height="55" fill="#222"/><circle cx="191" cy="${GY-112}" r="3" fill="#39ff14" filter="url(#glow)" class="beacon" style="animation-duration:1.6s"/>
  <text x="350" y="${GY-72}" text-anchor="middle" font-family="Black Ops One,Impact,sans-serif" font-size="17" fill="#3ad7ff" filter="url(#glow)" class="flick" letter-spacing="4">UPLINK</text>
  <polygon points="420,${GY+45} 500,${GY+45} 560,${GY+110} 380,${GY+110}" fill="url(#spill)"/></g>`;
 el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03030a"/><stop offset=".55" stop-color="#150a2a"/><stop offset=".78" stop-color="#3a0f3f"/><stop offset="1" stop-color="#6a1550"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14101c"/><stop offset=".3" stop-color="#0a0810"/><stop offset="1" stop-color="#030208"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2bd6" stop-opacity=".45"/><stop offset="1" stop-color="#ff2bd6" stop-opacity="0"/></linearGradient>
  <radialGradient id="win" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fff2c4" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a2a" stop-opacity="0"/></radialGradient>
  <linearGradient id="spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="rm"><rect x="0" y="${GY}" width="${W}" height="${H-GY}" fill="url(#fadeR)"/></mask>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="blur8"><feGaussianBlur stdDeviation="14"/></filter><filter id="blur3"><feGaussianBlur stdDeviation="2.5"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0"/></filter></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <ellipse cx="1000" cy="${GY-10}" rx="800" ry="150" fill="#ff2bd6" opacity=".22" filter="url(#blur8)"/>
  <g class="px" data-d="6">${far}</g>
  <g class="px" data-d="12">${summit}</g>
  <g class="px" data-d="20">${mid}</g>
  <rect y="${GY-170}" width="${W}" height="190" fill="url(#beam)" opacity=".35" class="fog" transform="scale(1,-1) translate(0,${-(GY+20)*1})" style="display:none"/>
  <g class="fogA"><ellipse cx="400" cy="${GY-20}" rx="520" ry="60" fill="#6a2a7a" opacity=".16" filter="url(#blur8)"/><ellipse cx="1200" cy="${GY-40}" rx="560" ry="70" fill="#2a3a7a" opacity=".14" filter="url(#blur8)"/></g>
  <rect y="${GY}" width="${W}" height="${H-GY}" fill="url(#ground)"/>
  <g mask="url(#rm)" opacity=".8" class="px" data-d="20"><g transform="translate(0,${GY*2}) scale(1,-1)" filter="url(#blur3)">${refl}</g></g>
  <g mask="url(#rm)" opacity=".7">${[260,420,640,900,1130,1290,1460].map((x,i)=>`<rect x="${x}" y="${GY+4}" width="${3+i%3*2}" height="${150+i*20}" fill="${['#ff2bd6','#3ad7ff','#ffb347'][i%3]}" filter="url(#blur3)" class="flick" style="animation-delay:${i*.7}s"/>`).join('')}</g>
  <g class="px" data-d="46">${near}</g>
  <g class="px" data-d="34"><g transform="translate(830,0)">${garage}</g></g>
  <path d="M-20 90 Q 200 150 420 100 T 900 120 T 1640 70" stroke="#050409" stroke-width="2" fill="none" class="px" data-d="46"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".16" style="mix-blend-mode:overlay"/></svg><canvas class="rain"></canvas><div class="vig"></div><div class="scan"></div>`;
 // параллакс
 const px=[...el.querySelectorAll('.px')];let tx=0,ty=0,cx=0,cy=0;
 addEventListener('pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5});
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // дождь
 const cv=el.querySelector('canvas'),g=cv.getContext('2d');let drops=[],w=0,h=0,fx='full';
 const fit=()=>{w=cv.width=innerWidth;h=cv.height=innerHeight;drops=Array.from({length:Math.min(260,w*h/6000|0)},()=>({x:Math.random()*w,y:Math.random()*h,l:10+Math.random()*18,v:14+Math.random()*12,a:.15+Math.random()*.3}))};fit();addEventListener('resize',fit);
 let intensity=1,run=true;
 (function loop(){if(!run)return;requestAnimationFrame(loop);cx+=(tx-cx)*.05;cy+=(ty-cy)*.05;
  if(!reduce)px.forEach(p=>{const d=+p.dataset.d;p.style.transform=`translate(${(-cx*d).toFixed(2)}px,${(-cy*d*.5).toFixed(2)}px)`});
  g.clearRect(0,0,w,h);if(fx==='off'||reduce)return;g.lineWidth=1;g.strokeStyle='#9fd8ff';const n=fx==='low'?drops.length>>1:drops.length;
  for(let i=0;i<n;i++){const d=drops[i];g.globalAlpha=d.a*intensity;g.beginPath();g.moveTo(d.x,d.y);g.lineTo(d.x-d.l*.18,d.y+d.l);g.stroke();d.y+=d.v*intensity;d.x-=d.v*.18*intensity;if(d.y>h){d.y=-d.l;d.x=Math.random()*w*1.2}}})();
 return{setFx:v=>fx=v,setIntensity:v=>intensity=v,stop:()=>run=false}}
