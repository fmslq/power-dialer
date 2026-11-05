// МАТЕРИК (кусок 23). Один большой кусок суши, разрезанный водой на 12 районов.
// Районы = взвешенная диаграмма Вороного (вес = радиус узла) внутри волнистого берега. Между соседями — вода шириной g:
// узкая речка, канал пошире, у мостов — широкая протока, на двух стыках — озёра. Берега петляют (меандр): оба берега
// смещаются одним полем, поэтому ширина воды не скачет. Чистые функции, без DOM — их проверяют тесты.
import {WORLD,NODES} from '../core/mapstate.js';
const W=WORLD.w,H=WORLD.h,TAU=Math.PI*2;
const rng=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)/4294967296);
const hash=(a,b)=>{const r=rng(Math.min(a,b)*97+Math.max(a,b)*13+5);r();return r()};
export const UPPER=d=>d>=9;                       // Высоты: 9–12 стоят выше
export const cliffOf=d=>UPPER(d)?36:d>=6?20:14;    // высота обрыва над водой
// волнистый берег материка: «суперэллипс» с неровностями, по краям мира остаётся море
const COAST=(()=>{const r=rng(4242),a=r()*6,b=r()*6,c=r()*6,P=[];for(let k=0;k<180;k++){const t=k/180*TAU,ct=Math.cos(t),st=Math.sin(t),
 e=5,m=Math.pow(Math.pow(Math.abs(ct),e)+Math.pow(Math.abs(st),e),-1/e),q=1+.035*Math.sin(3*t+a)+.025*Math.sin(7*t+b)+.012*Math.sin(13*t+c);
 P.push({p:[W/2+ct*m*1710*q,H/2+st*m*1135*q],l:-1})}return P})();
const weight=i=>{const R=NODES[i][2];return R*R*1.6};
// ширина воды между районами i и j (до меандра): узкие речки, каналы, у маршрута — протока под мост
const ROUTE=(i,j)=>Math.abs(i-j)===1;
export const gapOf=(i,j)=>{const n=NODES[i][1]<NODES[j][1]?i:j;return(ROUTE(i,j)?58:30+hash(i,j)*34)+cliffOf(n+1)};
// отрезать часть многоугольника полуплоскостью n·p ≤ c; l — у каждой вершины метка ребра, которое из неё выходит (-1 берег, j — граница с районом j)
const clip=(P,n,c,lab)=>{const o=[],m=P.length;if(!m)return o;for(let k=0;k<m;k++){const A=P[k],B=P[(k+1)%m],da=n[0]*A.p[0]+n[1]*A.p[1]-c,db=n[0]*B.p[0]+n[1]*B.p[1]-c;
 const X=()=>{const t=da/(da-db);return[A.p[0]+(B.p[0]-A.p[0])*t,A.p[1]+(B.p[1]-A.p[1])*t]};
 if(da<=0&&db<=0)o.push(A);else if(da<=0){o.push(A);o.push({p:X(),l:lab})}else if(db<=0)o.push({p:X(),l:A.l})}return o};
// граничная прямая между i и j (степенная диаграмма): 2p·(cj−ci) = |cj|²−|ci|²−wj+wi; район i — по свою сторону, минус половина воды
const plane=(i,j)=>{const [xi,yi]=NODES[i],[xj,yj]=NODES[j],dx=xj-xi,dy=yj-yi,L=Math.hypot(dx,dy),n=[dx/L,dy/L],
 c=(xj*xj+yj*yj-xi*xi-yi*yi-weight(j)+weight(i))/(2*L);return{n,c,L}};
