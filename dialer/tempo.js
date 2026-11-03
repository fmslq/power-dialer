// «Темп: N зв/час». БАГ СТАРОГО (подтверждён по коду): время считалось через aNow() = Date.now() − время пауз, а окно 10 мин
// пересчитывалось только при новом звонке/перерисовке. На паузе (у тебя «Пауза 32:06») часы темпа стояли, и «84 зв/час 🔥» висело вечно.
// Новое: реальное время, скользящее окно 15 мин, пересчёт по таймеру UI (раз в 5 с). Не звонишь → темп честно падает до 0 и прячется.
export const TEMPO={windowMs:15*60e3,minSpanMs:5*60e3,minCalls:5,hot:45,low:30,idleHideMs:15*60e3};
// times: [метки реального времени звонков за сегодня], first: время первого звонка дня
export function tempo(times,now,first=times[0]){const W=TEMPO.windowMs,rec=times.filter(x=>x>now-W);
 if(times.length<TEMPO.minCalls)return{show:false,rate:0,cls:''};
 const last=times[times.length-1];if(now-last>=TEMPO.idleHideMs)return{show:false,rate:0,cls:'idle',idleMs:now-last};
 const span=Math.min(W,Math.max(now-(first||now),TEMPO.minSpanMs)),rate=Math.round(rec.length/(span/36e5));
 return{show:true,rate,cls:rate>TEMPO.hot?'hot':rate<TEMPO.low?'low':''}}
