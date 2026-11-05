const money=v=>"$"+Math.round(v||0).toLocaleString("ru");function shiftEndHtml(r,AX){return`<div class="wk-wh"><h3>ИТОГ СМЕНЫ</h3><button class="wk-x" id="e-x"><svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div><div class="wk-wb">
   <div class="wk-kv" style="font-size:15px">Звонков: <b>${r.calls}</b> · владелец на линии: <b>${r.talks}</b> (${r.talkShare}%) · встреч: <b>${r.booked}</b> · discovery: <b>${r.disc}</b><br>Лучшая серия: <b>${r.bestStreak}</b> · Overdrive: <b>${r.od}</b> · время: <b>${r.minutes} мин</b><br>
   За день: <b>${r.xp} XP</b> · <b>${money(r.money)}</b>${r.paid?` · выплата за смену <b>+${money(r.paid)}</b>`:""}${r.lp?` · очки наследия <b>+${r.lp}</b>`:""}${r.again?"<br>Смена сегодня уже закрыта: это повторный итог.":""}
   ${r.yesterday?`<br>Вчера: ${r.yesterday.n} звонков`:""}${r.avg7?` · среднее 7 дней: ${r.avg7.n}`:""}</div>
   ${AX.summary()}
   <p class="wk-kv" style="margin-top:12px">Есть история звонков Zoom? Загрузи её в Настройках → Zoom (можно в любой момент).</p><div class="wk-btns" style="margin-top:12px"><button class="wk-btn pri" id="e-ok">Продолжить работу</button></div></div>`}export{shiftEndHtml};
