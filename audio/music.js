// Библиотека музыки: пулы theme/(calm|action|overdrive), hq, stingers; shuffle-bag; A/B crossfade (equal-power); ducking; EQ по Heat. Без файлов — синтез-эмбиент из audio.js.
export const bagPick=(bag,all,last)=>{if(!bag.length){bag.push(...all.filter(x=>x!==last||all.length===1).sort(()=>Math.random()-.5))}return bag.shift()};
// Пулы: <тема>/calm, <тема>/action, overdrive (верхний уровень), hq (верхний уровень), stingers (верхний уровень).
// ИСПРАВЛЕНО (rework §14): раньше overdrive/ верхнего уровня не находился (искалось */overdrive), а hq/ не использовался вовсе.
export const THEMES=['industrial','neon','blackgold'];
export function pickPool(pools,theme,state,dist){const has=k=>pools[k]&&pools[k].length,any=x=>Object.keys(pools).filter(k=>k.endsWith('/'+x));
 // свои папки: boss/ — фаза босса, d1…d12/ — свой район (с подпапками calm/action или файлами прямо в ней)
 if(state==='boss'){for(const k of ['boss',dist&&`d${dist}/action`,dist&&`d${dist}`])if(k&&has(k))return k;state='action'}
 if(dist&&(state==='calm'||state==='action')){for(const k of [`d${dist}/${state}`,`d${dist}`])if(has(k))return k}
 const order=state==='overdrive'?[`${theme}/overdrive`,'overdrive',...any('overdrive'),`${theme}/action`,...any('action')]
  :(state==='hq'||state==='standby')?['hq',`${theme}/calm`,...any('calm')]
  :state==='action'?[`${theme}/action`,`${theme}/calm`,...any('action')]:[`${theme}/calm`,...any('calm')];
 order.push(...Object.keys(pools).filter(k=>/\/(calm|action)$/.test(k)),'hq','overdrive');
 for(const k of order)if(has(k))return k;return null}
