// Готовые картинки из генератора. Игра не «прощупывает» файлы (иначе 404 в консоли): допиши сюда путь,
// когда положишь файл, и он заменит заглушку кодом. Пример: 'assets/story/prologue_1.png', 'assets/scene/d03.png'.
export const ART_FILES=new Set([
]);
export const hasArt=p=>ART_FILES.has(p);
