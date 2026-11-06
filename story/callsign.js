// ПОЗЫВНОЙ В РЕПЛИКАХ (F6, кусок 26). Позывной выбирают на проходе «Позывной» (core/keys.js, k5) → save.story.ch.cs.
// В текстах {cs} — позывной игрока. Пока он не выбран, подставляется «Звонарь»: так тебя зовут в городе с самого начала.
export const CS_FALLBACK='Звонарь';
export const callsign=save=>(((save&&save.story)||{}).ch||{}).cs||null;
export const withCs=(t,cs)=>typeof t==='string'&&t.includes('{cs}')?t.replace(/\{cs\}/g,cs||CS_FALLBACK):t;
export function runCallsignTests(texts){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('позывной: выбранный подставляется, без выбора — Звонарь, текст без {cs} не меняется',()=>withCs('Слышишь, {cs}?','Эхо')==='Слышишь, Эхо?'&&withCs('Слышишь, {cs}?',callsign({}))==='Слышишь, Звонарь?'&&withCs('Привет',null)==='Привет'&&callsign({story:{ch:{cs:'Полночь'}}})==='Полночь');
 t('позывной: в поздних текстах {cs} есть, в ранних районах (1–9) его нет',()=>{const late=texts.filter(x=>x.d>=10).some(x=>x.t.includes('{cs}')),early=texts.filter(x=>x.d<10).every(x=>!x.t.includes('{cs}'));return late&&early});
 return o}
