// I6 (кусок 20): «бой позже». Окно района скрыто, вышел босс, игрок ответил «Нет»: бой откладывается.
// Пока отложен — XP и $ идут как обычно, а прогресс района (то есть урон боссу) копится в G.laterHold.
// Начал бой (включил окно / кнопка «Начать бой» / клик по боссу на карте) — накопленное падает в шкалу (не дальше порога-1:
// добить босса всё равно нужно статусом, остаток уходит в перенос на следующий район).
import {districtThr} from './config.js';
import {bossState} from './engine.js';
export const laterOn=G=>!!G&&G.bossLater===G.district&&bossState(G)!=='scenery';
export function laterHoldOf(G,dx0,dd0){if(!laterOn(G)||G.district!==dd0)return 0;const h=Math.max(0,G.dxp-dx0);if(h>0){G.dxp-=h;G.laterHold=(G.laterHold||0)+h}return h}
export function bossLater(G){G.bossLater=G.district;return G}
export function bossRelease(G){const h=G.laterHold||0;G.bossLater=0;G.laterHold=0;if(!h)return 0;const cap=Math.max(0,districtThr(G.district)-1-G.dxp),r=Math.min(h,cap);G.dxp+=r;if(h>r)G.carry=(G.carry||0)+(h-r);return h}
