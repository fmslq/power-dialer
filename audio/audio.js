// AudioController: звуки синтезируются (файлов не нужно), питч растёт с Heat; свои файлы подкладываются через setBuffers.
// ИСПРАВЛЕНО (rework §14): (1) синтез-музыка («басовый цикл») по умолчанию ВЫКЛЮЧЕНА, а включённый «синтез-эмбиент» —
// тихий мягкий пад без баса и ритма; (2) два независимых переключателя: soundStatus (звуки статусов: щелчок, смятие, штамп, касса)
// и soundUi (звуки интерфейса), оба включены по умолчанию (раньше sfxStatus=false глушил классовые звуки насовсем).
export class AudioController{
 constructor(bus){this.bus=bus;this.v={sfx:.7,music:.3};this.buf={};this.heat=0;this.ctx=null;this.series=0;
  this.flags={soundStatus:true,soundUi:true,synthAmbient:false,hum:true};this.clickOn=true;this.amb=null;
  bus&&bus.on('volume',e=>{Object.assign(this.v,e);this.applyAmbient()});
  bus&&bus.on('status',e=>this.status(e))}
 init(){if(this.ctx)return this.ctx;const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;this.ctx=new C();this.applyAmbient();return this.ctx}
 setFlags(f){Object.assign(this.flags,f);this.applyAmbient()}
 setBuffers(m){this.buf=m}                          // {name: AudioBuffer}: имя файла = имя звука
 gate(cat){return !!this.ctx&&this.v.sfx>0&&(cat==='ui'?this.flags.soundUi:this.flags.soundStatus)}
 tone(f,d,type='square',g=.2,slide=0,cat='status'){if(!this.gate(cat))return;const c=this.ctx,o=c.createOscillator(),a=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);a.gain.setValueAtTime(g*this.v.sfx,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a).connect(c.destination);o.start(t);o.stop(t+d)}
 noise(d,g=.25,hp=800,cat='status'){if(!this.gate(cat))return;const c=this.ctx,n=c.sampleRate*d|0,b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),a=c.createGain();f.type='highpass';f.frequency.value=hp;a.gain.value=g*this.v.sfx;s.buffer=b;s.connect(f).connect(a).connect(c.destination);s.start()}
 play(name,fn,cat='status'){const b=this.buf[name];if(b&&this.gate(cat)){const s=this.ctx.createBufferSource(),a=this.ctx.createGain();a.gain.value=this.v.sfx;s.buffer=b;s.connect(a).connect(this.ctx.destination);s.start();return}fn()}
 classSfx(e){const k=this.heat=e.step||0,p=1+k*.12;
  if(e.cls==='TRASH'||e.cls==='GATEKEEPER')this.play('crumple',()=>{this.noise(.18,.3,e.cls==='TRASH'?900:2500);this.tone(110*p,.12,'sawtooth',.15,.5)});
  else if(e.cls==='BOOKED'||e.cls==='DISCOVERY')this.play('ching',()=>{[660,880,1320,1760].forEach((f,i)=>setTimeout(()=>this.tone(f,.5,'triangle',.22),i*70));this.tone(80,.4,'sine',.4,.5)});
  else this.play('stamp',()=>{this.tone(220*p,.1,'square',.2,.6);this.noise(.05,.2,3000)});
  if(e.pen==='drop'||e.pen==='reset')this.tone(300,.4,'sawtooth',.2,.3);if(e.odStart)this.tone(55,1.2,'sawtooth',.35,2);
  if(e.captured)[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,.4,'triangle',.25),i*110))}
 status(e){if(!this.ctx)return;this.heat=e.step||0;const bad=e.pen||e.spam;this.series=bad?0:Math.min(10,(this.series||0)+1);
  if(e.pen){this.tone(660,.35,'sawtooth',.18,.25);return}
  if(this.clickOn&&!e.re){const p=Math.pow(2,this.series/12)*(1+(Math.random()-.5)*.06);this.tone(1100*p,.05,'square',.11,.7);this.tone(85,.12,'sine',.22,.5);this.tone(2600*p,.09,'triangle',.07)}
  this.classSfx(e)}
 // Тихий гул города (коричневый шум через фильтр). Включается флагом hum; громкость идёт за ползунком «Музыка» (0 — гул молчит).
 humGain(){const v=this.v.music??.3;return v<=.02?0:Math.min(.12,.18*Math.pow(v,1.5))} // кривая по громкости: 0–2% = полная тишина, дальше плавно (раньше на самом низу было ещё слышно)
 setMusic(v){this.v.music=v;this.applyAmbient();const c=this.ctx;if(!c)return;if(v<=0){this.hum(false);return}
  if(this.humN)this.humN.g.gain.setTargetAtTime(this.humGain(),c.currentTime,.25);else if(this.flags.hum)this.hum(true)}
 hum(on){const c=this.ctx;if(!c)return;if(!on||!this.flags.hum){if(this.humN){const t=c.currentTime;this.humN.g.gain.setTargetAtTime(0,t,.4);const n=this.humN;setTimeout(()=>{try{n.s.stop()}catch(e){}},1800);this.humN=null}return}
  if(this.humN||this.humGain()<=0)return;const n=c.sampleRate*4|0,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;d[i]=l*3.5}
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;s.loop=true;f.type='lowpass';f.frequency.value=260;g.gain.value=0;s.connect(f).connect(g).connect(c.destination);s.start();g.gain.setTargetAtTime(this.humGain(),c.currentTime,1.2);this.humN={s,g}}
 // Необязательный «синтез-эмбиент»: тихий мягкий пад (два чистых синуса + медленный LFO). Ни баса, ни ритма. Включается в Настройках → Музыка.
 applyAmbient(){const on=!!(this.ctx&&this.flags.synthAmbient&&this.v.music>0);
  if(!on){if(this.amb){const{g,os,lfo}=this.amb,t=this.ctx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.3);setTimeout(()=>{os.forEach(o=>{try{o.stop()}catch(e){}});try{lfo.stop()}catch(e){}},1500);this.amb=null}return}
  const c=this.ctx;if(!this.amb){const g=c.createGain(),lp=c.createBiquadFilter(),lfo=c.createOscillator(),lg=c.createGain(),os=[220,329.63,440.5].map((f,i)=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.detune.value=i*3;o.connect(lp);o.start();return o});
   lp.type='lowpass';lp.frequency.value=900;lp.connect(g);g.gain.value=0;g.connect(c.destination);lfo.frequency.value=.07;lg.gain.value=.012;lfo.connect(lg).connect(g.gain);lfo.start();this.amb={g,os,lfo}}
  this.amb.g.gain.setTargetAtTime(this.v.music*.05,c.currentTime,.8)}}
