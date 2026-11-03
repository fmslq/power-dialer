// «Juice» (раздел 16): trauma-тряска, hit-stop, частицы с пулом, хроматический пульс, SECURED, count-up, trail. Уровни Off/Low/Full.
export const ease={out:t=>1-Math.pow(1-t,3),back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
export class FX{constructor(){this.lvl='full';this.shakeK=1;this.trauma=0;this.P=[];this.pool=[];this.trail=null;this.mouse=[];this.crt=true;this.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const c=this.cv=document.createElement('canvas');c.id='ctg-fx';document.body.appendChild(c);this.g=c.getContext('2d');this.fit();addEventListener('resize',()=>this.fit());
 addEventListener('mousemove',e=>{if(this.trail)this.mouse.push({x:e.clientX,y:e.clientY,t:performance.now()})});requestAnimationFrame(t=>this.loop(t))}
 fit(){this.cv.width=innerWidth;this.cv.height=innerHeight}
 on(min){const r={off:0,low:1,full:2}[this.lvl];return !this.reduce&&r>=min}
 shake(a){if(this.on(1))this.trauma=Math.min(1,this.trauma+a*(this.lvl==='low'?.5:1)*this.shakeK)}
 hitstop(ms){if(!this.on(1))return;document.body.classList.add('ctg-hs');setTimeout(()=>document.body.classList.remove('ctg-hs'),ms)}
 pulse(){if(!this.on(2))return;document.body.classList.add('ctg-ca');setTimeout(()=>document.body.classList.remove('ctg-ca'),200)}
 burst(x,y,n,cols,o={}){if(!this.on(2))return;const g=o.g??900,sp=o.speed??520;for(let i=0;i<n;i++){const p=this.pool.pop()||{},a=Math.random()*Math.PI*2,v=sp*(.3+Math.random()*.7);Object.assign(p,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.5,r:2+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*14,life:0,max:.7+Math.random()*.8,c:cols[i%cols.length],g});this.P.push(p)}}
 stamp(text,cls){if(!this.on(1))return;const card=document.querySelector('.card'),r=card?card.getBoundingClientRect():{left:innerWidth/2-200,top:200,width:400,height:200},e=document.createElement('div');e.className='ctg-stamp '+(cls||'');e.textContent=text;e.style.left=r.left+r.width/2+'px';e.style.top=r.top+r.height/2+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}
 dim(ms){if(!this.on(2))return;document.body.classList.add('ctg-dim');setTimeout(()=>document.body.classList.remove('ctg-dim'),ms)}
 loop(t){const dt=Math.min(.05,(t-(this.t0||t))/1000);this.t0=t;const g=this.g;g.clearRect(0,0,this.cv.width,this.cv.height);
  for(let i=this.P.length-1;i>=0;i--){const p=this.P[i];p.life+=dt;if(p.life>p.max){this.pool.push(this.P.splice(i,1)[0]);continue}p.vy+=p.g*dt;p.vx*=1-1.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;g.globalAlpha=1-p.life/p.max;g.fillStyle=p.c;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillRect(-p.r,-p.r/2,p.r*2,p.r);g.restore()}
  if(this.trail&&this.on(1)){const n=performance.now();this.mouse=this.mouse.filter(m=>n-m.t<420);g.fillStyle=this.trail;this.mouse.forEach(m=>{g.globalAlpha=1-(n-m.t)/420;g.beginPath();g.arc(m.x,m.y,5*(1-(n-m.t)/420)+1,0,7);g.fill()})}
  g.globalAlpha=1;const st=document.getElementById('stage');if(st){if(this.trauma>0){const k=this.trauma*this.trauma*14;st.style.transform=`translate(${(Math.random()*2-1)*k}px,${(Math.random()*2-1)*k}px)`;this.trauma=Math.max(0,this.trauma-dt*1.6)}else if(st.style.transform)st.style.transform=''}
  requestAnimationFrame(t=>this.loop(t))}}
export function countUp(el,to,fmt=n=>Math.round(n).toLocaleString('ru-RU')){const from=el._v??to;el._v=to;if(from===to){el.textContent=fmt(to);return}const t0=performance.now(),d=Math.min(900,200+Math.abs(to-from)*.5);cancelAnimationFrame(el._r);const step=n=>{const k=Math.min(1,(n-t0)/d);el.textContent=fmt(from+(to-from)*ease.out(k));if(k<1)el._r=requestAnimationFrame(step)};el._r=requestAnimationFrame(step)}
