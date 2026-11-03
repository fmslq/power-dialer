// ГУДОК кодом: ЭЛТ-монитор, лицо из линий осциллографа. 6 состояний (ART_PROMPTS v3 §6.2).
// Корпус и лицо раздельно: когда придёт картинка корпуса (assets/chars/guide_case.png), лицо остаётся кодом и анимируется.
export const MOODS=['neutral','talking','sarcastic','happy','worried','whisper'];
const FACE={
 neutral:{l:'M-38-14h22',r:'M16-14h22',m:'M-40 18h80'},
 talking:{l:'M-38-16h22',r:'M16-16h22',m:'M-40 18q10-14 20 0t20 0 20 0 20 0'},
 sarcastic:{l:'M-38-12h22',r:'M16-22l22-4',m:'M-40 20q40 4 80-10'},
 happy:{l:'M-38-12q11-10 22 0',r:'M16-12q11-10 22 0',m:'M-36 12q36 30 72 0'},
 worried:{l:'M-38-20l22 6',r:'M16-14l22-6',m:'M-40 22q6-8 12 0t12 0 12 0 12 0 12 0 12 0 8 0'},
 whisper:{l:'M-34-14h14',r:'M20-14h14',m:'M-24 18h48'}};
export const guideFace=(mood='neutral')=>{const F=FACE[mood]||FACE.neutral;return`<g class="gk-f ${mood}"><g class="gk-eyes"><path d="${F.l}"/><path d="${F.r}"/></g><path class="gk-m" d="${F.m}"/></g>`};
export const guideSvg=(mood='neutral',cls='')=>`<svg class="gk ${cls}" data-mood="${mood}" viewBox="-110 -96 220 200" aria-hidden="true">
 <defs><radialGradient id="gkS" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#0f3a18"/><stop offset="1" stop-color="#020904"/></radialGradient></defs>
 <path d="M-96-84h192q10 0 10 10v134q0 10-10 10h-192q-10 0-10-10v-134q0-10 10-10z" fill="#cfc3a5"/><path d="M-96-84h192q10 0 10 10v6h-212v-6q0-10 10-10z" fill="#e2d8bc"/>
 <path d="M-60 70h120l14 26h-148z" fill="#a99d80"/><rect x="62" y="40" width="22" height="8" rx="2" fill="#8a7f66"/><circle cx="-74" cy="46" r="5" fill="#39ff14" class="gk-led"/>
 <path d="M-56-58l14 4-6 10z" fill="#ffc400" opacity=".9"/><path d="M70-62l10 30" stroke="#8a7f66" stroke-width="1.5"/>
 <rect x="-84" y="-70" width="168" height="122" rx="18" fill="url(#gkS)"/>
 <g class="gk-scr" fill="none" stroke="#39ff14" stroke-width="5" stroke-linecap="round">${guideFace(mood)}</g>
 <path class="gk-scan" d="M-84-70h168v122h-168z" fill="url(#gkL)" opacity=".5"/>
 <defs><pattern id="gkL" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h4" stroke="#000" stroke-opacity=".5"/></pattern></defs>
 <rect x="-84" y="-70" width="168" height="122" rx="18" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="6"/></svg>`;
