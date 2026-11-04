// Модальное подтверждение в стиле игры. ask({title,text,ok,cancel,skipKey,tone}) → Promise<boolean>.
// skipKey: если игрок поставил «Больше не показывать», ответ сразу true (флаг в localStorage ct1_skip_<key>).
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const skipped=k=>{try{return localStorage.getItem('ct1_skip_'+k)==='1'}catch(e){return false}};
export const setSkip=(k,v)=>{try{v?localStorage.setItem('ct1_skip_'+k,'1'):localStorage.removeItem('ct1_skip_'+k)}catch(e){}};
export function ask({title,text,ok='Да',cancel='Отмена',skipKey=null,tone='acc'}={}){
 if(skipKey&&skipped(skipKey))return Promise.resolve(true);
 return new Promise(res=>{const w=document.createElement('div');w.className='ak-wrap';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');
  w.innerHTML=`<div class="ak ${tone}"><h3>${esc(title||'')}</h3><p>${text||''}</p>${skipKey?`<label class="ak-skip"><input type="checkbox"> Больше не показывать</label>`:''}
   <div class="ak-btns"><button class="ak-no">${esc(cancel)} <kbd>Esc</kbd></button><button class="ak-ok">${esc(ok)} <kbd>Enter</kbd></button></div></div>`;
  const done=v=>{if(v&&skipKey&&w.querySelector('.ak-skip input').checked)setSkip(skipKey,1);removeEventListener('keydown',kd,true);w.classList.add('out');setTimeout(()=>w.remove(),180);res(v)};
  const kd=e=>{if(e.code==='Escape'){e.preventDefault();e.stopPropagation();done(false)}else if(e.code==='Enter'){e.preventDefault();e.stopPropagation();done(true)}else if(!['Tab','Space'].includes(e.code))e.stopPropagation()};
  addEventListener('keydown',kd,true);w.querySelector('.ak-ok').onclick=()=>done(true);w.querySelector('.ak-no').onclick=()=>done(false);w.onclick=e=>{if(e.target===w)done(false)};
  document.body.appendChild(w);setTimeout(()=>w.querySelector('.ak-ok').focus(),30)})}
