// Готовые картинки из генератора. Игра не «прощупывает» файлы (иначе 404 в консоли): допиши сюда путь,
// когда положишь файл, и он заменит заглушку кодом. Пример: 'assets/story/prologue_1.png', 'assets/scene/d03.png'.
export const ART_FILES=new Set([
]);
export const hasArt=p=>ART_FILES.has(p);
// К24: генератор может отдать .webp или .jpg вместо .png — в коде все пути .png, а настоящий файл берётся через artUrl
const ALIAS=new Map();
export const artUrl=p=>ALIAS.get(p)||p;
export const addArt=f=>{f=String(f).replace(/^\.\//,'');ART_FILES.add(f);if(/\.(webp|jpe?g)$/i.test(f)){const png=f.replace(/\.(webp|jpe?g)$/i,'.png');if(!ALIAS.has(png)){ALIAS.set(png,f);ART_FILES.add(png)}}};
// Манифест (ASSETS.md): assets/manifest.json {files:[...]} — пути, которые реально лежат в папке. Загружается один раз при запуске.
// К24: на GitHub Pages манифест не нужен — список картинок берётся из открытого списка файлов репозитория (один запрос, кэш 3 мин).
// Значит, достаточно загрузить картинку в assets/… через «Upload files» на GitHub — и через пару минут игра её подхватит.
const IMG=/^assets\/.+\.(png|webp|jpe?g)$/i;
export const ghRepo=(loc=globalThis.location)=>{try{const h=loc.hostname||'';if(!h.endsWith('.github.io'))return null;const own=h.split('.')[0],seg=(loc.pathname||'/').split('/').filter(Boolean),repo=seg.length&&!/\.html?$/.test(seg[0])?seg[0]:h;return{own,repo}}catch(_){return null}};
async function loadGhTree(){const g=ghRepo();if(!g)return;const K='ct_arttree',now=Date.now();let list=null;
 try{const c=JSON.parse(localStorage.getItem(K)||'null');if(c&&c.r===g.own+'/'+g.repo&&now-c.t<180000)list=c.f}catch(_){}
 if(!list){try{const r=await fetch(`https://api.github.com/repos/${g.own}/${g.repo}/git/trees/HEAD?recursive=1`);if(!r.ok)return;const j=await r.json();list=(j.tree||[]).filter(x=>x.type==='blob'&&IMG.test(x.path)).map(x=>x.path);
  try{localStorage.setItem(K,JSON.stringify({r:g.own+'/'+g.repo,t:now,f:list}))}catch(_){}}catch(_){return}}
 list.forEach(addArt)}
export async function loadArtManifest(){try{const r=await fetch('assets/manifest.json',{cache:'no-cache'});if(r.ok){const j=await r.json();(j.files||[]).forEach(addArt)}}catch(_){}
 await loadGhTree();return ART_FILES.size}
