// HangupGuard: кнопка «Отбой» и авто-отбой при установке статуса. Без DOM, транспорт и часы внедряются.
// Главный риск (из ТЗ пользователя): команда отбоя приходит в Zoom С ЗАДЕРЖКОЙ, и если к этому моменту уже набран СЛЕДУЮЩИЙ номер,
// отключится новый звонок, а не старый. Защиты:
//  1) отбой адресный: привязан к callId звонка, у которого есть статус; перед отправкой проверяется, что он всё ещё активный текущий;
//  2) следующий набор НЕ уходит, пока не подтверждён конец прошлого звонка (событие ended) или не вышел таймаут (по умолчанию 2,5 с);
//  3) если во время ожидания появился другой активный звонок (id другой), старый отбой отменяется как устаревший;
//  4) один отбой на один callId (повторные нажатия игнорируются), антидребезг 400 мс;
//  5) нет активного звонка (уже завершён, не набирали) = ничего не отправляем.
export class HangupGuard{
 constructor({activeCall,sendHangup,sendDial,now=Date.now,timeoutMs=2500,debounceMs=400}){
  Object.assign(this,{activeCall,sendHangup,sendDial,now,timeoutMs,debounceMs});this.pending=null;this.sent=new Set();this.queue=null;this.lastReq=-1e9;this.log=[]}
 note(t,d){this.log.push({t:this.now(),e:t,...d});if(this.log.length>100)this.log.shift()}
 // источник: 'button' | 'status'. Возвращает 'sent' | 'none' | 'dup' | 'debounced'
 request(src='button'){const t=this.now();if(src==='button'){if(t-this.lastReq<this.debounceMs){this.note('debounced',{src});return'debounced'}this.lastReq=t}
  const c=this.activeCall();if(!c||c.ended!=null){this.note('none',{src});return'none'}
  if(this.sent.has(c.id)){this.note('dup',{src,id:c.id});return'dup'}
  this.sent.add(c.id);this.pending={id:c.id,at:t,src};this.sendHangup(c.id);this.note('sent',{src,id:c.id});return'sent'}
 // набор следующего номера: откладывается, пока идёт отбой
 dial(number){if(!this.pending){this.sendDial(number);this.note('dial',{number});return'now'}
  this.queue={number,at:this.now()};this.note('dialQueued',{number});return'queued'}
 onEnded(callId){if(this.pending&&this.pending.id===callId){this.pending=null;this.note('ended',{id:callId});this.flush()}}
 tick(){const t=this.now();if(this.pending){const c=this.activeCall();
   if(c&&c.id!==this.pending.id&&c.ended==null){this.note('stale',{old:this.pending.id,now:c.id});this.pending=null;this.flush()}   // старый отбой устарел: уже идёт другой звонок
   else if(t-this.pending.at>=this.timeoutMs){this.note('timeout',{id:this.pending.id});this.pending=null;this.flush()}}}
 flush(){if(this.queue&&!this.pending){const q=this.queue;this.queue=null;this.sendDial(q.number);this.note('dial',{number:q.number,afterHangup:1})}}
 get busy(){return !!this.pending}}
