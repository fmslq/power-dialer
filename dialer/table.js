// Таблица лидов без DOM: разбор и запись CSV/TSV с сохранением формата файла (разделитель, переносы, кавычки, хвостовой перенос).
// Логика parse/ser/load перенесена из старого дайлера без изменений поведения. Добавлено: колонка Prep (только чтение), очистка «⠀».
import {cleanResult} from './statuses.js';
export function parse(t,sep){const r=[];let row=[],c="",q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"')q=true;else if(ch==sep){row.push(c);c=""}
  else if(ch=="\n"){row.push(c);r.push(row);row=[];c=""}else if(ch!="\r")c+=ch}
 if(c||row.length){row.push(c);r.push(row)}
 return r.filter(x=>x.length>1||x[0]!=="")}
export function ser(h,rows,sep,nl,tail){const re=new RegExp('["\\r\\n'+(sep=="\t"?"\\t":sep)+']');
 const q=v=>re.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
 return [h,...rows].map(r=>r.map(q).join(sep)).join(nl)+(tail?nl:"")}
export const today=(d=new Date())=>d.toLocaleDateString("en-CA");
export const phoneE164=s=>{const d=String(s||'').replace(/\D/g,'');if(d.length==10)return"+1"+d;if(d.length==11&&d[0]=="1")return"+"+d;return""};
export const REQUIRED_ADD=["Date Engaged","Result","Notes","Callback?"];   // как в старом: недостающие колонки добавляются в конец

export class Table{
 constructor(){this.h=[];this.L=[];this.d=",";this.nl="\r\n";this.tail=false;this.name="";this.src=null;this.ixc={}}
 ix(n){if(!(n in this.ixc))this.ixc[n]=this.h.findIndex(x=>x.trim().toLowerCase()==n.toLowerCase());return this.ixc[n]}
 get(l,n){const i=this.ix(n);return i<0?"":(l.v[i]||"")}
 put(l,n,v){const i=this.ix(n);if(i>=0)l.v[i]=v;return i>=0}
 res(l){return cleanResult(this.get(l,"Result"))}
 ph(l){return phoneE164(this.get(l,"Phone"))}
 prep(l){return this.get(l,"Prep").trim()}               // ПОДГОТОВКА: колонка Prep слева от Notes, дайлер её только читает
 hasPrep(){return this.ix("Prep")>=0}
 _fin(){this.ixc={};REQUIRED_ADD.forEach(n=>{if(this.ix(n)<0){this.h.push(n);this.L.forEach(l=>l.v.push(""));this.ixc={}}});
  this.L.forEach(l=>{l.n0=this.get(l,"Notes");l.c0=this.get(l,"Callback?")})}
 // текст CSV/TSV из файла (старый load)
 loadText(text,name){const f=text.split("\n")[0];
  const d=(f.match(/\t/g)||[]).length>(f.match(/,/g)||[]).length?"\t":",",r=parse(text,d);
  if(r.length<2||!r[0].some(x=>x.trim().toLowerCase()=="phone"))throw new Error("в файле нет колонки Phone или лидов");
  this.src=null;this.d=d;this.nl=text.includes("\r\n")?"\r\n":"\n";this.tail=/\n$/.test(text);
  this.h=r[0];this.ixc={};this.L=r.slice(1).map(x=>({v:this.h.map((_,i)=>x[i]||""),s:0}));this.name=name;this._fin();return this}
 // ответ Apps Script {head, rows:[{r,c}], doc, tab, gid} (старый openSheet)
 loadSheet(r,src){this.src={id:src.id,gid:r.gid};this.d=",";this.nl="\n";this.tail=true;this.h=r.head.slice();this.ixc={};
  this.L=r.rows.map(x=>({v:this.h.map((_,i)=>x.c[i]||""),s:0,r:x.r}));this.name=r.doc+" · "+r.tab;this._fin();return this}
 serialize(){return ser(this.h,this.L.map(l=>l.v),this.d,this.nl,this.tail)}
 serializeCsv(){return ser(this.h,this.L.map(l=>l.v),",","\n",1)}                 // резервная копия в папку (bkWrite)
 serializeTsv(){return ser(this.h,this.L.map(l=>l.v),"\t","\n",0)}                // «скопировать, вставь в A1» (cp)
 get loaded(){return this.L.length>0}
}
