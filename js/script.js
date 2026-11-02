// ScriptPanel: локальные вкладки-шпаргалки, без анимаций; данные в SaveManager (root.scriptTabs, root.scriptFont).
export function mountScript(el,root,save){
 root.scriptTabs=root.scriptTabs&&root.scriptTabs.length?root.scriptTabs:[{n:'Скрипт',t:''}];root.scriptFont=root.scriptFont||14;let cur=0;
 el.innerHTML='<div class="sc-bar"></div><textarea class="sc-t" spellcheck="false" placeholder="Вставь свой скрипт…"></textarea><div class="sc-f"><button data-a="+">+ вкладка</button><button data-a="-">A−</button><button data-a="+f">A+</button><button data-a="x">удалить</button></div>';
 const bar=el.querySelector('.sc-bar'),ta=el.querySelector('.sc-t');
 const draw=()=>{bar.innerHTML='';root.scriptTabs.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t.n;b.className=i===cur?'on':'';b.onclick=()=>{cur=i;draw()};b.ondblclick=()=>{const n=prompt('Название',t.n);if(n){t.n=n;save();draw()}};bar.appendChild(b)});ta.value=root.scriptTabs[cur].t;ta.style.fontSize=root.scriptFont+'px'};
 ta.oninput=()=>{root.scriptTabs[cur].t=ta.value;save()};
 el.querySelector('.sc-f').onclick=e=>{const a=e.target.dataset.a;if(!a)return;if(a==='+'){root.scriptTabs.push({n:'Вкладка '+(root.scriptTabs.length+1),t:''});cur=root.scriptTabs.length-1}
  else if(a==='-'||a==='+f')root.scriptFont=Math.min(26,Math.max(10,root.scriptFont+(a==='-'?-1:1)));else if(a==='x'&&root.scriptTabs.length>1&&confirm('Удалить вкладку?')){root.scriptTabs.splice(cur,1);cur=0}save();draw()};
 draw()}
