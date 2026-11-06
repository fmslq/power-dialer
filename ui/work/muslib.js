// Кусок 26 (ТЗ §14): «Музыкальная библиотека» в Настройках → Звук: сколько треков в каждой папке, чего не хватает, что играет сейчас.
// Плюс выбор стингера по событию: файл, в имени которого есть название события (stingers/capture-01.mp3), иначе любой.
import {DIST} from '../../core/meta.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const LIB_POOLS=()=>[...DIST.map((d,i)=>['d'+(i+1),(i+1)+'. '+d[0]]),['boss','Фаза босса'],['hq','База, карта, рынок'],['overdrive','Overdrive'],['stingers','Короткие вставки'],['menu','Главное меню']];
// сколько треков у папки: сама папка + её подпапки (d1/calm, d1/action)
export const poolCount=(pools,k)=>Object.keys(pools||{}).filter(p=>p===k||p.startsWith(k+'/')).reduce((a,p)=>a+pools[p].length,0);
export function libStats(pools){const L=LIB_POOLS().map(([k,n])=>({k,n,c:poolCount(pools,k)}));return{list:L,miss:L.filter(x=>!x.c).length,total:Object.values(pools||{}).reduce((a,x)=>a+x.length,0)}}
export function libHtml(M){const s=libStats(M.pools);if(!M.lib)return`<div class="ml"><p class="ml-e">Треков пока нет. Выбери папку ниже или пришли треки мне — я положу их в игру. Как назвать папки: d1…d12 (районы), boss, hq, overdrive, stingers, menu.</p></div>`;
 const now=M.last?`<b>${esc(M.last.name||'трек')}</b> · папка ${esc(M.key||'—')}`:'ещё не играл';
 return`<div class="ml"><div class="ml-h"><span>Сейчас: ${now}</span><button class="wk-btn" data-b="mnext">Следующий <kbd>⇧N</kbd></button></div>
  <div class="ml-g">${s.list.map(x=>`<span class="ml-p ${x.c?'ok':'no'}" title="${x.c?'':'Пусто: возьмётся трек из соседней папки'}"><i>${x.c||'—'}</i>${esc(x.n)}</span>`).join('')}</div>
  <small class="ml-f">Всего ${s.total} · ${s.miss?`пустых папок ${s.miss}: там играет трек из соседней`:'все папки заполнены'}</small></div>`}
export function stingerPick(list,kind){if(!list||!list.length)return null;const k=String(kind||'').toLowerCase(),m=list.filter(t=>String(t.name||t.url||'').toLowerCase().includes(k));const L=m.length?m:list;return L[Math.random()*L.length|0]}
export function runMusLibTests(){const o=[],T=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 T('библиотека: считает папку вместе с подпапками и видит пустые',()=>{const p={'d1/calm':[1,2],'d1':[3],'hq':[4],'stingers':[5]},s=libStats(p);return poolCount(p,'d1')===3&&s.total===5&&s.list.length===17&&s.miss===14});
 T('стингер по событию: сначала файл с именем события',()=>{const L=[{name:'win.mp3'},{name:'capture-01.mp3'}];for(let i=0;i<20;i++)if(stingerPick(L,'capture').name!=='capture-01.mp3')return false;return stingerPick(L,'level')!=null&&stingerPick([],'x')===null});
 return o}
