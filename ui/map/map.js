// КАРТА МИРА (R2, ТЗ §8): полноэкранный мир поверх рабочего экрана. Дайлер и звонок не останавливаются.
// Слои: большой статичный SVG (фон, маршрут, острова) → туман (canvas, 2 слоя) → маркеры/фигурка (обратный масштаб) → интерфейс.
// Всё, что анимируется, живёт ВНЕ большого SVG (иначе он перерисовывается каждый кадр): фигурка, кольцо выбора, огоньки, дрейф тумана, развёртка радара.
import {WORLD,NODES,mapState,markSeen,moveTo,openBridge,fitScale,LEVEL_MULT,levelOf,clampCam as clamp0,camOn,pathBetween} from '../../core/mapstate.js';
import {district,districtGround,water,terrain,roads,crest,caller,segD,RIDDLES,radarWorld,cells,cellD,bridge,BRIDGES,midOf} from '../../art/world.js';
import {keyFor} from '../../core/keys.js';
import {DIST,SHOP_ITEMS} from '../../core/meta.js';
import {CONFIG as C,districtThr} from '../../core/config.js';
import {bossState} from '../../core/engine.js';
import {icon} from '../../art/icons.js';
import {bossSvg} from '../../art/bosses.js';
import {laterOn} from '../../core/bosslater.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Math.round(v||0).toLocaleString('ru');
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const ST={captured:'Захвачен',current:'Идёт захват',boss:'Фаза босса',finish:'Финальный удар',locked:'В тумане'};
const THEME={industrial:'Ржавчина',neon:'Неон',chrome:'Хром',blackgold:'Чёрное золото',orbital:'Орбита'};
const LV=['Мир','Район','Деталь'];
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const rng=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296);
const FK=900/WORLD.w; // масштаб канвы тумана: 900×600 на мир 3600×2400 (мягкость даёт само растяжение)
// точка, где стоит фигурка (перед достопримечательностью; маршрут segD приходит сюда же)
const stand=d=>{const n=NODES[d-1];return[n[0],n[1]+40]};

