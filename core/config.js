// Все числа игры живут здесь. Названия статусов НЕ менять: они уходят в таблицу.
export const CONFIG={
 schemaVersion:2,version:'ct-2 (rework)',title:'UPLINK SYNDICATE',subtitle:'COLD LINE',tabTitle:'UPLINK SYNDICATE', // название игры и вкладки: рабочее, меняется ТОЛЬКО здесь
 assumedDailyXp:3500,assumedDailyMoney:3900, // 3500/3900 откалиброваны симуляцией (tools/sim.mjs): железный день = ~3560 XP / ~3960 $

 classes:{TRASH:{xp:8,money:6,pts:1,fast:1},GATEKEEPER:{xp:12,money:10,pts:1,fast:1},MINOR:{xp:15,money:10,pts:1,fast:1},
  TALK:{xp:35,money:30,pts:2},CALLBACK:{xp:45,money:40,pts:2},BOOKED:{xp:500,money:600,pts:10,win:1},DISCOVERY:{xp:900,money:1200,pts:15,win:1}},
 hi:['TALK','CALLBACK','BOOKED','DISCOVERY'],crmFrom:['TALK','CALLBACK'],
 heat:{steps:[0,4,10,20],money:[1,1.25,1.5,2],xpShare:.6},
 fastSec:60,crmSec:180,statusGapSec:{2:180,3:300}, // ОБЩЕЕ окно от статуса до следующего звонка, чтобы Heat не упал: обычно 60 с; после «Owner hung up в начале» (id 2) ровно 3 мин; после «Owner pitched & Hang Up» (id 3) ровно 5 мин; после Call back/Follow up 60+180 с
 afterCallSec:{TRASH:30,GATEKEEPER:30,MINOR:45,TALK:60,CALLBACK:180,BOOKED:1200,DISCOVERY:1200,byId:{}}, // окно по логу Zoom: от КОНЦА прошлого звонка до НАЧАЛА следующего (сек), по прошлому статусу. Только в коде, не в настройках (иначе чит)
 maxGapMin:40,winMaxGapMin:40,heatDropMode:'oneStep',
 antispamSec:4,redialMinSec:30,testerCallSec:360,undoKeep:5000,antispamMult:.5,undoSec:60,pauseMaxSec:600,bonusCap:.5,
 ulta:{n:5},
 od:{streak:25,sec:480,money:3,xp:2.2}, // ТЗ §7: 8 минут, XP x2.2. Серия 25: в реальной работе это ≈1 раз на 100 звонков (слово пользователя)
 talkBonus:{xp:3.5,money:2.6,cap:18,per:30,after:60},
 minTalkSec:{TALK:15,CALLBACK:20,BOOKED:180,DISCOVERY:300}, // BOOKED/DISCOVERY короче этого по Zoom = статус НЕЛЬЗЯ поставить
 bossPhaseShare:.1,finishFromDistrict:3,
 cancelStatusId:0,countInbound:false,logWaitMin:10,staleRingingMin:60,health:{lagYellowMs:8000,fullYellow:.9,fullRed:.6,minCalls:5},autoStatusOnCancel:false,
 districts:[[1,'Scrapyard',1,1],[2,'Industrial Zone',2,1.2],[3,'Neon Docks',2,1.45],[4,'Night Market',3,1.75],[5,'Commercial Hub',3,2.1],[6,'Chrome Plaza',3,2.5],
  [7,'Cyber-Downtown',4,3],[8,'Financial Spire',4,3.6],[9,'Sky District',4,4.3],[10,'Aerospace Ring',5,5.2],[11,'Orbital Station',5,6.2],[12,'The Summit',5,7.5]]
};
// [название (как в таблице), класс, клавиша дайлера]. Порядок = индексы ST в дайлере.
export const STATUS=[
 ['Автоответчик: Были гудки','TRASH','1'],['Автоответчик: Не перезванивать','TRASH','2'],['Owner hung up в начале','TALK','3'],
 ['Owner pitched & Hang Up','TALK','4'],['CALL BOOKED','BOOKED','5'],['GATEKEEPER','GATEKEEPER','6'],['Другое','MINOR','7'],
 ['Автоответчик (leaved vm)','TRASH','8'],['Menu (=not owner mobile number)','TRASH','9'],['Не соединяет','TRASH','0'],
 ['Номер не рабочий','TRASH','Q'],['Непонятная хуйня','MINOR','W'],['Call back','CALLBACK','E'],['Follow up in future','CALLBACK','R'],
 ['CONDUCTED DISCOVERY CALL','DISCOVERY','T']].map(([name,cls,key],id)=>({id,name,cls,key}));
export const classOf=name=>(STATUS.find(s=>s.name===name)||{cls:'MINOR'}).cls; // новый статус = MINOR
export const districtThr=d=>{const x=CONFIG.districts[d-1];return Math.round(x[2]*CONFIG.assumedDailyXp*x[3])};
STATUS[2].min=3; // «Owner hung up в начале» короткий по природе: свой порог верификации (сек)
