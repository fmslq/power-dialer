import {STATUS} from './config.js';
// Чистая функция: клавиша+контекст -> действие. Старые клавиши не меняются.
const KEY=Object.fromEntries(STATUS.map(s=>[s.key,s.id])),ch=c=>c.startsWith('Digit')?c.slice(5):c.startsWith('Key')?c.slice(3):'';
export function resolveKey(c,code){
 if(c.typing)return code==='Escape'?{a:'blur'}:null;
 if(code==='Space')return{a:'dial'};
 if(code==='Enter')return c.suggest!=null&&c.suggest>=0?{a:'status',id:c.suggest}:{a:'dial'};
 if(code==='Escape')return{a:'close'};
 if(code==='Slash')return{a:'picker'};
 const k=ch(code);if(code==='KeyT')return c.menu?{a:'status',id:KEY.T}:{a:'pad'};
 const m={S:'skip',Z:'back',X:'clear',P:'pause',N:'notes',M:'menu'};if(m[k])return{a:m[k]};
 if(k in KEY)return{a:'status',id:KEY[k]};return null}
