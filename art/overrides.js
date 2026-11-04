// Готовые картинки из генератора. Игра не «прощупывает» файлы (иначе 404 в консоли): допиши сюда путь,
// когда положишь файл, и он заменит заглушку кодом. Пример: 'assets/story/prologue_1.png', 'assets/scene/d03.png'.
export const ART_FILES=new Set([
]);
export const hasArt=p=>ART_FILES.has(p);
// Манифест (ASSETS.md): assets/manifest.json {files:[...]} — пути, которые реально лежат в папке. Загружается один раз при запуске.
export async function loadArtManifest(){try{const r=await fetch('assets/manifest.json',{cache:'no-cache'});if(!r.ok)return 0;const j=await r.json();(j.files||[]).forEach(f=>ART_FILES.add(String(f).replace(/^\.\//,'')));return ART_FILES.size}catch(_){return 0}}
