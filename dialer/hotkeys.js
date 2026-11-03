import {STATUS} from '../core/config.js';
// Чистая функция: клавиша+контекст → действие. Старые клавиши дайлера НЕ меняются (эталон: keydown старого index.html):
// Space и Enter = Позвонить; 1–9,0,Q,W,E,R,T статусы; M меню; S отложить; Z прошлый; X убрать статус; P пауза;
// / и ⌘K выбор лида; N заметки; T шпаргалка (вне меню «Ещё статусы»); Esc закрыть.
// Новое: H = Отбой (красная кнопка). С Shift/Alt, ничего старого не занимает): Shift+Enter подтвердить подсказку статуса по Zoom,
// Shift+G карта, Shift+H база, Shift+M мьют музыки, Shift+N следующий трек, ` Debug.
// c: {typing, menu, suggest, world (открыт мировой экран), modal, shift, meta, alt, ctrl}
const KEY=Object.fromEntries(STATUS.map(s=>[s.key,s.id])),ch=c=>c.startsWith('Digit')?c.slice(5):c.startsWith('Key')?c.slice(3):'';
export function resolveKey(c,code){
 if(c.typing)return code==='Escape'?{a:'blur'}:null;
 if(code==='KeyK'&&(c.meta||c.ctrl))return{a:'picker'};
 if(c.meta||c.ctrl||c.alt)return null;
 if(code==='Backquote')return{a:'debug'};
 if(code==='Escape')return{a:'close'};
 if(c.shift){
  if(code==='Enter')return c.suggest!=null&&c.suggest>=0&&!c.world?{a:'status',id:c.suggest}:null;
  return{KeyG:{a:'map'},KeyH:{a:'base'},KeyM:{a:'muteMusic'},KeyN:{a:'nextTrack'}}[code]||null}
 if(c.world||c.modal)return null;            // в мировых экранах и окнах статусные клавиши не перехватываются
 if(code==='Space'||code==='Enter')return{a:'dial'};
 if(code==='Slash')return{a:'picker'};
 const k=ch(code);if(code==='KeyT')return c.menu?{a:'status',id:KEY.T}:{a:'pad'};
 const m={S:'skip',Z:'back',X:'clear',P:'pause',N:'notes',M:'menu',H:'hangup'};if(m[k])return{a:m[k]};
 if(k in KEY)return{a:'status',id:KEY[k]};return null}
