export class EventBus{constructor(){this.h={}}
 on(t,f){(this.h[t]||(this.h[t]=[])).push(f);return()=>this.h[t]=this.h[t].filter(x=>x!==f)}
 emit(t,d){(this.h[t]||[]).slice().forEach(f=>{try{f(d)}catch(e){console.error('bus',t,e)}})}}
export const bus=new EventBus();
