// Мост к Zoom Phone Smart Embed (iframe) без DOM: команды postMessage, приём событий → core ZoomProvider, журнал, подсказка статуса.
// ИСПРАВЛЕН БАГ СТАРОГО: в меню «Встроенный телефон: вкл» показывал флаг «Zoom подключён», а видимость окна жила в другом флаге (zoomOk),
// который ставился сам на первом звонке и кнопкой «Спрятать». Отсюда «вкл», хотя окна не видно, и двойное нажатие.
// Теперь два независимых понятия: enabled (телефон встроен и работает, по умолчанию вкл) и shown (окно видно, по умолчанию ВЫКЛ,
// переключатель в Настройках = единственный источник правды; кнопка «Спрятать» на окне меняет тот же флаг). Временный показ (peek)
// бывает только когда Zoom не подтвердил звонок за 6 с, и переключатель тогда честно показывает «показано временно».
export const ZO="https://applications.zoom.us";
export const ZOOM_SRC=ZO+"/integration/phone/embeddablephone/home";
export const INIT_CONFIG={type:"zp-init-config",data:{enableSavingLog:false,enableAutoLog:false,enableContactSearching:false,enableContactMatching:false,enableAISummary:false,disableInactiveTabCallEvent:true}};
// Команда отбоя НЕ подтверждена документацией Smart Embed (в старом коде есть только init-config и make-call).
// Кандидаты проверяются в Debug → «Тест отбоя» (R5). Пока список пуст, отбой честно сообщает «не поддерживается».
export const HANGUP_CANDIDATES=[];
export function suggestFromLog(d,curPhone){const r=String(d&&d.result||""),n=String(d&&d.callee&&(d.callee.number||d.callee.phoneNumber)||"").replace(/\D/g,"").slice(-10);
 if(!curPhone||!n||String(curPhone).replace(/\D/g,"").slice(-10)!==n)return -1;
 return /voicemail|no answer/i.test(r)?0:/wrong number/i.test(r)?10:/blocked|international|internal error|restricted/i.test(r)?9:-1}
export class ZoomBridge{
 // o: {provider (core ZoomProvider), send(msg) → postMessage в iframe, prefs:()=>P, savePrefs, emit, https:bool, setTimeout, clearTimeout}
 constructor(o){Object.assign(this,o);this.gate='off';this.GT=0;this.ready=false;this.got=false;this.T=0;this.log=[];this.peek=null;this.status='';this.sug=-1}
 get enabled(){const P=this.prefs();return P.zoomEmbed!==false&&this.https}
 get shown(){return !!this.prefs().zoomWindow||!!this.peek}
 view(){return{enabled:this.enabled,shown:this.shown,pinned:!!this.prefs().zoomWindow,peek:this.peek,ready:this.ready,status:this.status,src:ZOOM_SRC}}
 changed(){this.emit('zoomStateChanged',this.view())}
 setEnabled(v){const P=this.prefs();P.zoomEmbed=!!v;this.savePrefs();if(v&&!this.https)this.emit('toast',"Встроенный Zoom работает только на странице https://… (GitHub), не из файла");this.changed()}
 setShown(v){const P=this.prefs();P.zoomWindow=!!v;this.peek=null;this.savePrefs();this.changed()}   // переключатель в Настройках И кнопка «Спрятать»
 onFrameLoad(){this.setTimeout(()=>this.config(),600)}
 config(){try{this.send(INIT_CONFIG)}catch(e){}}
 onApiReady(){this.ready=true;this.config();this.status="готов";this._gateOk();this.changed()}
 // Проверка перед сменой (решение пользователя): дайлер не стартует, пока встроенный Zoom не подключился.
 // gate: off (встроенный выключен/не https) | connecting | ready | failed | app (игрок сам выбрал «продолжить через приложение»)
 startGate(ms=15000){if(!this.enabled){this.gate='off';this.emit('zoomGate',{state:'off'});return this.gate}
  if(this.ready){this.gate='ready';this.emit('zoomGate',{state:'ready'});return this.gate}
  this.gate='connecting';this.emit('zoomGate',{state:'connecting'});this.clearTimeout(this.GT);
  this.GT=this.setTimeout(()=>{if(!this.ready){this.gate='failed';this.emit('zoomGate',{state:'failed'})}},ms);return this.gate}
 _gateOk(){if(this.gate==='connecting'||this.gate==='failed'||this.gate==='app'){this.clearTimeout(this.GT);this.gate='ready';this.emit('zoomGate',{state:'ready'})}}
 bypass(){this.gate='app';this.emit('zoomGate',{state:'app'})}          // только на эту сессию страницы, не сохраняется
 get live(){return this.enabled&&this.ready}                             // есть ли живые события Zoom (проверки по Zoom работают)
 onMessage(origin,d,curPhone){if(origin!==ZO||!d||!d.type)return;const was=this.ready;this.ready=true;if(!was)this._gateOk();
  this.log.push({t:new Date().toISOString(),type:d.type,data:d.data});if(this.log.length>200)this.log.shift();
  this.provider&&this.provider.feed(d);
  if(d.type=="zp-call-ringing-event"){this.got=true;this.status="гудки…";if(this.peek&&this.peek.reason=='unconfirmed')this.peek=null}
  else if(d.type=="zp-call-connected-event"){this.got=true;this.status="на связи"}
  else if(d.type=="zp-call-ended-event"){this.status="завершён: "+((d.data&&d.data.result)||"");this.emit('zoomEnded',{})}
  else if(d.type=="zp-call-log-completed-event"&&d.data){const s=suggestFromLog(d.data,curPhone);if(s>=0){this.sug=s;this.emit('suggest',{index:s})}}
  this.changed()}
 // → 'zoom' (номер ушёл во встроенный Zoom) | 'app' (запасной путь: ссылка zoomphonecall://)
 call(e164){this.got=false;this.sug=-1;
  if(this.enabled&&this.ready){try{this.send({type:"zp-make-call",data:{number:e164,autoDial:true}});
    this.clearTimeout(this.T);this.T=this.setTimeout(()=>{if(!this.got){this.peek={reason:'unconfirmed'};this.changed();this.emit('toast',"Zoom не подтвердил звонок. Проверь окно Zoom Phone: вход, микрофон")}},6000);return'zoom'}
   catch(e){this.emit('toast',"Не удалось отправить номер в Zoom")}}
  // Встроенный включён, но не готов: БОЛЬШЕ НЕ звоним молча через приложение (из-за этого браузер не видел звонков).
  if(this.enabled&&this.gate!=='app'){this.gate='failed';this.emit('zoomGate',{state:'failed',onDial:true});return'blocked'}
  this.emit('zoomViaApp',{reason:this.enabled?'bypass':'off'});            // UI: жёлтая плашка «проверки по Zoom выключены»
  this.emit('openUrl',{url:"zoomphonecall://"+e164,holdUnloadMs:3000});return'app'}
 hangup(callId){if(!HANGUP_CANDIDATES.length)return false;HANGUP_CANDIDATES.forEach(m=>{try{this.send({...m,data:{...(m.data||{}),callId}})}catch(e){}});return true}
 logText(){return JSON.stringify(this.log,null,1)}
}
