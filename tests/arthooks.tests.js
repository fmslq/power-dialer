// К24: картинки из генератора подхватываются по имени (assets/manifest.json → ART_FILES); без файла — рисунок кодом
import {ART_FILES} from '../art/overrides.js';
import {bossSvg,bossImg} from '../art/bosses.js';
import {guideSvg} from '../art/guide.js';
import {itemSprite,lomSvg,stageBack} from '../art/base.js';
import {crest,district} from '../art/world.js';
export function runArtHookTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 const add=(...p)=>p.forEach(x=>ART_FILES.add(x)),clr=()=>ART_FILES.clear();
 t('картинки: без файлов — всё кодом, ни одного <image>',()=>{clr();return ![bossSvg(3),guideSvg('happy'),itemSprite('d1t0'),lomSvg('welcome'),stageBack(0),crest(0,'cur'),district(0,0,false)].some(s=>s.includes('<image'))});
 t('картинки: босс b03_smug заменяет риг, классы для ударов и фаз на месте',()=>{clr();add(bossImg(3),bossImg(3,'hit'));const s=bossSvg(3,{phase:2});return s.includes('bs-png')&&s.includes('b-rig')&&s.includes('b-body')&&s.includes('data-ph="2"')&&s.includes('b03_hit.png')&&!s.includes('b03_down.png')&&!bossSvg(4).includes('<image')});
 t('картинки: Гудок, предмет, Лом (запасное настроение), стадия базы, герб',()=>{clr();add('assets/chars/guide_happy.png','assets/items/d1t0.png','assets/shop/lom_welcome.png','assets/base/stage1.png','assets/map/crest01.png');
  return guideSvg('happy').includes('guide_happy.png')&&!guideSvg('worried').includes('<image')&&itemSprite('d1t0').includes('items/d1t0.png')&&lomSvg('haggle').includes('lom_welcome.png')&&stageBack(0).includes('stage1.png')&&!stageBack(1).includes('<image')&&crest(0,'locked').includes('grayscale')});
 t('картинки: на готовой карте у района остаются флажки и зона клика, домов кодом нет',()=>{const s=district(0,40,false,true);return s.includes('class="dz"')&&s.includes('flg')&&!s.includes('class="lm"')});
 clr();return o}
import {addArt,artUrl,hasArt} from '../art/overrides.js';
export function runArtAliasTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('картинки: .webp вместо .png находится по имени .png',()=>{ART_FILES.clear();addArt('./assets/boss/b05_smug.webp');const ok=hasArt('assets/boss/b05_smug.png')&&artUrl('assets/boss/b05_smug.png')==='assets/boss/b05_smug.webp'&&bossSvg(5).includes('b05_smug.webp');ART_FILES.clear();return ok});
 return o}
export function runArtOldNameTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('картинки: старые имена bNN_body_ph1…3 и bNN_defeat тоже подхватываются',()=>{ART_FILES.clear();addArt('assets/boss/b07_body_ph1.png');addArt('assets/boss/b07_body_ph3.png');addArt('assets/boss/b07_defeat.png');
  const a=bossSvg(7,{phase:1}),b=bossSvg(7,{phase:2}),c=bossSvg(7,{phase:3});ART_FILES.clear();return a.includes('b07_body_ph1')&&b.includes('b07_body_ph1')&&c.includes('b07_body_ph3')&&a.includes('b07_defeat')});
 t('картинки: база stage1_lit / stage1_off',()=>{ART_FILES.clear();addArt('assets/base/stage1_lit.png');addArt('assets/base/stage1_off.png');const ok=stageBack(0).includes('stage1_lit')&&stageBack(0,.1,true).includes('stage1_off');ART_FILES.clear();return ok});
 return o}
import {ghRepo} from '../art/overrides.js';
export function runGhRepoTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('картинки: на GitHub Pages игра знает свой репозиторий, локально — нет',()=>{const a=ghRepo({hostname:'fmslq.github.io',pathname:'/power-dialer/index.html'}),b=ghRepo({hostname:'127.0.0.1',pathname:'/index.html'});return a&&a.own==='fmslq'&&a.repo==='power-dialer'&&b===null});
 return o}
