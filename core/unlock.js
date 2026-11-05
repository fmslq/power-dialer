// J11 (кусок 21): разделы открываются по ходу первого района, через события сюжета.
// Сразу: Смена, Ранг, Настройки, Журнал. Остальное — по доле пути в районе 1 или по событию (первая находка, первый трофей).
// После района 1 открыто всё. Открытое не закрывается (root.unl).
import {districtThr} from './config.js';
export const UNL=[
 {id:'bag',f:.04,n:'Рюкзак',sys:'noise',ev:r=>((r.ad||{}).drops||[]).length>0},
 {id:'trophy',f:.08,n:'Трофеи',sys:'trophy',ev:r=>(r.trophies||[]).length>0||Object.keys(r.ach||{}).length>0},
 {id:'map',f:.12,n:'Карта',sys:'map'},
 {id:'hh',f:.16,n:'Счастливые часы',sys:'hh'},
 {id:'dossier',f:.22,n:'Досье',sys:'dossier'},
 {id:'tree',f:.3,n:'Коммутатор',sys:'switch'},
 {id:'freeze',f:.36,n:'Заморозка',sys:'freeze'},
 {id:'base',f:.45,n:'База',sys:'base'},
 {id:'raid',f:.58,n:'Рейд',sys:'raid'},
 {id:'look',f:.66,n:'Темы',sys:'themes'}];
const ALWAYS=new Set(['shift','rank','settings','log']);
export const unlFrac=G=>!G?0:G.district>1?1:Math.max(0,(G.dxp||0)/districtThr(1));
export function isUnl(root,G,id,all=false){if(all||ALWAYS.has(id))return true;const u=UNL.find(x=>x.id===id);if(!u)return true;
  return!!(root.unl&&root.unl[id])||unlFrac(G)>=u.f||!!(u.ev&&u.ev(root))}
// новые открытия с прошлого раза: [{id,n,sys}] — по одному за вызов, чтобы сцены не шли пачкой
export function unlCheck(root,G,now=Date.now(),all=false){const first=!root.unl,U=root.unl||(root.unl={}),out=[];
  for(const u of UNL)if(!U[u.id]&&isUnl({...root,unl:{}},G,u.id,all)){U[u.id]=now;if(!first)out.push(u)}return out}   // старое сохранение: уже открытое — молча
