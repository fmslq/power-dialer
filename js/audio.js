// AudioController: всё синтезируется (файлы не нужны), питч растёт с Heat; свои файлы можно подложить через setBuffers.
export class AudioController{
 constructor(bus){this.bus=bus;this.v={sfx:.7,music:.3};this.buf={};this.heat=0;this.ctx=null;this.step=0;
  bus.on('volume',e=>{Object.assign(this.v,e);if(this.mg)this.mg.gain.value=this.v.music*.35});
  bus.on('status',e=>this.status(e))}
 init(){if(this.ctx)return;const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.ctx=new C();this.mg=this.ctx.createGain();this.mg.gain.value=this.v.music*.35;this.mg.connect(this.ctx.destination);this.tick()}
 setBuffers(m){this.buf=m}                       // {name: AudioBuffer} — имя файла = имя звука
 tone(f,d,type='square',g=.2,slide=0){if(!this.ctx||!this.v.sfx)return;const c=this.ctx,o=c.createOscillator(),a=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);a.gain.setValueAtTime(g*this.v.sfx,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a).connect(c.destination);o.start(t);o.stop(t+d)}
 noise(d,g=.25,hp=800){if(!this.ctx||!this.v.sfx)return;const c=this.ctx,n=c.sampleRate*d|0,b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),a=c.createGain();f.type='highpass';f.frequency.value=hp;a.gain.value=g*this.v.sfx;s.buffer=b;s.connect(f).connect(a).connect(c.destination);s.start()}
 play(name,fn){const b=this.buf[name];if(b&&this.ctx&&this.v.sfx){const s=this.ctx.createBufferSource(),a=this.ctx.createGain();a.gain.value=this.v.sfx;s.buffer=b;s.connect(a).connect(this.ctx.destination);s.start();return}fn()}
 classSfx(e){const k=this.heat=e.step||0,p=1+k*.12;           // щелчки выше по Heat
  if(e.cls==='TRASH'||e.cls==='GATEKEEPER')this.play('crumple',()=>{this.noise(.18,.3,e.cls==='TRASH'?900:2500);this.tone(110*p,.12,'sawtooth',.15,.5)});
  else if(e.cls==='BOOKED'||e.cls==='DISCOVERY')this.play('ching',()=>{[660,880,1320,1760].forEach((f,i)=>setTimeout(()=>this.tone(f,.5,'triangle',.22),i*70));this.tone(80,.4,'sine',.4,.5)});
  else this.play('stamp',()=>{this.tone(220*p,.1,'square',.2,.6);this.noise(.05,.2,3000)});
  if(e.pen==='drop'||e.pen==='reset')this.tone(300,.4,'sawtooth',.2,.3);if(e.odStart)this.tone(55,1.2,'sawtooth',.35,2);if(e.captured)[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,.4,'triangle',.25),i*110))}
 status(e){this.init();if(!this.ctx)return;this.heat=e.step||0;const bad=e.pen||e.spam;this.series=bad?0:Math.min(10,(this.series||0)+1);
  if(e.pen){this.tone(660,.35,'sawtooth',.18,.25);return}
  if(this.clickOn&&!e.re){const p=Math.pow(2,this.series/12)*(1+(Math.random()-.5)*.06);this.tone(1100*p,.05,'square',.11,.7);this.tone(85,.12,'sine',.22,.5);this.tone(2600*p,.09,'triangle',.07)}
  if(this.sfxStatus)this.classSfx(e);if(e.odStart)this.tone(55,1.2,'sawtooth',.35,2);if(e.captured)[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,.4,'triangle',.25),i*110))}
 tick(){if(!this.synth&&this.synth!==undefined){setTimeout(()=>this.tick(),400);return}const c=this.ctx,t=c.currentTime,bpm=100+this.heat*18,dt=60/bpm/2;if(!this.nt||this.nt<t)this.nt=t;
  while(this.nt<t+.3){const o=c.createOscillator(),a=c.createGain(),n=[55,55,82,55,73,55,98,82][this.step++%8]*(1+this.heat*.06);o.type=this.heat>1?'sawtooth':'triangle';o.frequency.value=n;a.gain.setValueAtTime(.5,this.nt);a.gain.exponentialRampToValueAtTime(.001,this.nt+dt*.9);o.connect(a).connect(this.mg);o.start(this.nt);o.stop(this.nt+dt);this.nt+=dt}
  setTimeout(()=>this.tick(),120)}}
