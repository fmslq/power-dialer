// ПОРТРЕТЫ ЛЮДЕЙ ДЛЯ СЦЕН (кусок 19): бюсты в стиле портрета Лома — толстый контур, плоский цвет, одна деталь-характер.
// npcSvg(pic, mood) → <svg class="npc">. mood: talk|smile|grim. Неизвестный pic → силуэт.
const L=(w=5)=>`stroke="#0b0b0d" stroke-width="${w}" stroke-linejoin="round"`;
const eyes=(m,y=-46,dx=18,c='#111')=>m==='smile'?`<path d="M${-dx-7} ${y}q7-7 14 0M${dx-7} ${y}q7-7 14 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`
 :m==='grim'?`<path d="M${-dx-8} ${y-2}h16M${dx-8} ${y-2}h16" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`:`<circle cx="${-dx}" cy="${y}" r="5" fill="${c}"/><circle cx="${dx}" cy="${y}" r="5" fill="${c}"/>`;
const mouth=(m,y=-14)=>m==='smile'?`<path d="M-16 ${y-4}q16 16 32 0" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`:m==='grim'?`<path d="M-14 ${y}h28" stroke="#111" stroke-width="4" stroke-linecap="round"/>`:`<path d="M-14 ${y-2}q14 8 28 0" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
const bust=(coat,skin='#c99a74')=>`<path d="M-92 80q2-62 44-78l48-6 48 6q42 16 44 78z" fill="${coat}" ${L()}/><path d="M-16 -8h32v18h-32z" fill="${skin}" ${L(4)}/>`;
const P={
 // Эфир-0: пиратское радио. Капюшон, огромные наушники, лицо закрыто шарфом, глаза светятся, микрофон «ON AIR»
 efir:m=>`${bust('#1b2a26')}<path d="M-58 -40q0-70 58-74q58 4 58 74v40h-116z" fill="#22352f" ${L()}/>
  <ellipse cx="0" cy="-40" rx="38" ry="44" fill="#141c1a" ${L(4)}/><path d="M-40-20q40 22 80 0v34h-80z" fill="#2c4a40" ${L(4)}/>
  <path d="M-40-52q-6-50 40-54q46 4 40 54" fill="none" stroke="#0b0b0d" stroke-width="8"/><rect x="-56" y="-66" width="22" height="40" rx="8" fill="#39ff14" ${L(4)}/><rect x="34" y="-66" width="22" height="40" rx="8" fill="#39ff14" ${L(4)}/>
  <circle cx="-15" cy="-46" r="${m==='grim'?3:5}" fill="#9dffb0"/><circle cx="15" cy="-46" r="${m==='grim'?3:5}" fill="#9dffb0"/>
  <path d="M30 40l18-40" stroke="#0b0b0d" stroke-width="6"/><rect x="38" y="-12" width="24" height="30" rx="10" fill="#555" ${L(4)}/><rect x="-36" y="50" width="52" height="16" rx="3" fill="#ff3b4e" ${L(3)}/><text x="-10" y="62" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle" fill="#fff">ON AIR</text>`,
 // Сверло: бригадир «Глухарей». Короткая стрижка набок, сварочные очки на лбу, одна заглушка в ухе, оранжевая роба со светоотражающей полосой, кабель через плечо
 sverlo:m=>`${bust('#e0662a')}<path d="M-92 52l184 0" stroke="#e8f0d0" stroke-width="9"/><path d="M-60 6q30 40 50 74M60 6q-10 30-20 74" fill="none" stroke="#222" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="0" cy="-40" rx="36" ry="44" fill="#c08a64" ${L(4)}/><path d="M-38-50q0-44 40-46q40 2 36 30q-30-10-46 6q-14-8-30 10z" fill="#3a2a24" ${L(4)}/>
  <rect x="-40" y="-82" width="80" height="20" rx="9" fill="#2b3a40" ${L(4)}/><circle cx="-18" cy="-72" r="9" fill="#ffb26b" ${L(3)}/><circle cx="18" cy="-72" r="9" fill="#ffb26b" ${L(3)}/>
  <rect x="-44" y="-50" width="12" height="20" rx="5" fill="#ffc400" ${L(3)}/>${eyes(m)}<path d="M8-30l10 4" stroke="#7a4e36" stroke-width="3"/>${mouth(m)}`,
 // Пятак: первый связист. Кепка, веснушки, монета на шнурке, оттопыренные уши
 pyatak:m=>`${bust('#3d4f7a','#d8a882')}<path d="M-20 6q20 26 40 0" fill="none" stroke="#c8a040" stroke-width="3"/><circle cx="0" cy="34" r="12" fill="#e2b640" ${L(3)}/><text x="0" y="39" font-size="12" font-weight="700" text-anchor="middle" fill="#6a4a10">5</text>
  <ellipse cx="-38" cy="-40" rx="9" ry="13" fill="#d8a882" ${L(3)}/><ellipse cx="38" cy="-40" rx="9" ry="13" fill="#d8a882" ${L(3)}/><ellipse cx="0" cy="-40" rx="34" ry="42" fill="#d8a882" ${L(4)}/>
  <path d="M-38-60q4-34 38-36q34 2 38 36z" fill="#59606a" ${L(4)}/><path d="M-6-62q40-6 60 6l-4 6q-24-6-56-2z" fill="#4a5058" ${L(3)}/>
  ${eyes(m,-44,15)}<g fill="#a8643c"><circle cx="-20" cy="-30" r="2"/><circle cx="-14" cy="-26" r="2"/><circle cx="20" cy="-30" r="2"/><circle cx="14" cy="-26" r="2"/></g>${mouth(m==='talk'?'smile':m,-12)}`,
 // Шорох: голова «Белого Шума» (люди Контрабандиста). Прилизанные волосы, белая маска на рот, неоновый воротник
 shoroh:m=>`${bust('#1c1424','#b9a4a0')}<path d="M-30 4l30 30 30-30" fill="none" stroke="#ff2bd6" stroke-width="6"/>
  <ellipse cx="0" cy="-40" rx="34" ry="44" fill="#b9a4a0" ${L(4)}/><path d="M-34-52q4-44 36-44q34 0 32 40q-20-26-68 4z" fill="#111" ${L(4)}/>
  <path d="M-30-30q30-6 60 0v20q-30 18-60 0z" fill="#f4f4f4" ${L(4)}/><path d="M-20-22h40M-20-14h40" stroke="#ccc" stroke-width="2"/>${eyes(m,-48,15,'#2a0a20')}`,
 // Мадам Пауза: голова «Удержания» (Ночной Рынок). Высокая причёска, закрученная телефонным шнуром, янтарные серьги
 pauza:m=>`${bust('#5a3a10','#c48e62')}<ellipse cx="0" cy="-40" rx="33" ry="42" fill="#c48e62" ${L(4)}/>
  <path d="M-36-50q-6-70 36-74q42 4 36 74q-10-34-36-38q-26 4-36 38z" fill="#2a1a12" ${L(4)}/><path d="M-30-96q10 8 20 0t20 0t20 0" fill="none" stroke="#ffb400" stroke-width="4"/>
  <circle cx="-34" cy="-20" r="6" fill="#ffb400" ${L(3)}/><circle cx="34" cy="-20" r="6" fill="#ffb400" ${L(3)}/>${eyes(m,-44,14)}<path d="M-12-14q12 6 24 0" fill="none" stroke="#8a1a2a" stroke-width="5" stroke-linecap="round"/>`,
 // Хор: связисты Совета. Капюшон, вместо лица — гладкая маска с тремя решётками динамиков
 hor:m=>`${bust('#e8e8ec','#ddd')}<path d="M-60 -30q0-80 60-84q60 4 60 84v40h-120z" fill="#f2f2f6" ${L()}/><ellipse cx="0" cy="-36" rx="34" ry="42" fill="#cfd2d8" ${L(4)}/>
  ${[-16,16].map(x=>`<circle cx="${x}" cy="-46" r="8" fill="#9aa0aa" ${L(2)}/><path d="M${x-5} -46h10M${x} -51v10" stroke="#55606a" stroke-width="2"/>`).join('')}<rect x="-14" y="-24" width="28" height="12" rx="4" fill="#9aa0aa" ${L(2)}/><path d="M-10-18h20" stroke="#55606a" stroke-width="2"/>`,
 // Голос Совета: строгий воротник, вместо головы — громкоговоритель
 council:m=>`${bust('#20242c','#888')}<path d="M-20 0l20 26 20-26" fill="#e8e8e8" ${L(3)}/><path d="M-12-6h24l30-60h-84z" fill="#9aa3ad" ${L(4)}/><ellipse cx="0" cy="-66" rx="42" ry="12" fill="#3a3f48" ${L(4)}/><path d="M-30-66h60" stroke="#ff3b4e" stroke-width="3" opacity="${m==='grim'?1:.5}"/>`};
export const NPC_PICS=Object.keys(P);
export const npcSvg=(pic,mood='talk')=>`<svg class="npc" data-pic="${pic}" viewBox="-100 -120 200 200" aria-hidden="true">${(P[pic]||(()=>`${bust('#333')}<ellipse cx="0" cy="-40" rx="34" ry="42" fill="#555" ${L(4)}/>`))(mood)}</svg>`;
