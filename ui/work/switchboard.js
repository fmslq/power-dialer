// I3 (кусок 20): Коммутатор «Заря-12» — визуальное дерево. Ручной пульт: снизу «гнездо ноль» (Гудок), от него шнуры к шести линиям,
// в каждой — шесть гнёзд снизу вверх. Тёмный провод — линия не включена; горит — открыто; ближайшее закрытое мигает,
// как неисправная лампа, и показывает цену. ⓘ — подробно: что это, как получить, зачем. Логика покупки — core/addict.js buyTree.
import * as A from '../../core/addict.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const BR_COL={res:'#3ad7ff',gold:'#ffc400',xp:'#39ff14',luck:'#b98bff',grit:'#ff7a2b',look:'#ff2bd6'};
const ROM=['I','II','III','IV','V','VI'];
// подробные подсказки ⓘ: что это / как получить / зачем
export const BR_INFO={
 res:{what:'Линия держит серию дольше: к окну между звонками добавляются секунды.',how:'Зажигай гнёзда Сигналом. Сигнал Гудок копит из каждого звонка; разговоры и встречи дают больше, в счастливый час — вдвое.',why:'Успеваешь сменить номер, записать заметку или выпить воды — и множитель серии не сгорает.'},
 gold:{what:'Каждый уровень — постоянная прибавка к деньгам со всех статусов.',how:'Сигнал → гнездо. Цена каждого следующего штекера выше.',why:'Деньги — это база, Слышащие и вещи Лома. Чем раньше зажжёшь, тем больше накапает.'},
 xp:{what:'Постоянная прибавка к XP со всех статусов.',how:'Сигнал → гнездо.',why:'XP двигает шкалу района: быстрее к боссу и к следующему району.'},
 luck:{what:'Шум (рулетка на «мусорных» звонках) ловится чаще, а гарантированный сундук приходит раньше.',how:'Сигнал → гнездо. Шум сам по себе ловится на автоответчиках, гейткиперах и сбросах.',why:'Больше обломков Тишины в рюкзаке — больше бустов на десятки звонков.'},
 grit:{what:'Ночная чистка ARCHON забирает меньше, если день был совсем пустой.',how:'Сигнал → гнездо.',why:'Страховка на плохие дни: меньше потерь прогресса района и денег.'},
 look:{what:'Каждый уровень открывает новую тему оформления.',how:'Сигнал → гнездо. Темы — во вкладке «Темы».',why:'На деньги не влияет. Влияет на настроение. Иногда это одно и то же.'}};
// эффект уровня словами (по fx из ядра)
export function fxText(n,l){const f=n.fx(l)||{},p=[];if(f.fast)p.push(`+${f.fast} с к окну`);if(f.mAll)p.push(`+${f.mAll}% $`);if(f.xAll)p.push(`+${f.xAll}% XP`);
 if(f.luck)p.push(`Шум +${Math.round(f.luck*100)}%`);if(f.pity)p.push(`гарант −${f.pity}`);if(f.purge)p.push(`чистка −${Math.round(f.purge*100)}%`);if(f.themes)p.push(`тем: ${1+f.themes}`);return p.join(', ')}
export function boardHtml({tree={},sig=0,info=null,SG='',just=null}){
 const cols=A.TREE.map((n,ci)=>{const l=tree[n.id]|0,c=BR_COL[n.id]||'#3ad7ff',cost=A.treeCost(l);
  const js=Array.from({length:6},(_,i)=>{const lv=i+1,st=lv<=l?'on':lv===l+1?'next':'off',d=fxText(n,lv),can=st==='next'&&sig>=cost;
   return`${i?`<i class="sb-w ${lv<=l?'on':''}"></i>`:''}<div class="sb-j ${st}${can?' can':''}${just&&just.id===n.id&&just.lv===lv?' just':''}" title="${esc(n.n)} ${ROM[i]}: ${esc(d)}${st==='on'?' · горит':st==='next'?' · следующее, '+cost+' Сигнала':''}">
    <i class="lamp"></i><b>${ROM[i]}</b><span>${esc(d)}</span>${st==='next'?`<button class="sb-buy" data-buy="${n.id}" ${can?'':'disabled'}>${SG}${cost.toLocaleString('ru')}</button>`:''}</div>`}).join('');
  return`<div class="sb-col${l>=6?' max':''}${info===n.id?' inf':''}" style="--c:${c}"><div class="sb-hd"><b>${esc(n.n)}</b><button class="sb-i" data-info="${n.id}" aria-label="Подробно: ${esc(n.n)}" title="Подробно">i</button><small>${esc(n.t)}</small><em>${l}/6</em></div>
   <div class="sb-st">${js}</div><i class="sb-w root ${l?'on':''}"></i></div>`}).join('');
 const lit=A.TREE.map(n=>tree[n.id]|0),sum=lit.reduce((a,b)=>a+b,0);
 const wires=A.TREE.map((n,i)=>{const x=100*i+50,on=(tree[n.id]|0)>0;return`<path class="${on?'on':''}" style="--c:${BR_COL[n.id]}" d="M300 64 C 300 30, ${x} 40, ${x} 0"/>`}).join('');
 const I=info&&BR_INFO[info],N=info&&A.TREE.find(x=>x.id===info);
 return`<div class="sb"><div class="sb-frame"><div class="sb-cols">${cols}</div>
  <svg class="sb-cords" viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden="true">${wires}</svg>
  <div class="sb-root${sum?' on':''}"><i class="lamp"></i><b>ГНЕЗДО 0</b><span>${sum?'Гудок на линии · горит '+sum+' из 36':'Гудок ждёт первого штекера'}</span></div></div>
  ${I?`<div class="sb-info" style="--c:${BR_COL[info]}"><b>${esc(N.n)}</b><button class="sb-ix" data-info="" aria-label="Закрыть"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><p><i>Что это</i>${esc(I.what)}</p><p><i>Как получить</i>${esc(I.how)}</p><p><i>Зачем</i>${esc(I.why)}</p>
   <p class="sb-lv">${Array.from({length:6},(_,i)=>`<span class="${i<(tree[info]|0)?'on':''}">${ROM[i]} · ${esc(fxText(N,i+1))} · ${A.treeCost(i).toLocaleString('ru')}</span>`).join('')}</p></div>`:''}</div>`}
// шнуры от гнезда ноль — точно к лампам первого уровня (меряем после рендера; без этого концы уходят в центр колонки)
export function fitCords(root){const fr=root&&root.querySelector('.sb-frame'),sv=fr&&fr.querySelector('.sb-cords'),rl=fr&&fr.querySelector('.sb-root .lamp');if(!sv||!rl)return;
 const b=sv.getBoundingClientRect();if(!b.width)return;const rx=rl.getBoundingClientRect(),cx=rx.left+rx.width/2-b.left;sv.setAttribute('viewBox',`0 0 ${b.width.toFixed(0)} 64`);sv.setAttribute('preserveAspectRatio','none');
 const stubs=[...fr.querySelectorAll('.sb-w.root')];sv.querySelectorAll('path').forEach((p,i)=>{const s=stubs[i];if(!s)return;const r=s.getBoundingClientRect(),x=r.left+r.width/2-b.left;p.setAttribute('d',`M${cx.toFixed(1)} 64 C ${cx.toFixed(1)} 30, ${x.toFixed(1)} 40, ${x.toFixed(1)} 0`)})}
