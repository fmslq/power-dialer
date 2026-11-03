// Местное время лида по штату/ZIP (перенос zone/lt/lstate/tzk старого дайлера; возвращает данные, а не HTML).
export const TZ={};
"CT NJ DE MD DC GA FL NC SC VA WV OH PA NY MA ME NH VT RI MI IN KY".split(" ").forEach(s=>TZ[s]="America/New_York");
"AL AR IL IA LA MN MS MO OK WI KS TX ND SD NE TN".split(" ").forEach(s=>TZ[s]="America/Chicago");
"MT WY CO NM UT ID".split(" ").forEach(s=>TZ[s]="America/Denver");TZ.AZ="America/Phoenix";
"CA WA OR NV".split(" ").forEach(s=>TZ[s]="America/Los_Angeles");TZ.AK="America/Anchorage";TZ.HI="Pacific/Honolulu";
const SPLIT=[["TN",[373,374,376,377,378,379],"America/New_York"],["KY",[420,421,422,423,424,427],"America/Chicago"],["FL",[324,325],"America/Chicago"],["TX",[798,799,885],"America/Denver"],["IN",[463,464,476,477],"America/Chicago"]];
export const TZN={"America/New_York":"Eastern","America/Chicago":"Central","America/Denver":"Mountain","America/Phoenix":"Mountain","America/Los_Angeles":"Pacific"};
export function zone(t,l){if(l.zc!==undefined)return l.zc;const a=t.get(l,"Adress")||t.get(l,"Address"),m=a.match(/\b([A-Z]{2})\s+(\d{5})\b/);
 const st=m&&TZ[m[1]]?m[1]:t.get(l,"State").trim().toUpperCase();let z=TZ[st];if(!z)return l.zc=null;
 if(m&&m[1]==st){const z3=+m[2].slice(0,3),o=SPLIT.find(c=>c[0]==st&&c[1].includes(z3));if(o)z=o[2]}
 return l.zc={z,st}}
export const lstate=(t,l)=>{const z=zone(t,l);return z?z.st:t.get(l,"State").trim().toUpperCase()};
export const tzk=(t,l)=>{const z=zone(t,l);return z?(TZN[z.z]||"Other"):""};
// {state, time:'7:00 PM', tz:'EST', hour, work:true если 9–17 у них}
export function localTime(t,l,d=new Date()){const q=zone(t,l);if(!q)return null;
 const hour=+new Intl.DateTimeFormat("en-US",{timeZone:q.z,hour:"numeric",hour12:false}).format(d)%24;
 const tz=new Intl.DateTimeFormat("en-US",{timeZone:q.z,timeZoneName:"short"}).formatToParts(d).find(p=>p.type=="timeZoneName").value;
 return{state:q.st,time:d.toLocaleTimeString("en-US",{timeZone:q.z,hour:"numeric",minute:"2-digit"}),tz,hour,work:hour>=9&&hour<17}}