export function makeMap(o){ // o: {save, G(), info()->{lvl,xp,money}, persist(), toast(m), fx()->'full'|'lite'|'off', mount:Element, onClose()}
 let goal=null,el=null,vp,camEl,fogB,fogD,cl,ring,card,tip,cam={s:1,x:0,y:0},vw=0,vh=0,fit=1,sel=1,ms=null,tw=0,busy=false,mvT=0,drag=null,queue=[],face=1;
 const root=o.save;
 const reduce=()=>RM.matches||o.fx()==='off';
 // кусок 22: мост к острову d открывается, когда есть проход на этой границе (если он там нужен)
 const pass=d=>{const k=keyFor(d);return!k||!!(root.keys&&root.keys[k.id]&&root.keys[k.id].got)};
 const S=()=>ms=mapState(root,o.G(),pass);
 const vis=d=>d===1||(root.map.seen||[]).includes(d);                 // остров виден (туман снят)
 const visOpen=()=>ms.open.filter(vis);const nextHid=()=>{for(let d=1;d<=12;d++)if(!vis(d))return d;return 13};
 const maxS=()=>fit*LEVEL_MULT[2]*1.15;
 const lvl=()=>levelOf(cam.s,fit);
 const tlvl=()=>levelOf(goal?goal.s:cam.s,fit); // уровень, к которому камера едет
 const isOpen=()=>!!el;
 const $=q=>el.querySelector(q);
 const total=()=>{const s=ms;return Math.floor(((s.cur-1)+s.pct(s.cur)/100)/12*100)};
 // ---------- сборка ----------
 const marker=d=>{const i=d-1,s=ms.state(d),[x,y,R]=NODES[i],lk=s==='locked',name=lk?'???':DIST[i][0];
  return`<button class="wm-m st-${s} ${d===ms.cur+1?'next':''}" data-d="${d}" style="left:${x}px;top:${y-R*.62-8}px" aria-label="${esc(lk?'Район '+d+' в тумане':name)}">
   ${crest(i,s)}<b>${esc(name)}</b>${lk?'':`<em>${ms.pct(d)}%</em>`}${d===ms.cur&&bossState(o.G())!=='scenery'?`<span class="wm-boss${laterOn(o.G())?' wait':''}" title="${esc(DIST[i][3])}${laterOn(o.G())?' ждёт боя':' в бою'}">${bossSvg(d,{phase:0})}</span>`:''}</button>`};
 const riddle=()=>{const d=nextHid();if(d>12)return'';const [x,y,R]=NODES[d-1];return`<div class="wm-rd" style="left:${x}px;top:${y+R*.35}px"><i>${esc(RIDDLES[d-1])}</i></div>`};
 const embers=()=>{const r=rng(5);let s='';for(let d=ms.cur+1;d<=12;d++){const [x,y,R]=NODES[d-1];for(let k=0;k<3;k++)s+=`<i class="wm-e" style="left:${Math.round(x+(r()-.5)*R*1.6)}px;top:${Math.round(y+(r()-.5)*R)}px;--dl:${(r()*6).toFixed(1)}s;--du:${(4+r()*4).toFixed(1)}s"></i>`}return s};
 const doneD=()=>{let d='';for(let k=1;k<ms.cur;k++)if(ms.bridge(k+1)==='open')d+=segD(k,k+1);return d};
 // значки мостов: готов — пульсирующая кнопка «Открыть мост», нет прохода — замок с названием прохода
 const bmark=d=>{const st=ms.bridge(d),B=BRIDGES[d];if(!B||st==='open'||st==='locked')return'';const [x,y]=midOf(d),k=keyFor(d);
  return st==='ready'?`<button class="wm-bm ready" data-br="${d}" style="left:${Math.round(x)}px;top:${Math.round(y)}px" title="${esc(B.n)}: ${esc(B.lock)}">${icon('map')}<b>Открыть мост</b><em>${esc(B.n)}</em></button>`
   :`<div class="wm-bm pass" style="left:${Math.round(x)}px;top:${Math.round(y)}px" title="${esc(B.lock)}">${icon('lock')}<b>${esc(B.n)}</b><em>нужен проход${k?': '+esc(k.n.toLowerCase()):''}</em></div>`};
 const build=()=>{S();const isl=NODES.map((_,i)=>districtGround(i)).join('')+water()+NODES.map((_,i)=>district(i,ms.pct(i+1),!vis(i+1))).join('');
  el=document.createElement('div');el.className='wm';el.dataset.theme=ms.theme;el.setAttribute('role','dialog');el.setAttribute('aria-label','Карта мира');
  el.innerHTML=`<div class="wm-vp" id="wm-vp"><div class="wm-cam" id="wm-cam">
    <svg class="wm-w" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true">${terrain()}
     ${isl}${roads(d=>ms.bridge(d))}<path class="wm-rt-done" d="${doneD()}"/><g id="wm-paths" fill="none" stroke="none" visibility="hidden"></g></svg>
    <svg class="wm-so" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true"><path id="wm-so"/></svg>
    <svg class="wm-ink" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true"></svg>
    <svg class="wm-r" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true"></svg>
    <canvas class="wm-bmp" width="8" height="8"></canvas>
    <svg class="wm-tr" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true"></svg>
    <canvas class="wm-fog b" width="900" height="600"></canvas><canvas class="wm-fog d" width="900" height="600"></canvas>
    <div class="wm-fx">${embers()}</div>
    <div class="wm-mk">${NODES.map((_,i)=>marker(i+1)).join('')}${riddle()}<div id="wm-bms"></div></div>
    <div class="wm-cl" id="wm-cl">${caller()}</div>
   </div></div>
   <div class="wm-radar" aria-hidden="true"><i class="sw"></i><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>
   <div class="wm-vig" aria-hidden="true"></div>
   <header class="wm-top"><div class="wm-ttl"><b>КАРТА МИРА</b><span id="wm-tot"></span></div><div class="wm-stats" id="wm-stats"></div>
    <button class="wm-x" id="wm-x" title="Закрыть (Esc)" aria-label="Закрыть карту"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></header>
   <aside class="wm-goal" id="wm-goal"></aside>
   <div class="wm-zoom" aria-label="Масштаб"><button data-z="in" title="Приблизить (+)">+</button><div class="wm-zt" id="wm-zt">${LV.map((t,k)=>`<i data-lv="${k}" title="${t}"><span>${t}</span></i>`).join('')}<b id="wm-zk"></b></div><button data-z="out" title="Отдалить (−)">−</button></div>
   <nav class="wm-list" id="wm-list" aria-label="Список районов"></nav>
   <div class="wm-bl"><div class="wm-seg" role="group" aria-label="Вид карты"><button data-th="art">Иллюстрация</button><button data-th="radar">Радар</button></div>
    <button class="wm-lb" id="wm-lb" title="Список районов (L)">${icon('table')}<span>Список</span></button></div>
   <aside class="wm-sel" id="wm-sel"></aside>
   <footer class="wm-keys"><span><kbd>←</kbd><kbd>→</kbd>район</span><span><kbd>Enter</kbd>идти</span><span><kbd>+</kbd><kbd>−</kbd>/колесо — масштаб</span><span>тянуть — двигать</span><span><kbd>V</kbd>вид</span><span><kbd>Esc</kbd>назад</span></footer>
   <div class="wm-tip" id="wm-tip"></div>`;
  o.mount.append(el);vp=$('#wm-vp');camEl=$('#wm-cam');fogB=$('.wm-fog.b');fogD=$('.wm-fog.d');cl=$('#wm-cl');ring=$('#wm-so');card=$('#wm-sel');tip=$('#wm-tip');
  el.classList.toggle('rm',reduce());el.classList.toggle('list',!!root.map.list);bind()};
 // ---------- туман ----------
 // Как в Genshin: тёмно-синяя пустота с тусклыми красными облачными пятнами, у края открытой земли слабое свечение.
 const spots=(c,seed,n,alpha,rd)=>{const r=rng(seed);for(let k=0;k<n;k++){const x=r()*900,y=r()*600,s=30+r()*120,red=r()<.55;const g=c.createRadialGradient(x,y,0,x,y,s);
  g.addColorStop(0,rd?(red?`rgba(20,90,30,${alpha*.6})`:`rgba(10,50,20,${alpha})`):red?`rgba(120,28,44,${alpha})`:`rgba(34,58,128,${alpha})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-s,y-s,s*2,s*2)}};
 // мягкая «дыра» по контуру района: тень от фигуры, вынесенной за край канвы (работает и в Safari, где нет ctx.filter)
 const MK=document.createElement('canvas');MK.width=900;MK.height=600;const mk=MK.getContext('2d');
 const cutCell=(c,d,a=1,blur=16)=>{const P=cells()[d-1];mk.setTransform(1,0,0,1,0,0);mk.globalCompositeOperation='source-over';mk.clearRect(0,0,900,600);
  mk.shadowColor=`rgba(0,0,0,${a})`;mk.shadowBlur=blur;mk.shadowOffsetX=3000;mk.fillStyle='#000';mk.beginPath();P.forEach(([x,y],k)=>k?mk.lineTo(x*FK-3000,y*FK):mk.moveTo(x*FK-3000,y*FK));mk.closePath();mk.fill();
  c.save();c.globalCompositeOperation='destination-out';c.drawImage(MK,0,0);c.restore()};
 // кусок 22: туман расходится и над мостами (открытыми и готовыми) — видно, что острова связаны
 const cutBridge=(c,d,a=1,blur=18,w=120)=>{const [x0,y0]=NODES[d-2],[x1,y1]=NODES[d-1],mx=(x0+x1)/2,my=(y0+y1)/2-60;mk.setTransform(1,0,0,1,0,0);mk.globalCompositeOperation='source-over';mk.clearRect(0,0,900,600);
  mk.shadowColor=`rgba(0,0,0,${a})`;mk.shadowBlur=blur;mk.shadowOffsetX=3000;mk.strokeStyle='#000';mk.lineWidth=w*FK;mk.lineCap='round';mk.beginPath();mk.moveTo(x0*FK-3000,(y0+40)*FK);mk.quadraticCurveTo(mx*FK-3000,my*FK,x1*FK-3000,(y1+40)*FK);mk.stroke();
  c.save();c.globalCompositeOperation='destination-out';c.drawImage(MK,0,0);c.restore()};
 const cutBridges=(c,a=1,blur=18)=>{for(let d=2;d<=12;d++){const b=ms.bridge(d);if(vis(d-1)&&(b==='open'||b==='ready'||b==='pass'))cutBridge(c,d,b==='open'?a:a*.7,blur,b==='open'?150:110)}};
 const drawFog=(wave)=>{const c=fogB.getContext('2d'),open=visOpen().filter(d=>!wave||d!==wave.d),rd=ms.theme==='radar';c.globalCompositeOperation='source-over';c.clearRect(0,0,900,600);
  const g=c.createLinearGradient(0,600,900,0);g.addColorStop(0,rd?'rgba(2,16,6,.95)':'rgba(12,16,38,.9)');g.addColorStop(1,rd?'rgba(1,8,3,.96)':'rgba(6,8,22,.93)');c.fillStyle=g;c.fillRect(0,0,900,600);
  c.globalCompositeOperation='source-atop';spots(c,11,70,.32,rd);
  // свечение у края открытой земли (Genshin): широкая светлая обводка открытых районов, потом сами районы вырезаются
  c.save();c.lineJoin='round';c.strokeStyle=rd?'rgba(57,255,20,.10)':'rgba(120,170,255,.10)';for(const w of [44,26,12]){c.lineWidth=w;for(const d of visOpen()){const P=cells()[d-1];c.beginPath();P.forEach(([x,y],k)=>k?c.lineTo(x*FK,y*FK):c.moveTo(x*FK,y*FK));c.closePath();c.stroke()}}c.restore();
  for(const d of open)cutCell(c,d);cutBridges(c);
  if(nextHid()<=12)cutCell(c,nextHid(),.26,30);
  edge(c);
  if(wave){c.save();c.beginPath();c.arc(wave.x*FK,wave.y*FK,wave.r*FK,0,7);c.clip();cutCell(c,wave.d);c.restore();
   const [x,y,R]=NODES[wave.d-1];c.save();c.globalCompositeOperation='source-over';const P=cells()[wave.d-1];c.beginPath();P.forEach(([px,py],k)=>k?c.lineTo(px*FK,py*FK):c.moveTo(px*FK,py*FK));c.closePath();c.clip();
   const w=c.createRadialGradient(wave.x*FK,wave.y*FK,Math.max(0,wave.r-90)*FK,wave.x*FK,wave.y*FK,(wave.r+30)*FK);
   w.addColorStop(0,'rgba(160,220,255,0)');w.addColorStop(.75,`rgba(170,225,255,${.45*(1-wave.t)})`);w.addColorStop(1,'rgba(160,220,255,0)');c.fillStyle=w;c.fillRect(0,0,900,600);c.restore()}};
 const edge=c=>{c.save();c.globalCompositeOperation='source-over';for(const [x0,y0,x1,y1] of [[0,0,110,0],[900,0,790,0],[0,0,0,80],[0,600,0,520]]){const g=c.createLinearGradient(x0,y0,x1,y1);const ec=ms.theme==='radar'?'2,10,4':'9,12,30';g.addColorStop(0,`rgba(${ec},1)`);g.addColorStop(1,`rgba(${ec},0)`);c.fillStyle=g;c.fillRect(0,0,900,600)}c.restore()};
 const drawDrift=()=>{const c=fogD.getContext('2d');c.globalCompositeOperation='source-over';c.clearRect(0,0,900,600);spots(c,29,46,.38);
  for(const d of visOpen())cutCell(c,d,1,40);cutBridges(c,1,40);if(nextHid()<=12)cutCell(c,nextHid(),.5,40);
  c.globalCompositeOperation='destination-out';for(const [x0,y0,x1,y1] of [[0,0,120,0],[900,0,780,0],[0,0,0,90],[0,600,0,510]]){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,900,600)}};
 // ---------- снимок мира для движения ----------
 // Пока камера едет/тянется/зумится, вместо большого SVG показывается его растровый снимок (одна текстура, браузер не перерисовывает тысячи фигур
 // на каждом кадре зума: без этого переходы зума падали до 11 кадров/с). В покое снова виден чёткий SVG.
 let bmpTok=0;const BMP_CSS='.fl text{font:600 13px monospace;fill:#e9dcb8;opacity:.8}.fl:not(.on) text{opacity:.45}.wm-rt-done{fill:none;stroke:#fff1c2;stroke-width:6;stroke-linecap:round;opacity:.7}#wm-paths{display:none}';
 const renderBmp=()=>{if(!el)return;const tok=++bmpTok;el.classList.remove('bmp-ok');const sv=$('.wm-w'),k=Math.min(1,Math.max(.4,(devicePixelRatio||1)*fit*LEVEL_MULT[1]));
  const cl0=sv.cloneNode(true);cl0.setAttribute('xmlns','http://www.w3.org/2000/svg');cl0.setAttribute('width',Math.round(WORLD.w*k));cl0.setAttribute('height',Math.round(WORLD.h*k));cl0.removeAttribute('class');
  const st=document.createElementNS('http://www.w3.org/2000/svg','style');st.textContent=BMP_CSS;cl0.prepend(st);
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl0)],{type:'image/svg+xml'})),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(url);if(tok!==bmpTok||!el)return;const c=$('.wm-bmp');c.width=Math.round(WORLD.w*k);c.height=Math.round(WORLD.h*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);el.classList.add('bmp-ok')};
  img.onerror=()=>URL.revokeObjectURL(url);img.src=url};
 // ---------- камера ----------
 const apply=()=>{camEl.style.transform=`translate3d(${cam.x.toFixed(1)}px,${cam.y.toFixed(1)}px,0) scale(${cam.s.toFixed(4)})`;camEl.style.setProperty('--inv',(1/cam.s).toFixed(4));
  const L=lvl();el.dataset.lvl=L;const k=Math.log(cam.s/fit)/Math.log(maxS()/fit);$('#wm-zk').style.top=`${((1-Math.max(0,Math.min(1,k)))*100).toFixed(1)}%`;
  el.querySelectorAll('.wm-zt i').forEach(i=>i.classList.toggle('on',+i.dataset.lv===L))};
 const moving=()=>{camEl.classList.add('mv');clearTimeout(mvT);mvT=setTimeout(()=>camEl&&camEl.classList.remove('mv'),180)};
 const setCam=c=>{cam=clampCam(c,vw,vh);apply();moving()};
 const tween=(to,ms0=560,done)=>{cancelAnimationFrame(tw);goal=null;to=clampCam(to,vw,vh);if(reduce()||ms0<=0){cam=to;apply();done&&done();return}
  goal=to;const a={...cam},t0=performance.now(),la=Math.log(a.s),lb=Math.log(to.s);camEl.classList.add('mv');
  const step=t=>{const k=Math.min(1,(t-t0)/ms0),e=ease(k),s=Math.exp(la+(lb-la)*e);
   // зум вокруг цели: точка мира под центром экрана плавно едет к цели
   const ax=(vw/2-a.x)/a.s,ay=(vh/2-a.y)/a.s,bx=(vw/2-to.x)/to.s,by=(vh/2-to.y)/to.s,wx=ax+(bx-ax)*e,wy=ay+(by-ay)*e;
   cam={s,x:vw/2-wx*s,y:vh/2-wy*s};if(k>=1)cam=to;apply();if(k<1)tw=requestAnimationFrame(step);else{goal=null;moving();done&&done()}};tw=requestAnimationFrame(step)};
 const lvS=k=>fit*LEVEL_MULT[k];
 const clampCam=(c,w,h)=>{const r=card&&card.getBoundingClientRect(),b=el&&el.getBoundingClientRect();if(!r||!r.width||!b)return clamp0(c,w,h);
  return vw<=820?clamp0(c,w,h,.25,Math.min(.7,(b.bottom-r.top)/h+.12)):clamp0(c,w,h,Math.min(.6,(b.right-r.left)/w+.08),.25)};
 // центр видимой части: справа карточка района (широко) или снизу (узко) — район не должен прятаться под ней
 const camAt=(x,y,s)=>{const c=camOn(x,y,s,vw,vh),r=card&&card.getBoundingClientRect(),b=el.getBoundingClientRect();if(!r||!r.width)return c;
  if(vw<=820)c.y+=Math.max(70,(r.top-b.top))/2+20-vh/2;else c.x+=(r.left-b.left)/2-vw/2+20;return c};
 const focus=(d,k,ms0)=>{const [x,y]=stand(d);tween(camAt(x,y-60,k==null?cam.s:lvS(k)),ms0)};
 const zoomLevel=k=>{k=Math.max(0,Math.min(2,k));if(k===0)return tween({s:fit,...camOn(WORLD.w/2,WORLD.h/2,fit,vw,vh)});focus(sel,k)};
 const zoomAt=(mx,my,ns)=>{ns=Math.max(fit,Math.min(maxS(),ns));const k=ns/cam.s;setCam({s:ns,x:mx-(mx-cam.x)*k,y:my-(my-cam.y)*k})};
 const resize=()=>{const r=el.getBoundingClientRect();const ow=vw,oh=vh;vw=r.width;vh=r.height;const of=fit;fit=fitScale(vw,vh);
  if(ow){const cx=(ow/2-cam.x)/cam.s,cy=(oh/2-cam.y)/cam.s,s=cam.s/of*fit;cam=clampCam(camOn(cx,cy,s,vw,vh),vw,vh);apply()}};
 // ---------- фигурка ----------
 const putCaller=(x,y)=>{cl.style.left=x+'px';cl.style.top=y+'px';cl.style.setProperty('--fc',face)};
 const placeRing=()=>{ring.setAttribute('d',cellD(sel));ring.setAttribute('class',ms.state(sel)==='locked'?'lk':'')};
 const walk=(a,b,done)=>{if(a===b||reduce()){if(b!==a){moveTo(root,o.G(),b);o.persist()}const [x,y]=stand(b);putCaller(x,y);done&&done();return}
  busy=true;el.classList.add('busy');const seq=pathBetween(a,b),host=$('#wm-paths');let i=0;cl.classList.add('walk');
  const leg=()=>{if(!el)return;if(i>=seq.length-1){cl.classList.remove('walk');busy=false;el.classList.remove('busy');moveTo(root,o.G(),b);o.persist();S();refresh();done&&done();return}
   const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',segD(seq[i],seq[i+1]));host.append(p);const L=p.getTotalLength(),dur=Math.max(650,Math.min(1500,L/0.75)),t0=performance.now();
   const tc=o.trail&&o.trail();let tp=null;if(tc){tp=document.createElementNS('http://www.w3.org/2000/svg','path');tp.setAttribute('d',segD(seq[i],seq[i+1]));tp.setAttribute('class','wm-trail');tp.style.setProperty('--tc',tc);tp.style.strokeDasharray=L;tp.style.strokeDashoffset=L;($('.wm-tr')||host).append(tp)}
   const follow=lvl()>0;const step=t=>{if(!el)return;const k=Math.min(1,(t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,q=p.getPointAtLength(e*L),q2=p.getPointAtLength(Math.min(L,e*L+2));
    face=q2.x<q.x-.01?-1:q2.x>q.x+.01?1:face;putCaller(q.x,q.y);if(tp)tp.style.strokeDashoffset=L*(1-e);if(follow){cam=clampCam(camAt(q.x,q.y-60,cam.s),vw,vh);apply();camEl.classList.add('mv')}
    if(k<1)tw=requestAnimationFrame(step);else{p.remove();if(tp){const z=tp;setTimeout(()=>z.classList.add('gone'),900);setTimeout(()=>z.remove(),2600)}i++;moving();leg()}};tw=requestAnimationFrame(step)};leg()};
 // ---------- раскрытие района волной от фигурки ----------
 // кат-сцена захвата (ТЗ §8 п.8): вспышка, чернила цвета игрока разливаются по району из центра, фигурка ставит флаг,
 // тропа к следующему району прорисовывается — затем обычное раскрытие (туман расходится волной)
 const capture=(c,done)=>{const ink=$('.wm-ink');if(!ink||reduce())return done();const [x,y,R]=NODES[c-1],[fx,fy]=stand(c),sg=segD(c,c+1);
  ink.innerHTML=`<defs><clipPath id="ink-c"><path d="${cellD(c)}"/></clipPath></defs><g clip-path="url(#ink-c)"><circle class="ink" cx="${x}" cy="${y}" r="${R*2.6}"/></g>
   <path class="ink-edge" d="${cellD(c)}"/><path class="ink-path" d="${sg}" pathLength="1"/>
   <g transform="translate(${fx+30} ${fy-4}) scale(2.2)"><g class="ink-flag"><path d="M0 0V-70" stroke="#e8f0ec" stroke-width="5"/><path d="M2-70h46l-10 14 10 14H2z" fill="#39ff14"/></g></g>`;
  el.classList.add('cap');busy=true;focus(c,1,600);setTimeout(()=>{o.sfx&&o.sfx('fanfare');el.classList.add('cap-go')},650);
  setTimeout(()=>{el&&el.classList.remove('cap','cap-go');ink.innerHTML='';done()},2900)};
 const reveal=(d,done)=>d>1&&!o.noCapture?capture(d-1,()=>el&&reveal0(d,done)):reveal0(d,done);
 const reveal0=(d,done)=>{const g=$('#dist-'+d);if(g&&g.classList.contains('lk'))g.outerHTML=district(d-1,ms.pct(d),false);const [cx,cy]=cl?[parseFloat(cl.style.left),parseFloat(cl.style.top)]:stand(d-1);const [x,y,R]=NODES[d-1],far=Math.hypot(x-cx,y-cy)+R*1.6;
  const fin=()=>{markSeen(root,d);o.persist();S();{const rd=$('.wm-rd'),nr=riddle();if(rd)rd.outerHTML=nr;else if(nr)$('.wm-mk').insertAdjacentHTML('beforeend',nr)}$('.wm-r').innerHTML='';radarFill();renderBmp();drawFog();drawDrift();refresh();o.toast(`Открыт район ${d}: ${DIST[d-1][0]}`);done&&done()};
  if(reduce())return fin();busy=true;el.classList.add('busy');focus(d,1,700);const t0=performance.now()+500,dur=1700;
  const step=t=>{if(!el)return;const k=Math.max(0,Math.min(1,(t-t0)/dur));drawFog({d,x:cx,y:cy,r:far*ease(k),t:k});if(k<1)requestAnimationFrame(step);else{busy=false;el.classList.remove('busy');fin()}};requestAnimationFrame(step)};
 const runQueue=()=>{if(!el||busy)return;const d=queue.shift();if(!d)return;
  // фигурка стоит на соседнем районе — сперва волна, потом она сама переходит в новый район
  const after=()=>{sel=d;refresh();o.onReveal?o.onReveal(d,()=>runQueue()):runQueue()};
  reveal(d,()=>{const p=root.map.pos;if(p===d-1)walk(p,d,after);else after()})};
 // ---------- интерфейс ----------
 const cardHtml=d=>{const i=d-1,s=ms.state(d),lk=s==='locked',D=DIST[i],cf=C.districts[i],thr=districtThr(d),G=o.G(),p=ms.pct(d),here=root.map.pos===d,
  xp=d<ms.cur?thr:d===ms.cur?Math.min(thr,G.dxp):0,items=SHOP_ITEMS.filter(x=>x.district===d),boss=s==='boss'||s==='finish'||d<ms.cur;
  return`<div class="wm-ch" style="--dc:${lk?'#59606c':D[1]}">${crest(i,s)}<div><small>Район ${d} · ${lk?'не разведан':THEME[D[2]]||''}</small><b>${esc(lk?'???':D[0])}</b></div></div>
   <div class="wm-st st-${s}"><i></i>${ST[s]}${here?' · ты здесь':''}</div>
   ${lk?`<p class="wm-rq">«${esc(RIDDLES[i]||'')}»</p>`:`<div class="wm-pb"><div class="r"><span>Прогресс захвата</span><b>${p}%</b></div><div class="bar"><i style="width:${p}%"></i></div><div class="r sm"><span>XP района</span><b>${num(xp)} / ${num(thr)}</b></div></div>`}
   <div class="wm-kv"><span>Сложность</span><b>×${cf[3]} · ${cf[2]} дн. по плану</b></div>
   <div class="wm-kv"><span>Босс</span><b>${lk||!boss&&d===ms.cur&&s==='current'?'???':esc(D[3])}</b></div>${!lk&&(boss)?`<p class="wm-bs">${esc(D[4])}</p>`:''}
   ${d>1&&!lk&&BRIDGES[d]?`<div class="wm-kv"><span>Мост</span><b>${esc(BRIDGES[d].n)} · ${{open:'открыт',ready:'можно открыть',pass:'нужен проход',locked:'закрыт'}[ms.bridge(d)]}</b></div>${ms.bridge(d)!=='open'?`<p class="wm-bs">${esc(BRIDGES[d].lock)}</p>`:''}`:''}
   <div class="wm-kv"><span>Награда</span><b>${d<12?(lk?'???':'путь в район '+(d+1)):'Вершина'} · предметы базы</b></div>
   <ul class="wm-shop">${items.map(x=>`<li class="${lk?'lk':''}"><i>${lk?icon('lock'):icon('base')}</i><b>${esc(lk?'???':x.name)}</b><span>${esc(x.tier)}</span></li>`).join('')}</ul>
   <button class="wm-go ${lk||!lk&&!ms.reach(d)&&ms.bridge(d)!=='ready'?'off':''}" id="wm-go" ${lk||busy?'disabled':''}>${lk?`${icon('lock')}В тумане — захвати район ${ms.cur}`:!ms.reach(d)?(ms.bridge(d)==='ready'?`${icon('map')}Открыть мост<kbd>Enter</kbd>`:`${icon('lock')}Сначала мост`):here?`${icon('map')}Ты здесь · Enter — ближе`:`${icon('map')}Идти сюда<kbd>Enter</kbd>`}</button>`};
 const goalHtml=()=>{const G=o.G(),d=ms.cur,D=DIST[d-1],thr=districtThr(d),b=bossState(G),left=Math.max(0,thr-G.dxp);
  return`<small>${b==='scenery'?'ТЕКУЩАЯ ЦЕЛЬ':b==='boss'?'ФАЗА БОССА':'ФИНАЛЬНЫЙ УДАР'}</small><b>${b==='scenery'?`Захвати ${esc(D[0])}`:b==='boss'?`${esc(D[3])} вышел из тени`:`Добей ${esc(D[3])}`}</b>
   <span>${b==='finish'?'Нужен BOOKED или DISCOVERY':`осталось ${num(left)} XP`}</span>${ms.reveal.length?`<em>Новый район открыт!</em>`:NODES.some((_,i)=>ms.bridge(i+1)==='ready')?`<em>Мост готов — нажми на него</em>`:''}${laterOn(G)&&o.onFight?`<button class="wm-fight" id="wm-fight">Босс ждёт — начать бой</button>`:''}`};
 const listHtml=()=>NODES.map((_,i)=>{const d=i+1,s=ms.state(d),lk=s==='locked';return`<button class="wm-li st-${s} ${d===sel?'on':''}" data-d="${d}">${crest(i,s)}<b>${d}. ${esc(lk?'???':DIST[i][0])}</b><span>${lk?ST[s]:ms.pct(d)+'%'}</span></button>`}).join('');
 const refresh=()=>{if(!el)return;S();const inf=o.info();$('#wm-tot').textContent=`КОНГЛОМЕРАТ · район ${ms.cur} из 12 · вся карта ${total()}%`;
  $('#wm-stats').innerHTML=`<span><small>Уровень</small><b>${esc(inf.lvl)}</b></span><span><small>XP</small><b>${num(inf.xp)}</b></span><span><small>Деньги</small><b class="m">${esc(inf.money)}</b></span>`;
  $('#wm-goal').innerHTML=goalHtml();{const bm=$('#wm-bms');if(bm)bm.innerHTML=NODES.slice(1).map((_,k)=>bmark(k+2)).join('')}card.innerHTML=cardHtml(sel);$('#wm-list').innerHTML=listHtml();placeRing();
  el.querySelectorAll('.wm-m').forEach(m=>m.classList.toggle('on',+m.dataset.d===sel));el.querySelectorAll('[data-th]').forEach(b=>b.classList.toggle('on',b.dataset.th===ms.theme));
  const g=$('#wm-go');if(g)g.onclick=()=>go(sel);const fb=$('#wm-fight');if(fb)fb.onclick=()=>o.onFight()};
 const select=(d,fly)=>{d=Math.max(1,Math.min(Math.min(12,ms.cur+1),d));sel=d;refresh();if(fly)focus(d,Math.max(1,lvl()))};
 // кусок 22: игрок сам открывает мост — анимация прокладки/разблокировки, потом раскрытие острова (туман, сцена захвата, переход)
 const openB=d=>{if(busy||!el)return;if(!openBridge(root,o.G(),d,pass))return;o.persist();const g=$('#br-'+d),B=BRIDGES[d];busy=true;el.classList.add('busy');
  const [x,y]=midOf(d);tween(camAt(x,y-40,Math.max(cam.s,lvS(1))),500);o.sfx&&o.sfx('levelup');
  setTimeout(()=>{if(!el)return;if(g){g.classList.add('build');const sp=document.createElement('div');sp.className='wm-bsp';sp.style.left=Math.round(x)+'px';sp.style.top=Math.round(y)+'px';
   let h='';for(let k=0;k<16;k++){const a=k/16*6.283,r=40+Math.random()*70;h+=`<i style="--x:${Math.round(Math.cos(a)*r)}px;--y:${Math.round(Math.sin(a)*r*.6)}px;--d:${(.5+Math.random()*.5).toFixed(2)}s"></i>`}sp.innerHTML=h;$('.wm-fx').append(sp);setTimeout(()=>sp.remove(),1400)}},reduce()?0:450);
  setTimeout(()=>{if(!el)return;if(g)g.outerHTML=bridge(d,'open');S();$('#wm-bms').innerHTML=NODES.slice(1).map((_,k)=>bmark(k+2)).join('');$('.wm-rt-done').setAttribute('d',doneD());o.toast(`${B.n}: ${B.done}`);busy=false;el.classList.remove('busy');renderBmp();
   if(ms.reveal.includes(d)&&!queue.includes(d))queue.push(d);runQueue()},reduce()?50:2100)};
 const go=d=>{if(busy)return;const s=ms.state(d);if(s==='locked'){card.classList.remove('no');void card.offsetWidth;card.classList.add('no');return}
  {const b=ms.bridge(d);if(b==='ready')return openB(d);if(!ms.reach(d)){card.classList.remove('no');void card.offsetWidth;card.classList.add('no');const B=BRIDGES[b==='pass'?d:(()=>{let k=2;while(k<=d&&ms.bridge(k)==='open')k++;return k})()];if(B)o.toast(`${B.n}: ${B.lock}`);return}}
  const p=root.map.pos;if(d===p)return focus(d,Math.min(2,lvl()+1));if(lvl()===0)focus(p,1,420);walk(p,d,()=>{sel=d;refresh()})};
 const radarFill=()=>{const r=$('.wm-r');if(ms.theme==='radar'&&!r.childElementCount)r.innerHTML=radarWorld(ms.open)};
 const theme=t=>{root.map.theme=t;el.dataset.theme=t;o.persist();S();radarFill();drawFog();refresh()};
 const list=v=>{root.map.list=v;el.classList.toggle('list',v);o.persist()};
 // ---------- ввод ----------
 const bind=()=>{$('#wm-x').onclick=close;
  el.querySelector('.wm-zoom').onclick=e=>{const b=e.target.closest('[data-z],[data-lv]');if(!b)return;if(b.dataset.lv!=null)return zoomLevel(+b.dataset.lv);const L=tlvl();zoomLevel(b.dataset.z==='in'?Math.min(2,L+1):L-1)};
  el.querySelector('.wm-seg').onclick=e=>{const b=e.target.closest('[data-th]');if(b)theme(b.dataset.th)};$('#wm-lb').onclick=()=>list(!root.map.list);
  $('#wm-list').onclick=e=>{const b=e.target.closest('[data-d]');if(b)select(+b.dataset.d,true)};
  // колесо мыши — зум к курсору; щипок трекпада (Mac шлёт его как wheel + ctrlKey) — зум; два пальца вбок/по диагонали — сдвиг
  vp.addEventListener('wheel',e=>{e.preventDefault();if(busy)return;cancelAnimationFrame(tw);const r=el.getBoundingClientRect(),k=e.deltaMode===1?32:1,dx=e.deltaX*k,dy=e.deltaY*k;
   if(!e.ctrlKey&&Math.abs(dx)>.5)return setCam({s:cam.s,x:cam.x-dx,y:cam.y-dy});zoomAt(e.clientX-r.left,e.clientY-r.top,cam.s*Math.exp(-dy*(e.ctrlKey?.01:.0016)))},{passive:false});
  vp.addEventListener('pointerdown',e=>{if(e.button!==0)return;cancelAnimationFrame(tw);drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,m:false,id:e.pointerId}});
  vp.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.m&&Math.hypot(dx,dy)>5){drag.m=true;vp.setPointerCapture(drag.id);el.classList.add('drag');tip.classList.remove('on')}
    if(drag.m&&!busy)setCam({s:cam.s,x:drag.cx+dx,y:drag.cy+dy});return}
   {const b=e.target.closest('[data-br]');if(b){const d=+b.dataset.br,B=BRIDGES[d],st=ms.bridge(d),r=el.getBoundingClientRect();if(B){tip.innerHTML=`<b>${esc(B.n)}</b><span>${st==='open'?esc(B.done):st==='ready'?'Нажми — открыть мост':esc(B.lock)}</span>`;tip.style.transform=`translate(${Math.round(e.clientX-r.left+16)}px,${Math.round(e.clientY-r.top+18)}px)`;tip.classList.add('on');return}}}
   const m=e.target.closest('.wm-m,.dz,.ri');if(!m){tip.classList.remove('on');return}const d=+m.dataset.d,s=ms.state(d),r=el.getBoundingClientRect();
   tip.innerHTML=`<b>${esc(s==='locked'?'???':DIST[d-1][0])}</b><span>${ST[s]}${s==='locked'?'':' · '+ms.pct(d)+'%'}</span>`;tip.style.transform=`translate(${Math.round(e.clientX-r.left+16)}px,${Math.round(e.clientY-r.top+18)}px)`;tip.classList.add('on')});
  const up=e=>{if(!drag)return;const was=drag.m;drag=null;el.classList.remove('drag');if(was)return;{const b=e.target.closest('[data-br]');if(b){const d=+b.dataset.br;if(ms.bridge(d)==='ready')return openB(d);select(d,lvl()>0);const B=BRIDGES[d];if(B&&ms.bridge(d)!=='open')o.toast(`${B.n}: ${B.lock}`);return}}const m=e.target.closest('.wm-m,.dz,.ri');if(!m)return;const d=+m.dataset.d;
   if(d===sel)go(d);else select(d,lvl()>0)};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',()=>{drag=null;el.classList.remove('drag')});vp.addEventListener('pointerleave',()=>tip.classList.remove('on'));
  vp.addEventListener('dblclick',e=>{const m=e.target.closest('.wm-m,.dz,.ri');if(m)go(+m.dataset.d)})};
 const key=e=>{if(!el)return false;const c=e.code;
  if(c==='Escape'){if(root.map.list&&innerWidth<760){list(false);return true}if(tlvl()>0)zoomLevel(tlvl()-1);else close();return true}
  if(c==='KeyG'&&e.shiftKey){close();return true}
  if(e.metaKey||e.ctrlKey||e.altKey)return false;
  if(busy&&c!=='KeyV'&&c!=='KeyL')return true;
  if(c==='ArrowRight'||c==='ArrowUp'||c==='KeyD'||c==='KeyW'){select(sel+1,true);return true}
  if(c==='ArrowLeft'||c==='ArrowDown'||c==='KeyA'||c==='KeyS'){select(sel-1,true);return true}
  if(c==='Enter'||c==='Space'||c==='NumpadEnter'){go(sel);return true}
  if(c==='Equal'||c==='NumpadAdd'){zoomLevel(Math.min(2,tlvl()+1));return true}
  if(c==='Minus'||c==='NumpadSubtract'){zoomLevel(tlvl()-1);return true}
  if(c==='Home'||c==='KeyF'){sel=root.map.pos;refresh();focus(sel,Math.max(1,lvl()));return true}
  if(c==='KeyV'){theme(ms.theme==='art'?'radar':'art');return true}
  if(c==='KeyL'){list(!root.map.list);return true}
  return true}; // остальное глотаем, как игровое меню: статус ставится после закрытия карты
 // ---------- открыть / закрыть ----------
 const onResize=()=>{if(el)resize()};
 const open=()=>{if(el)return;build();vw=0;resize();sel=root.map.pos;queue=[...ms.reveal];
  const pend=NODES.map((_,i)=>i+1).find(d=>ms.bridge(d)==='ready'),start=queue.length?queue[0]-1:sel;const [x,y]=pend&&!queue.length?(()=>{const m=midOf(pend);return[m[0],m[1]+20]})():stand(Math.max(1,start));putCaller(...stand(root.map.pos));radarFill();drawFog();drawDrift();refresh();cam=clampCam(camAt(x,y-60,lvS(1)),vw,vh);apply();requestAnimationFrame(()=>el&&el.classList.add('in'));addEventListener('resize',onResize);setTimeout(runQueue,reduce()?0:450);setTimeout(renderBmp,60);if(!queue.length&&o.onOpen)setTimeout(()=>el&&o.onOpen(),500)};
 const close=()=>{if(!el)return;cancelAnimationFrame(tw);clearTimeout(mvT);removeEventListener('resize',onResize);
  // незавершённое раскрытие засчитываем, чтобы анимация не повторялась бесконечно
  const n=el;el=null;busy=false;S();for(const d of ms.reveal)if(!queue.includes(d))markSeen(root,d);o.persist();n.classList.remove('in');n.classList.add('out');setTimeout(()=>n.remove(),reduce()?0:220);o.onClose&&o.onClose()};
 return{open,close,isOpen,key,refresh:()=>{if(!el)return;refresh();S();for(const d of ms.reveal)if(!queue.includes(d)&&!busy){queue.push(d)}runQueue()},toggle:()=>el?close():open()}}
