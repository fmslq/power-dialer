// Статусы дайлера: ТОЧНО как в старом дайлере (кнопки, цвета, клавиши, значения в таблицу). Ничего не переименовано.
// Игровые «классы» (TRASH/TALK/...) живут только внутри движка (core/config.js) и нигде не показываются игроку.
export const BUTTONS=[["Автоответчик: Были гудки","#d9a07a"],["Автоответчик: Не перезванивать","#e5603b"],["Owner hung up в начале","#f76808"],
 ["Owner pitched & Hang Up","#f5a524"],["CALL BOOKED","#30a46c"],["GATEKEEPER","#e5484d"],["Другое","#e8d44d"],["Автоответчик (leaved vm)","#e5826e"],
 ["Menu (=not owner mobile number)","#e6c84c"],["Не соединяет","#3a7a96"],["Номер не рабочий","#9a5b2e"],["Непонятная хуйня","#7d8492"],
 ["Call back","#a58be0"],["Follow up in future","#7c5cd6"],["CONDUCTED DISCOVERY CALL","#1f9d62"]].map(([name,color],i)=>({i,name,color,key:"1234567890QWERT"[i]}));
export const PRIM=6,WIN=[4,14];        // первые 6 на главном экране (1–6), остальное в «Ещё статусы» (M); 4 и 14 = победы
// Выпадающий список колонки Result в таблице пользователя (порядок как в таблице)
export const SHEET_VALUES=["GATEKEEPER НЕ ПРОПУСТИЛ","DM Pitched & Hung up","OWNER HUNG UP/NOT INTERESTED","Автоответчик (leaved vm)","Автоответчик/Нет ответа",
 "Автоответчик (сразу перенаправляет) или просто не перезванивать","Menu (=not owner mobile number)","Не соединяет","Номер не рабочий","Непонятная хуйня",
 "Call back","CALL BOOKED","Follow up in future","Not called","Другое","CONDUCTED DISCOVERY CALL"];
// Название кнопки → значение в таблицу (по умолчанию). Пользователь может переопределить в Настройках (P.map, ключ pd2 как раньше).
export const SHEET={"Автоответчик: Были гудки":"Автоответчик/Нет ответа","Автоответчик: Не перезванивать":"Автоответчик (сразу перенаправляет) или просто не перезванивать",
 "Owner hung up в начале":"OWNER HUNG UP/NOT INTERESTED","Owner pitched & Hang Up":"DM Pitched & Hung up","GATEKEEPER":"GATEKEEPER НЕ ПРОПУСТИЛ"};
export const sheetValue=(i,map)=>(map&&map[BUTTONS[i].name])||SHEET[BUTTONS[i].name]||BUTTONS[i].name;
// значение из таблицы → индекс кнопки (как sidx в старом коде: сначала по значению, затем по названию/префиксу)
export function statusIndex(v,map){v=String(v||'');if(!v)return -1;let i=BUTTONS.findIndex(b=>sheetValue(b.i,map)===v);
 if(i<0)i=BUTTONS.findIndex(b=>b.name===v||v.startsWith(b.name));return i}
export const statusColor=(v,map)=>{const i=statusIndex(v,map);return i<0?'#8b93a4':BUTTONS[i].color};
// «Not called» и невидимые символы (в таблице встречается «⠀», U+2800) = пусто
export const cleanResult=v=>{const s=String(v||'').replace(/[\s\u2800\u200b\u00a0]+/g,' ').trim();return s.toLowerCase()==='not called'?'':s};