// c: {paused, world (открыт мировой экран: карта/база/магазин), od, step, ulta}
export const stateOf=c=>c.paused?'standby':c.world?'hq':c.od?'overdrive':c.boss?'boss':(c.step>=2||c.ulta)?'action':'calm';
// Стингеры играют на ВСЕХ значимых событиях (раньше только победа и захват района).
export const STINGER_EVENTS=['hundred','capture','level','achv','booked','discovery','rank','purchase','boss','finish','overdrive','trophy'];
export const STINGER_PRIORITY=['capture','rank','booked','discovery','hundred'];
export class Music{constructor(bus){this.pools={};this.bags={};this.decks=[];this.cur=0;this.key=null;this.state='calm';this.lib=false;this.v=.3;this.duckT=0;bus.on('volume',e=>{if(e.music!=null){this.v=e.music;this.apply()}})}
 init(ctx){if(this.ctx||!ctx)return;this.ctx=ctx;const c=ctx;this.out=c.createGain();this.shelf=c.createBiquadFilter();this.shelf.type='lowshelf';this.shelf.frequency.value=160;this.lp=c.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=9000;this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-14;this.comp.ratio.value=3;
  this.out.connect(this.shelf).connect(this.lp).connect(this.comp).connect(c.destination);this.decks=[0,1].map(()=>{const a=new Audio();a.crossOrigin='anonymous';a.preload='auto';const s=c.createMediaElementSource(a),g=c.createGain();g.gain.value=0;s.connect(g).connect(this.out);a.addEventListener('timeupdate',()=>{if(a===this.decks[this.cur].a&&a.duration&&a.duration-a.currentTime<3&&!this._n){this._n=1;this.next(2.5)}});a.addEventListener('ended',()=>{if(a===this.decks[this.cur].a&&!this._n)this.next(.5)});return{a,g}});this.apply()}
 apply(){if(!this.out)return;const t=this.ctx.currentTime,d=this.duckT>t?.4:1,sb=this.state==='standby';this.out.gain.setTargetAtTime(this.v*d*(sb?.35:1),t,.2);this.lp.frequency.setTargetAtTime(sb?900:9000+(this.heat||0)*3000,t,.4);this.shelf.gain.setTargetAtTime((this.heat||0)*2,t,.5);const rate=this.state==='overdrive'?1.1:1;this.decks.forEach(k=>{k.a.playbackRate=rate;k.a.preservesPitch=true})}
 setCtx(c){const st=stateOf(c);this.heat=c.step;const changed=st!==this.state||c.theme!==this.theme||c.dist!==this.dist;this.state=st;this.theme=c.theme;this.dist=c.dist;this.apply();if(!this.lib||!this.ctx)return;if(changed)this.next(1.5)}
 next(fade){this._n=0;const key=pickPool(this.pools,this.theme||'industrial',this.state,this.dist);this.key=key;if(!key)return this.lib=false;const all=this.pools[key],b=this.bags[key]||(this.bags[key]=[]),tr=bagPick(b,all,this.last);this.last=tr;
  const o=this.decks[this.cur],n=this.decks[1-this.cur],t=this.ctx.currentTime;n.a.src=tr.url;n.a.currentTime=0;n.g.gain.cancelScheduledValues(t);o.g.gain.cancelScheduledValues(t);n.a.play().catch(()=>{});
  const steps=24;for(let i=0;i<=steps;i++){const x=i/steps,tt=t+fade*x;n.g.gain.linearRampToValueAtTime(Math.sin(x*Math.PI/2)*Math.pow(10,(tr.gainDb||0)/20),tt);o.g.gain.linearRampToValueAtTime(Math.cos(x*Math.PI/2),tt)}setTimeout(()=>{if(this.decks[this.cur]!==o)o.a.pause()},fade*1000+100); this.cur=1-this.cur;this.apply()} // фикс гонки: два next() подряд ставили на паузу уже новую деку — музыка замолкала
 start(){if(this.lib)this.next(1)}
 duck(sec=3){if(!this.ctx)return;this.duckT=this.ctx.currentTime+sec;this.apply();setTimeout(()=>this.apply(),sec*1000+50)}
 stinger(kind='generic'){const l=this.pools.stingers,now=Date.now();if(!l||!l.length||!this.ctx)return false;if(now-(this.lastSt||0)<4000&&!STINGER_PRIORITY.includes(kind))return false;this.lastSt=now;const k=String(kind).toLowerCase(),m=l.filter(t=>String(t.name||t.url).toLowerCase().includes(k)),L=m.length?m:l;const a=new Audio(L[Math.random()*L.length|0].url);a.volume=Math.min(1,this.v*2+.3);a.play().catch(()=>{});this.duck(3);return true}
 setTracks(list){this.pools={};for(const t of list){(this.pools[t.pool]||(this.pools[t.pool]=[])).push(t)}this.lib=Object.keys(this.pools).length>0;this.bags={}}
 // Папка запоминается (handle в IndexedDB): при следующем запуске достаточно одного клика, чтобы разрешить доступ
 static db(){return new Promise((ok,no)=>{const q=indexedDB.open('ct_music',1);q.onupgradeneeded=()=>q.result.createObjectStore('h');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
 async saveHandle(h){try{const db=await Music.db();db.transaction('h','readwrite').objectStore('h').put(h,'dir')}catch(e){}}
 async savedHandle(){try{const db=await Music.db();return await new Promise(r=>{const q=db.transaction('h').objectStore('h').get('dir');q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}catch(e){return null}}
 // встроенный саундтрек игры: audio/music/manifest.json = {tracks:[{file:'d1/track.mp3',pool:'d1',gainDb:0}]} (кладу я, по файлам пользователя)
 async fromManifest(base='audio/music/'){try{const r=await fetch(base+'manifest.json',{cache:'no-cache'});if(!r.ok)return 0;const m=await r.json(),tr=(m.tracks||[]).map(t=>({pool:t.pool||t.file.split('/').slice(0,-1).join('/')||'industrial/calm',url:base+t.file,gainDb:t.gainDb||0,name:t.name||t.file.split('/').pop()}));this.setTracks(tr);this.src='game';return tr.length}catch(e){return 0}}
 async fromFolder(){if(!globalThis.showDirectoryPicker)return this.fromInput();const h=await showDirectoryPicker({mode:'read'});await this.saveHandle(h);return this.fromHandle(h)}
 // Firefox и Safari не умеют showDirectoryPicker: папку выбираем обычным окном (webkitdirectory). Папка не запоминается — после перезагрузки выбрать снова
 fromInput(){return new Promise(ok=>{const i=document.createElement('input');i.type='file';i.multiple=true;i.webkitdirectory=true;i.setAttribute('webkitdirectory','');i.style.display='none';document.body.append(i);
  const done=n=>{i.remove();ok(n)};i.addEventListener('cancel',()=>done(0));i.onchange=()=>{const tr=[];for(const f of i.files){if(!/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(f.name))continue;const seg=(f.webkitRelativePath||f.name).split('/').slice(1,-1);tr.push({pool:seg.length>1?seg[0]+'/'+seg[1]:seg[0]||'industrial/calm',url:URL.createObjectURL(f),gainDb:0,name:f.name,file:f})}
   this.setTracks(tr);this.autoGain(tr);done(tr.length)};i.click()})}
 async reconnect(){const h=await this.savedHandle();if(!h)return 0;if(await h.requestPermission({mode:'read'})!=='granted')return 0;return this.fromHandle(h)}
 async fromHandle(h){const tr=[];const walk=async(d,p)=>{for await(const [n,e] of d.entries()){if(e.kind==='directory')await walk(e,p+n+'/');else if(/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(n)){const f=await e.getFile(),seg=p.split('/').filter(Boolean);tr.push({pool:seg.length>1?seg[0]+'/'+seg[1]:seg[0]||'industrial/calm',url:URL.createObjectURL(f),gainDb:0,name:n,file:f})}}};await walk(h,'');this.setTracks(tr);this.autoGain(tr);return tr.length}
 async autoGain(tr){for(const t of tr){if(t.gainDb||!t.file)continue;const k='ctg:g:'+t.name+':'+t.file.size;let g=parseFloat(localStorage.getItem(k));if(isNaN(g)){try{const b=await this.ctx.decodeAudioData(await t.file.arrayBuffer()),c=b.getChannelData(0);let q=0,n=0;for(let i=0;i<c.length;i+=8){q+=c[i]*c[i];n++}const db=20*Math.log10(Math.sqrt(q/n)||1e-6);g=Math.max(-12,Math.min(12,-18-db));localStorage.setItem(k,String(g))}catch(e){g=0}}t.gainDb=g}}}
