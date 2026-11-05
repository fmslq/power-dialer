// ПАНЕЛЬ «ПРОТОКОЛ» (место бывшей шпаргалки, ТЗ R1): вкладки «Шпаргалка» | «Google Doc», размер шрифта, «Открыть в отдельном окне».
// Текст шпаргалки по-прежнему живёт в дайлере (P.pad, как в старом). Ссылка на документ, вкладка и размер — в сохранении игры ct1 (ui.proto).
import {icon} from '../../art/icons.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Ссылка из адресной строки → адрес для встраивания. Опубликованный документ (/d/e/…/pub) встраивается как есть;
// обычная ссылка (/d/ID/edit) → /preview: работает, если доступ «всем, у кого есть ссылка».
export function docEmbed(url){const u=String(url||'').trim();if(!/^https:\/\/docs\.google\.com\//.test(u))return null;
 if(/\/document\/d\/e\/[^/]+\/pub/.test(u))return u.replace(/[?#].*$/,'')+'?embedded=true';
 const m=u.match(/\/(document|spreadsheets|presentation)\/d\/([\w-]{20,})/);if(m)return`https://docs.google.com/${m[1]}/d/${m[2]}/preview`;return null}
export function makeProto(o){ // o:{save, pad:()=>text, setPad(text), persist, toast, close}
 const ui=o.save.ui||(o.save.ui={}),P=ui.proto||(ui.proto={tab:'pad',doc:'',fs:15});let pop=null;
 // Q3: вкладка Google Doc по умолчанию скрыта; включается в Настройках → Игра (P.gdoc)
 const tab=()=>P.gdoc&&P.tab==='doc'?'doc':'pad';
 const docBody=()=>{const src=docEmbed(P.doc);return src?`<iframe class="pr-if" src="${esc(src)}" title="Google Doc" referrerpolicy="no-referrer" loading="lazy"></iframe><div class="pr-dr"><span title="${esc(P.doc)}">${esc(P.doc)}</span><button class="wk-btn" data-pr="unlink">Сменить</button></div>`
  :`<div class="pr-set"><b>Подключи скрипт из Google Docs</b><input id="pr-url" placeholder="https://docs.google.com/document/d/…" value="${esc(P.doc)}"><button class="wk-btn pri" data-pr="link">Подключить</button>
   <ol><li>В документе: <b>Файл → Поделиться → Опубликовать в интернете</b> → «Опубликовать».</li><li>Скопируй ссылку из окна публикации и вставь сюда.</li><li>Или обычную ссылку на документ с доступом «Все, у кого есть ссылка».</li></ol>
   <p>Документ открывается только для чтения. Править — в самом Google Docs, здесь обновится после перезагрузки.</p></div>`};
 const html=hidden=>`<aside class="wk-pad ct-panel pr ${hidden?'hidden':''}" id="pad" style="--fs:${P.fs}px"><div class="pr-h"><div class="pr-tabs" role="tablist">
   <button data-pt="pad" class="${tab()==='pad'?'on':''}">${icon('doc')}Шпаргалка</button>${P.gdoc?`<button data-pt="doc" class="${tab()==='doc'?'on':''}">${icon('book')}Google Doc</button>`:''}</div>
   <div class="pr-tools"><button data-pr="fm" title="Шрифт мельче">A−</button><button data-pr="fp" title="Шрифт крупнее">A+</button><button data-pr="pop" title="Открыть в отдельном окне">${icon('popout')}</button><button class="wk-x" id="pad-x" title="Закрыть (T)">${icon('close')}</button></div></div>
  <div class="pr-b">${tab()==='pad'?`<textarea id="pad-t" placeholder="Скрипт, ответы на возражения…">${esc(o.pad())}</textarea>`:docBody()}</div></aside>`;
 const syncPop=()=>{if(pop&&!pop.closed){const t=pop.document.getElementById('t');if(t&&pop.document.activeElement!==t)t.value=o.pad();pop.document.body.style.setProperty('--fs',P.fs+'px')}};
 const openPop=()=>{const src=tab()==='doc'?docEmbed(P.doc):null;
  pop=window.open('','uplink-protocol','popup,width=560,height=820');if(!pop){o.toast('Браузер не дал открыть окно: разреши всплывающие окна');return}
  pop.document.title='Протокол — UPLINK SYNDICATE';
  pop.document.body.innerHTML=src?`<iframe src="${esc(src)}" style="border:0;position:fixed;inset:0;width:100%;height:100%;background:#fff"></iframe>`
   :`<textarea id="t" spellcheck="false" placeholder="Скрипт, ответы на возражения…"></textarea>`;
  const st=pop.document.createElement('style');st.textContent='html,body{margin:0;height:100%;background:#0d1114}textarea{box-sizing:border-box;width:100%;height:100%;border:0;outline:0;resize:none;padding:18px 20px;background:#0d1114;color:#eef3f1;font:var(--fs,15px)/1.55 "IBM Plex Sans",system-ui,sans-serif}';pop.document.head.appendChild(st);
  const t=pop.document.getElementById('t');if(t){t.value=o.pad();t.oninput=()=>{o.setPad(t.value);const m=document.getElementById('pad-t');if(m)m.value=t.value}}syncPop();pop.focus()};
 const bind=root=>{const el=root.querySelector('#pad');if(!el)return;
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.pt){P.tab=b.dataset.pt;o.persist();o.rerender();return}
   const k=b.dataset.pr;if(k==='fm'||k==='fp'){P.fs=Math.max(11,Math.min(24,P.fs+(k==='fp'?1:-1)));el.style.setProperty('--fs',P.fs+'px');o.persist();syncPop();return}
   if(k==='pop')return openPop();
   if(k==='link'){const v=el.querySelector('#pr-url').value.trim();if(!docEmbed(v)){o.toast('Нужна ссылка на Google Docs (docs.google.com/…)');return}P.doc=v;o.persist();o.rerender();return}
   if(k==='unlink'){P.doc='';o.persist();o.rerender();return}});
  const ta=el.querySelector('#pad-t');if(ta)ta.oninput=()=>{o.setPad(ta.value);syncPop()};
  const u=el.querySelector('#pr-url');if(u)u.onkeydown=e=>{if(e.key==='Enter')el.querySelector('[data-pr="link"]').click()}};
 return{html,bind,syncPop}}
