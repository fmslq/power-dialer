// загрузчик: модуль разрезан на куски из-за лимита деплоя (tools/deploy.mjs)
const B=import.meta.url.split('?')[0],t=(await Promise.all(["./work.p1.txt?v=59b293fa2e","./work.p2.txt?v=9d237c6f9c"].map(u=>fetch(new URL(u,B)).then(r=>{if(!r.ok)throw new Error('ui/work/work.js: '+u+' '+r.status);return r.text()})))).join('').replace(/(from\s*|import\s*\(\s*|import\s*)(["'])(\.{1,2}\/[^"']+)\2/g,(m,a,q,s)=>a+q+new URL(s,B).href+q);
const m=await import(URL.createObjectURL(new Blob([t],{type:'text/javascript'})));
export const {TESTER_KEY,startWork,testerOn}=m;
