// Кусок 22: вид — Heavy Cassette Futurism (стили в ui/kit/hud5.css), магнит почти убран (≤1px). Ниже — история I9 (кусок 20).
// I9 (кусок 20): «Позвонить» — самая сочная кнопка игры. Покой: дыхание свечения, кольца-волны, блик по кругу,
// трубка вздрагивает, как будто звонит; кнопка чуть тянется к курсору (магнит), блик следует за мышью.
// Нажатие: сжатие → пружина, ударная волна, искры из точки нажатия, вспышка по краю экрана, звук «удар + взлёт».
// Всё выключается при «Эффекты: выкл» и prefers-reduced-motion. DOM кнопки пересоздаётся — работаем через делегирование.
export const PHONE='<svg class="dl-ph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor"/></svg>';
export function makeDialFx({root=document,fx=()=>'full',sfx=()=>{}}){
 const RM=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 const off=()=>RM.matches||fx()==='off';
 const btn=()=>root.querySelector('#b-dial');
 let hoverOn=false;
 // магнит: в радиусе 140 px кнопка смещается к курсору до 6 px, блик (--mx/--my) идёт за мышью
 addEventListener('pointermove',e=>{const b=btn();if(!b||off()||b.classList.contains('on'))return;const r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy),R=Math.max(r.width,r.height)/2+140;
  if(dist<R){const k=(1-dist/R);b.style.setProperty('--tx',Math.max(-1,Math.min(1,dx*.01*k)).toFixed(2)+'px');b.style.setProperty('--ty',Math.max(-1,Math.min(1,dy*.02*k)).toFixed(2)+'px');b.classList.add('near')}else if(b.classList.contains('near')){b.style.setProperty('--tx','0px');b.style.setProperty('--ty','0px');b.classList.remove('near')}
  const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  if(inside){b.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');b.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');if(!hoverOn){hoverOn=true;sfx('dialhover')}}else hoverOn=false},{passive:true});
 addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('#b-dial');if(!b||b.classList.contains('on')||off())return;b.classList.add('press')},true);
 addEventListener('pointerup',()=>{const b=btn();if(b)b.classList.remove('press')},true);
 // взрыв при наборе (клик или Space); x,y — точка в кнопке (по умолчанию центр)
 const burst=(x,y)=>{const b=btn();sfx('dialgo');if(!b||off())return;const r=b.getBoundingClientRect();x=x??r.left+r.width/2;y=y??r.top+r.height/2;
  b.classList.remove('boom');void b.offsetWidth;b.classList.add('boom');setTimeout(()=>b.classList.remove('boom'),700);
  const L=document.createElement('div');L.className='dl-burst';L.style.left=x+'px';L.style.top=y+'px';
  let h='<i class="w"></i><i class="w w2"></i>';for(let i=0;i<18;i++){const a=i/18*Math.PI*2+Math.random()*.3,d=50+Math.random()*80;h+=`<b style="--r:${(a*180/Math.PI+90).toFixed(0)}deg;--x:${(Math.cos(a)*d).toFixed(0)}px;--y:${(Math.sin(a)*d*.7).toFixed(0)}px;--s:${(.6+Math.random()*.9).toFixed(2)};--d:${(380+Math.random()*320)|0}ms"></b>`}
  L.innerHTML=h;document.body.appendChild(L);setTimeout(()=>L.remove(),900);
  const f=document.createElement('div');f.className='dl-flash';document.body.appendChild(f);setTimeout(()=>f.remove(),600)};
 let lastXY=null;addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#b-dial')&&e.detail>0&&(e.clientX||e.clientY))lastXY=[e.clientX,e.clientY]},true);
 return{burst:()=>{const p=lastXY;lastXY=null;burst(p&&p[0],p&&p[1])}}}
