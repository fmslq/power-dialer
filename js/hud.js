import {CONFIG as C,STATUS,districtThr} from './config.js';
import {bossState} from './engine.js';
const $=(r,s)=>r.querySelector(s),f=n=>Math.round(n).toLocaleString('ru-RU'),clock=ms=>{const s=Math.max(0,ms/1000|0);return(s/60|0)+':'+String(s%60).padStart(2,'0')};
export function mountHUD(root,bus,onStatus){
 root.innerHTML=`<div class="top"><span><span class="k">$</span><b id="mo">0</b></span><span><span class="k">XP</span><b id="xp">0</b></span><span id="dist"></span><span id="heat"></span><span class="badge">⚡ MULTIPLIER ACTIVE!</span>
 <button id="pause">Пауза [P]</button><label>🔊<input id="sfx" type="range" min="0" max="100" value="70"></label><label>🎵<input id="mus" type="range" min="0" max="100" value="30"></label></div>
 <div class="tabs"><button data-v="meta">Мета</button><button data-v="radar">Радар</button><button data-v="script">Скрипт</button></div>
 <div class="cols" data-view="radar"><div class="col left" data-tab="meta"><b>THE GRID / HEADQUARTERS</b><p style="color:var(--dim)">Вкладки появятся в Фазе 2.</p></div><div class="sp" id="s1"></div>
 <div class="col radarwrap"><div class="radar"><div class="card" id="card"><h2 id="nm">—</h2><div id="cat"></div><div class="ph" id="ph"></div></div><div class="boss"><i id="bar"></i></div>
 <div class="st" id="st"></div><div class="timer"><span id="tm">0:00</span><span class="z" id="zone"></span></div><div class="fx" id="fx"></div></div></div><div class="sp" id="s2"></div><div class="col right" data-tab="script"><b>ПРОТОКОЛ</b><div id="scr" style="height:100%"></div></div></div>`;
 const st=$(root,'#st');STATUS.slice(0,6).forEach(s=>{const b=document.createElement('button');b.dataset.id=s.id;b.className=C.classes[s.cls].win?'win':'';b.innerHTML=`<kbd>${s.key}</kbd>${s.name}`;b.onclick=()=>onStatus(s.id);st.appendChild(b)});
 const cols=$(root,'.cols');root.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>cols.dataset.view=b.dataset.v);
 const drag=(id,v,inv)=>{const h=$(root,id);h.onpointerdown=e=>{h.setPointerCapture(e.pointerId);h.onpointermove=m=>{const w=cols.getBoundingClientRect(),p=(inv?w.right-m.clientX:m.clientX-w.left)/w.width*100;document.documentElement.style.setProperty(v,Math.min(45,Math.max(12,p))+'%')};h.onpointerup=()=>h.onpointermove=null}};drag('#s1','--lw');drag('#s2','--rw',1);
 $(root,'#sfx').oninput=e=>bus.emit('volume',{sfx:e.target.value/100});$(root,'#mus').oninput=e=>bus.emit('volume',{music:e.target.value/100});
 $(root,'#pause').onclick=()=>bus.emit('pause');
 const float=(t,c)=>{const e=document.createElement('span');e.textContent=t;e.className=c;e.style.marginLeft=(Math.random()*80-40)+'px';$(root,'#fx').appendChild(e);setTimeout(()=>e.remove(),1150)};
 bus.on('status',e=>{const cd=$(root,'#card'),k=['TRASH','GATEKEEPER'].includes(e.cls)?'out-trash':['BOOKED','DISCOVERY'].includes(e.cls)?'out-win':'out-talk';cd.classList.remove('out-trash','out-win','out-talk');void cd.offsetWidth;cd.classList.add(k);setTimeout(()=>cd.classList.remove(k),600);if(e.spam)float('спам x0.5','bad');float('+'+e.x+' XP','xp');float('+$'+e.m,'mo');if(e.pen==='drop')float('HEAT ▼','bad');if(e.pen==='reset')float('СЕРИЯ СГОРЕЛА','bad');if(e.odStart)float('OVERDRIVE','bad');if(e.captured)float('РАЙОН ЗАХВАЧЕН','mo')});
 return{render(s,now,lead,sug){const d=C.districts[s.district-1],thr=districtThr(s.district),m=C.heat.money[s.step],od=s.od&&now<s.od.until;
  root.dataset.heat=od?3:s.ulta>0?3:s.step;root.dataset.od=od?1:0;root.dataset.boss=bossState(s);
  $(root,'#mo').textContent=f(s.money);$(root,'#xp').textContent=f(s.lifeXp);$(root,'#dist').textContent=`${d[1]} ${Math.min(100,s.dxp/thr*100|0)}%`;
  $(root,'#heat').textContent=od?`OVERDRIVE ${clock(s.od.until-now)}`:`$ x${(s.ulta>0?2:m).toFixed(2)} · XP x${(1+((s.ulta>0?2:m)-1)*C.heat.xpShare).toFixed(2)}${s.ulta>0?' · ULTA '+s.ulta:''}`;
  $(root,'#bar').style.width=Math.min(100,s.dxp/thr*100)+'%';
  if(lead){$(root,'#nm').textContent=lead.name;$(root,'#cat').textContent=lead.cat||'';$(root,'#ph').textContent=lead.phone}
  const el=s.last==null?0:(s.paused!=null?s.paused:now)-s.last;$(root,'#tm').textContent=clock(el);
  $(root,'#zone').textContent=el<C.fastSec*1000?'SPRINT ZONE':el<C.maxGapMin*60000?'TALK ZONE':'СЕРИЯ СГОРАЕТ';
  root.querySelectorAll('.st button').forEach(b=>b.classList.toggle('sug',+b.dataset.id===sug))},float}}
