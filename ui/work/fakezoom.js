// ТЕСТОВЫЙ ZOOM (?tester): притворяется Zoom Phone — шлёт ringing/connected/ended/log, как настоящий (вынесено из work.js в куске 26).
import {CONFIG as C} from '../../core/config.js';import {ZO} from '../../dialer/zoom.js';
export function fakeZoom(d,now){const z=d.zoom;Object.defineProperty(z,'enabled',{get:()=>true});z.ready=true;z.gate='ready';z.status='тест';let cur=null,n=0;
  const msg=(type,data)=>z.onMessage(ZO,{type,data},d.view().lead&&d.view().lead.phone);
  const end=()=>{if(!cur)return;const c=cur;cur=null;const iso=new Date().toISOString().slice(0,19)+'Z',dur=Math.max(C.testerCallSec,Math.round((now()-c.t)/1000));
   msg('zp-call-ended-event',{callId:c.id,callee:{phoneNumber:c.n},dateTime:iso,direction:'outbound',result:'ended'});
   setTimeout(()=>msg('zp-call-log-completed-event',{callId:c.id,callee:{number:c.n},result:'Call connected',callResult:'connected',direction:'outbound',duration:dur,startTime:new Date(c.t).toISOString().slice(0,19)+'Z'}),300)};
  z.call=e164=>{end();z.got=false;z.sug=-1;const id='test-'+(++n)+'-'+now();cur={id,n:e164,t:now()};const iso=new Date().toISOString().slice(0,19)+'Z';
   msg('zp-call-ringing-event',{callId:id,callee:{phoneNumber:e164},dateTime:iso,direction:'outbound'});setTimeout(()=>{if(cur&&cur.id===id)msg('zp-call-connected-event',{callId:id,callee:{extensionType:'pstn',phoneNumber:e164},dateTime:iso,direction:'outbound'})},800);return'zoom'};
  z.hangup=()=>{if(!cur)return false;setTimeout(end,150);return true};msg('zp-ready',{});z.changed()}
