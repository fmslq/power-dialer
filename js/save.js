import {CONFIG} from './config.js';
// Один корневой ключ, schemaVersion, миграции, резерв предыдущего состояния, debounce.
export const SaveManager={key:'ct1',migrations:{/* 1:root=>root (для v1→v2) */},store:()=>globalThis.localStorage,t:0,
 defaults:()=>({schemaVersion:CONFIG.schemaVersion,game:null,settings:{sfx:.7,music:.3,fx:'full',crt:true},fingerprint:null,callLog:[],scriptTabs:[]}),
 migrate(r){while((r.schemaVersion|0)<CONFIG.schemaVersion){const f=this.migrations[r.schemaVersion|0];if(f)r=f(r);r.schemaVersion=(r.schemaVersion|0)+1}return r},
 load(){const s=this.store();for(const k of [this.key,this.key+'_bak']){try{const raw=s.getItem(k);if(!raw)continue;const r=JSON.parse(raw);if(r&&typeof r==='object')return Object.assign(this.defaults(),this.migrate(r))}catch(e){}}return this.defaults()},
 save(root){try{const s=this.store(),old=s.getItem(this.key);if(old)s.setItem(this.key+'_bak',old);s.setItem(this.key,JSON.stringify(root));return true}catch(e){return false}},
 soon(root,ms=500){clearTimeout(this.t);this.t=setTimeout(()=>this.save(root),ms)},
 install(get){const f=()=>this.save(get());addEventListener('visibilitychange',()=>document.hidden&&f());addEventListener('beforeunload',f)},
 exportJson:root=>JSON.stringify(root,null,1)};
// Второй слой хранения: зеркало в IndexedDB (7 дневных копий), экспорт/импорт файлом, запрос «постоянного» хранилища.
SaveManager.idb=()=>new Promise((ok,no)=>{const q=indexedDB.open('ct_backup',1);q.onupgradeneeded=()=>q.result.createObjectStore('b',{keyPath:'k'});q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
SaveManager.mirror=async function(root){try{const db=await this.idb(),st=db.transaction('b','readwrite').objectStore('b'),j=JSON.stringify(root),t=Date.now();st.put({k:'latest',t,j});st.put({k:'d-'+new Date(t).toISOString().slice(0,10),t,j});
 const ks=await new Promise(r=>{const q=st.getAllKeys();q.onsuccess=()=>r(q.result)});ks.filter(k=>k.startsWith('d-')).sort().slice(0,-7).forEach(k=>st.delete(k));this.lastMirror=t;return true}catch(e){return false}};
SaveManager.latest=async function(){try{const db=await this.idb();return await new Promise(r=>{const q=db.transaction('b').objectStore('b').get('latest');q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}catch(e){return null}};
SaveManager.exportFile=function(root){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([this.exportJson(root)],{type:'application/json'}));a.download='corporate-takeover-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
SaveManager.parseImport=function(text){const r=JSON.parse(text);if(!r||typeof r!=='object'||r.schemaVersion==null)throw new Error('это не сохранение Corporate Takeover');return this.migrate(r)};
SaveManager.persist=async()=>{try{return navigator.storage&&navigator.storage.persist?await navigator.storage.persist():false}catch(e){return false}};