const RAW=NODES.map((_,i)=>{let P=COAST.map(v=>({...v}));for(let j=0;j<NODES.length;j++)if(j!==i){const {n,c}=plane(i,j);P=clip(P,n,c-gapOf(i,j)/2,j)}return P});
// общая граница i–j до меандра: отрезок, его длина и середина
export const border=(i,j)=>{const P=RAW[i];for(let k=0;k<P.length;k++)if(P[k].l===j){const a=P[k].p,b=P[(k+1)%P.length].p;return{a,b,len:Math.hypot(b[0]-a[0],b[1]-a[1]),mid:[(a[0]+b[0])/2,(a[1]+b[1])/2]}}return null};
// поле меандра: плавное смещение (длина волны 450–900 px), одинаковое для обоих берегов
const FW=[[.0071,.0043,1.3,34],[.0049,-.0066,4.1,26],[-.0122,.0098,2.2,22],[.0172,.0131,5.0,10]];
const field=(x,y)=>{let dx=0,dy=0;for(const [a,b,ph,A] of FW){dx+=A*Math.sin(a*x+b*y+ph);dy+=A*Math.cos(b*x-a*y+ph*1.7)}return[dx,dy*.8]};
// где вода шире: у мостов (середина границы соседей по маршруту) и два озера на стыках районов
const BRMID=[];for(let d=2;d<=12;d++){const b=border(d-2,d-1);BRMID[d]=b?b.mid:null}
// стыки трёх районов (вершины, где одна граница сменяет другую); на двух самых далёких от мостов — озёра
const JUNC=(()=>{const o=[];RAW.forEach((P,i)=>P.forEach((v,k)=>{const pr=P[(k-1+P.length)%P.length].l;if(pr>=0&&v.l>=0&&pr!==v.l)o.push(v.p)}));return o})();
const LAKES=(()=>{const far=p=>Math.min(...BRMID.filter(Boolean).map(m=>Math.hypot(p[0]-m[0],p[1]-m[1]))),L=JUNC.filter(p=>p[0]<W/2).sort((a,b)=>far(b)-far(a))[0],R=JUNC.filter(p=>p[0]>=W/2).sort((a,b)=>far(b)-far(a))[0];
 return[[L,105],[R,125]].filter(x=>x[0])})();
export const lakes=()=>LAKES.map(([p,r])=>{const [fx,fy]=field(p[0],p[1]);return[p[0]+fx,p[1]+fy,r]});
const widen=(x,y,l)=>{let h=13*Math.sin(x*.011+y*.007)+9*Math.sin(x*.019-y*.015+1.3);   // «дыхание» ширины: где уже, где шире
 for(let d=2;d<=12;d++){const m=BRMID[d];if(m){const s=Math.hypot(x-m[0],y-m[1]),k=Math.exp(-s*s/(2*110*110));h=h*(1-k)+30*k}}
 for(const [p,r] of LAKES){const s=Math.hypot(x-p[0],y-p[1]);h+=r*Math.exp(-s*s/(2*(r*1.05)**2))}return l===-1?h*.4:h};
// контур: плотная выборка рёбер → сдвиг внутрь по «ширине» → сдвиг полем меандра
const STEP=16;
const build=i=>{const P=RAW[i],o=[];for(let k=0;k<P.length;k++){const a=P[k].p,b=P[(k+1)%P.length].p,L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/STEP));
  for(let s=0;s<n;s++){const t=s/n;o.push({p:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],l:P[k].l})}}
 const [cx,cy]=NODES[i];return o.map(v=>{let nx=cx-v.p[0],ny=cy-v.p[1];const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;      // сдвиг к центру района: без иголок на углах
  const h=Math.max(v.l<0?-10:-.35*gapOf(i,v.l)/2,widen(v.p[0],v.p[1],v.l)),x=v.p[0]+nx*h,y=v.p[1]+ny*h,[fx,fy]=field(x,y);return[x+fx,y+fy]})};
