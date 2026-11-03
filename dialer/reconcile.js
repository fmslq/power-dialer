// Сопоставление строк таблицы с лидами дайлера (чистая логика, без DOM).
// ПРИЧИНА тоста «Таблица: +158 новых, −0 убрано» (подтверждено в R0): старый алгоритм сопоставлял лидов ТОЛЬКО по последним
// 10 цифрам телефона. Строка без валидного телефона (пустая, «N/A», 7 цифр) никогда не находила пару, и КАЖДЫЙ автоопрос
// таблицы (раз в 45 с) считал такие строки «новыми», пересоздавал их (теряя статус s и заметки) и показывал тост.
// Исправление: запасной ключ (номер строки + Business + Adress), счёт «реально новых», тост только при реальных изменениях.
export const phoneKey=p=>String(p||'').replace(/\D/g,'').slice(-10);
export const hasKey=k=>k.length===10;
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
export const softKey=(biz,addr)=>norm(biz)+'|'+norm(addr);
export const isBlankRow=(biz,addr,key)=>!key&&!norm(biz)&&!norm(addr);

// old: [{key,r,biz,addr}] (лиды дайлера), rows: [{key,r,biz,addr}] (строки таблицы, в порядке таблицы)
// → {match:[oldIdx|-1 на каждую строку], removed:[oldIdx], added, addedReal, droppedKeyless}
export function matchRows(old,rows){
 const used=new Set(),byKey=new Map(),bySoft=new Map(),push=(m,k,i)=>{if(!m.has(k))m.set(k,[]);m.get(k).push(i)};
 old.forEach((l,i)=>{if(hasKey(l.key))push(byKey,l.key,i);else push(bySoft,softKey(l.biz,l.addr),i)});
 const match=rows.map(x=>{let m=-1;
  if(hasKey(x.key)){const c=(byKey.get(x.key)||[]).filter(i=>!used.has(i));
   m=c.find(i=>old[i].r===x.r);if(m==null)m=c.find(i=>norm(old[i].biz)===norm(x.biz));if(m==null)m=c.length?c[0]:-1}   // как в старом алгоритме
  else{const c=(bySoft.get(softKey(x.biz,x.addr))||[]).filter(i=>!used.has(i));
   m=c.find(i=>old[i].r===x.r);if(m==null)m=c.length&&(c.length===1||isBlankRow(x.biz,x.addr,x.key))?c[0]:-1}
  if(m!=null&&m>=0)used.add(m);else m=-1;return m});
 const removed=old.map((l,i)=>i).filter(i=>hasKey(old[i].key)&&!used.has(i));
 const droppedKeyless=old.filter((l,i)=>!hasKey(l.key)&&!used.has(i)).length;
 let added=0,addedReal=0;rows.forEach((x,i)=>{if(match[i]<0){added++;if(!isBlankRow(x.biz,x.addr,x.key))addedReal++}});
 return{match,removed,added,addedReal,droppedKeyless}}
// Тост показывается ТОЛЬКО если реально изменился состав таблицы (добавлены/убраны настоящие лиды).
export const shouldToast=p=>p.addedReal>0||p.removed.length>0;
export const toastText=p=>'Таблица: +'+p.addedReal+' новых, −'+p.removed.length+' убрано';
// Верная копия СТАРОГО алгоритма: используется в тестах-регрессии, чтобы воспроизвести баг.
export function legacyMatch(old,rows){const used=new Set(),oldBy={};old.forEach((l,i)=>{if(hasKey(l.key))(oldBy[l.key]=oldBy[l.key]||[]).push(i)});
 let add=0;rows.forEach(x=>{let m=null;if(hasKey(x.key)&&oldBy[x.key]){m=oldBy[x.key].find(i=>!used.has(i)&&old[i].r===x.r);if(m==null)m=oldBy[x.key].find(i=>!used.has(i)&&norm(old[i].biz)===norm(x.biz));if(m==null)m=oldBy[x.key].find(i=>!used.has(i));if(m!=null)used.add(m)}if(m==null)add++});
 return{add,removed:old.filter((l,i)=>hasKey(l.key)&&!used.has(i)).length}}
