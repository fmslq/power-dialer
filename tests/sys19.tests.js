// Кусок 19: сцены систем, найм после сцены Сверло, бонус ранга, перебежчики, лут счастливых часов, «примерно» в исходах.
import * as A from '../core/addict.js';
import {OUT,choose} from '../core/allies.js';
import {RANK_BONUS} from '../core/stats.js';
import {panelsOf,SCENES} from '../ui/story/story.js';
export function runSys19Tests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('лут счастливого часа не выпадает вне часа',()=>{for(const r of ['u','r','e','l'])for(let i=0;i<200;i++)if(A.pickLoot(r,Math.random,false).hh)return false;return true});
 t('лут счастливого часа выпадает в час',()=>{let n=0;for(let i=0;i<400;i++)if(A.pickLoot('l',Math.random,true).hh)n++;return n>0});
 t('у каждой ступени есть вещь только для счастливого часа',()=>['u','r','e','l'].every(r=>A.LOOT.some(x=>x.r===r&&x.hh)));
 t('найм связистов закрыт до сцены Сверло',()=>{const root={},G={money:1e9};A.ensure(root).ops.rooms=1;const a=A.hireOp(root,G);root.story={seen:{'sys-syn':1}};const b=A.hireOp(root,G);return !a.ok&&b.ok});
 t('бонус ранга растёт и входит в итог',()=>{const r0={rank:0},r4={rank:4};return RANK_BONUS.every((v,i)=>!i||v>RANK_BONUS[i-1])&&A.adTotals(r4,0).xAll-A.adTotals(r0,0).xAll===RANK_BONUS[4]});
 t('перебежчик: «Отпустить» Контрабандиста приводит связиста',()=>{const s={story:{}},G={money:0,district:4};const r=choose(s,G,3,'free');return r.ok&&r.def&&s.ad.ops.def.length===1&&A.adTotals(s,0).xAll>=A.OPS.perOp});
 t('исходы с деньгами говорят «примерно»',()=>Object.values(OUT).every(x=>x.opts.every(p=>!p.eff.money||/примерно/.test(p.b))));
 t('Журнал: сцены систем, полок и звонков изнутри открываются',()=>['sys-switch','sys-syn','shelf-1','shelf-12','pre-1','pre-11'].every(k=>SCENES.some(s=>s.key===k)&&panelsOf(k).length>=3));
 return o}