let CELLS=null;export const cells=()=>CELLS||(CELLS=NODES.map((_,i)=>build(i)));
const f1=v=>Math.round(v*10)/10;
export const polyD=P=>'M'+P.map(p=>f1(p[0])+' '+f1(p[1])).join('L')+'Z';
export const cellD=d=>polyD(cells()[d-1]);
export const inPoly=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
// луч из точки O по направлению u до первого пересечения с контуром P
const ray=(O,u,P)=>{let best=Infinity;for(let k=0;k<P.length;k++){const a=P[k],b=P[(k+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],den=u[0]*ey-u[1]*ex;if(Math.abs(den)<1e-9)continue;
 const t=((a[0]-O[0])*ey-(a[1]-O[1])*ex)/den,s=((a[0]-O[0])*u[1]-(a[1]-O[1])*u[0])/den;if(t>0&&s>=0&&s<=1&&t<best)best=t}return best};
// мост к району d (с района d-1): поперёк воды в середине общей границы. A — берег d-1, B — берег d.
const BG=[];export const bridgeGeo=d=>BG[d]||(BG[d]=(()=>{const i=d-2,j=d-1,{n}=plane(i,j),m=BRMID[d],[fx,fy]=field(m[0],m[1]),O=[m[0]+fx,m[1]+fy],
 ta=ray(O,[-n[0],-n[1]],cells()[i]),tb=ray(O,n,cells()[j]),A=[O[0]-n[0]*ta,O[1]-n[1]*ta],B=[O[0]+n[0]*tb,O[1]+n[1]*tb];
 return{A,B,M:[(A[0]+B[0])/2,(A[1]+B[1])/2],u:n,v:[-n[1],n[0]],L:ta+tb}})());
export const midOf=d=>bridgeGeo(d).M;
export const qpt=(d,k)=>{const {A,B}=bridgeGeo(d);return[A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k]};
// дорога: от площади района к мосту, по мосту, от моста к площади следующего района
const stand=d=>[NODES[d-1][0],NODES[d-1][1]+40];
export const segD=(a,b)=>{const lo=Math.min(a,b),hi=Math.max(a,b),{A,B,u}=bridgeGeo(hi);let [s,P1,P2,e,k]=[stand(lo),A,B,stand(hi),1];
 if(a>b){[s,P1,P2,e]=[stand(a),B,A,stand(b)];k=-1}
 const ca=[P1[0]-u[0]*k*90,P1[1]-u[1]*k*90],cb=[P2[0]+u[0]*k*90,P2[1]+u[1]*k*90];
 return`M${f1(s[0])} ${f1(s[1])}Q${f1(ca[0])} ${f1(ca[1])} ${f1(P1[0])} ${f1(P1[1])}L${f1(P2[0])} ${f1(P2[1])}Q${f1(cb[0])} ${f1(cb[1])} ${f1(e[0])} ${f1(e[1])}`};
export const routeD=()=>{let d='';for(let k=1;k<NODES.length;k++){const s=segD(k,k+1);d+=k===1?s:s.replace(/^M[^Q]+/,'')}return d};
export const coastD=()=>polyD(COAST.map(v=>{const [fx,fy]=field(...v.p);return[v.p[0]+fx,v.p[1]+fy]}));
export function runLandTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('материк: у соседей по маршруту общая граница (есть где поставить мост)',()=>{for(let d=2;d<=12;d++){const b=border(d-2,d-1),c=border(d-1,d-2);if(!b||!c||b.len<160||c.len<160)return false}return true});
 t('материк: каждая площадь района целиком внутри своего района',()=>NODES.every(([x,y,R],i)=>{const P=cells()[i];if(!inPoly(x,y,P))return false;return P.every(([a,b])=>Math.hypot(a-x,b-y)>R*.62)}));
 t('материк: районы не налезают, между ними вода',()=>{const C=cells();for(let i=0;i<C.length;i++)for(let j=0;j<C.length;j++)if(i!==j&&C[i].some(([x,y],k)=>k%3===0&&inPoly(x,y,C[j])))return false;return true});
 t('мосты: поперёк воды, длина как у протоки (не речка и не море)',()=>{for(let d=2;d<=12;d++){const g=bridgeGeo(d);if(!(g.L>60&&g.L<240))return false}return true});
 return o}
