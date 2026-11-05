import {CONFIG as C} from './config.js';
export const e164=p=>{const d=String(p||'').replace(/\D/g,'');return d.length===10?'+1'+d:d.length===11&&d[0]==='1'?'+'+d:d.length>=8?'+'+d:''};
// ZoomProvider: нормализует сырые события, идемпотентен по callId+type, не падает на неизвестном, не блокирует игру.
export class ZoomProvider{
 constructor(bus,now=Date.now){this.bus=bus;this.now=now;this.calls=new Map();this.raw=[];this.ready=false;this.seq=0}
 get(id){let c=this.calls.get(id);if(!c){c={id,seen:new Set(),ringing:null,ended:null,logged:null,dur:null,result:null,number:'',bound:null,pend:false};this.calls.set(id,c)}return c}
 feed(m){try{this.raw.push(m);if(this.raw.length>200)this.raw.shift();this.handle(m)}catch(e){this.raw.push({err:String(e&&e.message||e)})}}
 handle(m){if(!m||!m.type||!String(m.type).startsWith('zp-'))return;const d=m.data||{},k=m.type,t=Date.parse(d.dateTime||d.startTime)||this.now();
  if(k==='zp-ready'){this.ready=true;this.bus.emit('zoomStatus',{ready:true});return}
  if(!k.startsWith('zp-call-'))return;if(d.direction&&d.direction!=='outbound'&&!C.countInbound)return;
  const num=e164(d.callee&&(d.callee.phoneNumber||d.callee.number)),res=String(d.result||d.callResult||'');let id=d.callId||d.id;
  if(!id){ // реальные события Zoom без callId: ringing открывает звонок, остальные цепляются к последнему открытому
   if(k==='zp-call-ringing-event'){const last=[...this.calls.values()].pop();if(last&&last.number===num&&t-last.ringing<1500)return;id='z'+(++this.seq)}
   else{let b=null;for(const c of this.calls.values())if((!num||!c.number||c.number.slice(-10)===num.slice(-10))&&c.logged==null&&c.ringing!=null)b=c;id=b?b.id:'z'+(++this.seq)}}
  const c=this.get(id);if(c.seen.has(k))return;c.seen.add(k);
  if(k==='zp-call-ringing-event'){c.ringing=t;c.number=num;this.bus.emit('callRinging',{callId:id,number:c.number,at:t});if(c.pend){c.pend=false;this.bus.emit('callEnded',{callId:id,at:c.ended})}}
  else if(k==='zp-call-connected-event'){c.connected=t;this.bus.emit('callConnected',{callId:id,at:t})}
  else if(k==='zp-call-ended-event'){c.ended=t;if(num&&!c.number)c.number=num;if(c.ringing==null)c.pend=true;else this.bus.emit('callEnded',{callId:id,at:t})}
  else if(k==='zp-call-log-completed-event'){c.logged=this.now();c.result=res||null;
   c.dur=d.duration!=null?Number(d.duration):c.connected!=null&&c.ended!=null?Math.max(0,Math.round((c.ended-c.connected)/1000)):/connected|answered|completed/i.test(res)?null:0;
   this.bus.emit('callLogged',{callId:id,duration:c.dur,callResult:c.result,lagMs:c.ended!=null?c.logged-c.ended:null})}}
 takeCall(now){let b=null;for(const c of this.calls.values())if(c.ringing!=null&&c.bound==null&&c.ringing<=now+1000&&(!b||c.ringing>b.ringing))b=c;return b}
 bind(id,st){const c=this.calls.get(id);if(c)c.bound=st}
 // Монитор здоровья: доля полных звонков и задержка ended→logged
 health(){const H=C.health,old=[...this.calls.values()].filter(c=>c.ringing!=null&&this.now()-c.ringing>15000);
  const full=old.filter(c=>c.ended!=null&&c.logged!=null),lags=full.map(c=>c.logged-c.ended),n=old.length,share=n?full.length/n:1,avg=lags.length?lags.reduce((a,b)=>a+b,0)/lags.length:0;
  const red=n>=H.minCalls&&share<H.fullRed,yellow=!red&&n>=H.minCalls&&(share<H.fullYellow||avg>H.lagYellowMs);
  return{state:red?'red':yellow?'yellow':'green',n,share,avgLagMs:avg,maxLagMs:lags.length?Math.max(...lags):0}}}
// ManualProvider: «Позвонить» = callRinging, ended/log нет; статус закрывает звонок.
export class ManualProvider{constructor(bus,now=Date.now){this.bus=bus;this.now=now;this.calls=[]}
 ring(number){const c={id:'m'+this.now(),manual:true,ringing:this.now(),number:e164(number),bound:null,dur:null};this.calls.push(c);this.bus.emit('callRinging',{callId:c.id,number:c.number,at:c.ringing});return c}
 takeCall(now){const c=this.calls[this.calls.length-1];return c&&c.bound==null&&c.ringing<=now+1000?c:null}
 bind(id,st){const c=this.calls.find(x=>x.id===id);if(c)c.bound=st}
 health(){return{state:'green',n:0,share:1,avgLagMs:0,maxLagMs:0}}}
