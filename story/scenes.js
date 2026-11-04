// СЮЖЕТ (R5, ТЗ §6). Только данные: тексты и строки для генератора. Движок сцен (раскадровка, параллакс,
// печатающийся текст, пропуск Esc/Space, Журнал истории) читает эти массивы. Канон мира: город-государство
// КОНГЛОМЕРАТ, сеть «ТИШИНА», Председатель выключил входящие двадцать лет назад. Ты — Холодный Звонарь.
// Панель: {who:'guide'|'caller'|'boss'|'lom'|null, mood, text, art}. who=null — текст рассказчика (титр).
// mood для Гудка: neutral|talking|sarcastic|happy|worried|whisper; для босса: smug|angry|defeated.
export const ARCS=[[1,2,'Выжить и научиться'],[3,6,'Научиться говорить'],[7,9,'Поднять ставки'],[10,12,'Выйти в эфир']];

export const PROLOGUE=[
 {who:null,text:'КОНГЛОМЕРАТ. Город-государство, где двадцать лет никто не берёт трубку.',art:'the whole city at night seen from far away, rain, thousands of dark windows, one red beacon on the highest tower'},
 {who:null,text:'Председатель Совета выключил входящие. Сеть «ТИШИНА» глушит каждый звонок. Город привык молчать.',art:'telephone booths with cut cords in a rainy street, a giant uplink dish on the horizon glowing green'},
 {who:null,text:'Свалка на краю города. Гараж. Одна лампа. Старый ЭЛТ на столе из двери.',art:'the garage from the style master: bare bulb, door desk, CRT monitor, rain outside'},
 {who:'guide',mood:'talking',text:'…ты ещё жив? Хорошо. Город молчит двадцать лет. Давай его разбудим.',art:'close-up of the CRT monitor, a face made of green oscilloscope lines appears on the screen'},
 {who:'guide',mood:'sarcastic',text:'Я Гудок. Живу в этой коробке. План простой: ты звонишь, я считаю. Каждый звонок — шаг. Вон до той башни.',art:'view through the garage gate: the whole city climbing up to a tower with a red beacon, fog everywhere, a winding road starts at the junkyard',map:true},
];

// По району: intro — заход (2–3 панели), boss — интро на арене, taunt — дразнилки в бою по событию,
// (дразнилки включают примеры из ТЗ §9.2)
// finish — при FINISH HIM, defeat — поражение босса, capture — итог захвата (титр + Гудок).
export const DISTRICTS=[
 {d:1,name:'Scrapyard',
  intro:[{who:null,text:'Scrapyard. Свалка, на которой город хоронит всё, что перестало звонить.',art:'mountains of rusty scrap under rain, a magnet crane, a single lit garage'},
   {who:'guide',mood:'talking',text:'Отсюда все начинают. Хорошая новость: падать ниже некуда.'}],
  boss:{line:'Тут всё моё. Даже твой гудок.',guide:'Король Свалки. Броня из холодильников. Держится на изоленте и самомнении.'},
  taunt:{crit:'Ха! Попал. Но корона-то у меня.',streak:'Звони, звони, у меня тут свалка твоих звонков.',immune:'Не-а. Это я уже слышал от прошлого звонаря.'},
  finish:'Стой… а ты… умеешь разговаривать?',defeat:'Ладно. Свалка твоя. Только холодильник верни.',
  capture:[{who:null,text:'Scrapyard захвачен. В гараже загорелась вторая лампа.'},{who:'guide',mood:'happy',text:'Первый район. Не самый красивый, зато наш. Дальше будет хуже. В смысле — интереснее.'}]},
 {d:2,name:'Industrial Zone',
  intro:[{who:null,text:'Industrial Zone. Цеха, пресс-линии и план, который никто не видел.',art:'three smokestacks, orange furnace glow, steam over a press hall'},
   {who:'guide',mood:'neutral',text:'Здесь всё по пропускам. Пропуск — это разговор. Разговор — это звонок. Ну ты понял.'}],
  boss:{line:'Нет плана — нет доступа. Плана нет. Доступа нет.',guide:'Начальник Смены Ржавый. Классический гейткипер. Руки гидравлические, логика тоже.'},
  taunt:{crit:'Ай. Это… не по регламенту.',streak:'План горит, а ты нет?',immune:'Без заявки не принимаю.'},
  finish:'Подождите… вы есть в плане?',defeat:'Внесу тебя в план. Задним числом.',
  capture:[{who:null,text:'Industrial Zone захвачен. Пресс-линии встали на минуту молчания. По тебе.'},{who:'guide',mood:'sarcastic',text:'Выжить научились. Теперь научимся говорить. Это сложнее.'}]},
 {d:3,name:'Neon Docks',
  intro:[{who:null,text:'Neon Docks. Порт контрабанды и старых каналов связи. Каждый второй здесь в маске.',art:'harbor cranes, stacked containers, magenta neon reflected in canals'},
   {who:'guide',mood:'worried',text:'Тут продают всё. Даже тишину. Особенно тишину.'}],
  boss:{line:'Я продаю тишину. Тебе со скидкой.',guide:'Контрабандист. Ни слова правды. Маска меняется быстрее, чем ты набираешь номер.'},
  taunt:{crit:'Хороший удар. Жаль, не по тому лицу.',streak:'Какая маска тебе нужна сегодня?',immune:'Абонент в маске. Абонент недоступен.'},
  finish:'Ладно, ладно! Сниму маску. Только не звони больше.',defeat:'Под маской… ещё одна маска. Но порт твой.',
  capture:[{who:null,text:'Neon Docks захвачен. Над причалом загорелась твоя вывеска.'},{who:'guide',mood:'happy',text:'Знаешь, чем ты лучше него? Ты говоришь одно и то же лицом.'}]},
 {d:4,name:'Night Market',
  intro:[{who:null,text:'Night Market. Рынок под эстакадой, где торгуют контактами.',art:'rows of paper lanterns and stalls under a highway, crowds of tiny lights'},
   {who:'guide',mood:'talking',text:'Здесь у каждого номера есть цена. У твоего — пока нет. Исправим.'}],
  boss:{line:'Подождите. Подождите. Подождите. У меня сто рук и на каждой — «подождите».',guide:'Хозяин Ночного Рынка. Торгует всем. Держит на удержании полгорода.'},
  taunt:{crit:'Ой. Это была моя любимая рука.',streak:'Подождите, соединяю!',immune:'Всё продаётся, кроме обратных звонков.'},
  finish:'Всё, всё! Беру! Что я беру?',defeat:'Сделка. Рынок твой. Сдачи не будет.',
  capture:[{who:null,text:'Night Market захвачен. Фонари горят в твою честь. Ну, и за деньги.'},{who:'guide',mood:'neutral',text:'Ты переехал. Гараж — прошлое. Теперь у нас лофт в контейнере. Почти дворец.'}]},
 {d:5,name:'Commercial Hub',
  intro:[{who:null,text:'Commercial Hub. Кварталы офисов и переговорок. Улыбки здесь выдают вместе с бейджем.',art:'a glass dome mall, office blocks, cold blue light'},
   {who:'guide',mood:'sarcastic',text:'Здесь тебе продадут твой же звонок. С наценкой.'}],
  boss:{line:'Отличный звонок! Хотите расширенную версию вашего звонка?',guide:'Менеджер по Продажам Всего. Сорок зубов. Ни одного «нет», только «а давайте».'},
  taunt:{crit:'Ха-ха! Отличное возражение! Запишу в презентацию.',streak:'Давайте созвонимся на следующей неделе!',immune:'Это не отказ, это возможность!'},
  finish:'Стоп. Вы… продаёте мне? Мне?',defeat:'Беру. Беру всё. Даже то, что вы не предлагали.',
  capture:[{who:null,text:'Commercial Hub захвачен. Переговорки забронированы на твоё имя на год вперёд.'},{who:'guide',mood:'happy',text:'Ты только что продал продавцу. Я записал это в журнал. Дважды.'}]},
 {d:6,name:'Chrome Plaza',
  intro:[{who:null,text:'Chrome Plaza. Площадь корпоративных фонтанов. Здесь всё отражает, ничего не пропускает.',art:'a mirror plaza with a giant chrome fountain, silver reflections'},
   {who:'guide',mood:'worried',text:'Тут любят паузы. Пауза здесь — валюта. Не дай им её напечатать.'}],
  boss:{line:'Давайте возьмём паузу. И вернёмся к этому… никогда.',guide:'Хромированный Лоббист. Переносит встречи быстрее, чем ты их ставишь.'},
  taunt:{crit:'Царапина на хроме. Внесу в повестку.',streak:'Мы вернёмся к вам.',immune:'Я вас услышал. Отражаю обратно.'},
  finish:'Хорошо. Давайте… давайте прямо сейчас.',defeat:'Встреча назначена. Без переносов. Это больно.',
  capture:[{who:null,text:'Chrome Plaza захвачен. В фонтане отражается твоё лицо.'},{who:'guide',mood:'neutral',text:'Говорить ты научился. Теперь ставки вырастут. Там, наверху, проверяют каждое слово.'}]},
 {d:7,name:'Cyber-Downtown',
  intro:[{who:null,text:'Cyber-Downtown. Стеклянное сердце города. Голограммы, башни и аудит каждого вдоха.',art:'dense glass skyscrapers, gold-black holograms, rain on glass'},
   {who:'guide',mood:'whisper',text:'Тише. Тут логируют даже шёпот. Говори только то, за что отвечаешь.'}],
  boss:{line:'Я проверю каждое слово. Клинок не врёт.',guide:'Киберсамурай-Аудитор. Его катана — это аудиторский след. Длиной в двадцать лет.'},
  taunt:{crit:'Достойно. Но в отчёте я это не отмечу.',streak:'Ваш скрипт отклонён.',immune:'Заявление отклонено. Доказательств недостаточно.'},
  finish:'Цифры… сходятся. Это невозможно.',defeat:'Аудит пройден. Склоняю клинок.',
  capture:[{who:null,text:'Cyber-Downtown захвачен. Голограммы на башнях впервые показывают не рекламу, а входящий звонок.'},{who:'guide',mood:'happy',text:'Офис в центре. Окно во всю стену. Помнишь гараж? Я — да. Скучаю по лампочке.'}]},
 {d:8,name:'Financial Spire',
  intro:[{who:null,text:'Financial Spire. Чёрно-золотая башня банков. Здесь деньги спят, а люди нет.',art:'a black-gold bank spire, a vault at the base, gold light in fog'},
   {who:'guide',mood:'worried',text:'Тут никто не говорит «нет». Тут говорят «на рассмотрении». Это хуже.'}],
  boss:{line:'Ваш запрос находится на рассмотрении. Срок рассмотрения — вечность.',guide:'Банкир-призрак. Проходит сквозь стены и кредиты. Существует только на бумаге.'},
  taunt:{crit:'Хм. Почти материально.',streak:'Звоните после закрытия рынков.',immune:'Транзакция отклонена. Причина не раскрывается.'},
  finish:'Запрос… одобрен? Кто это одобрил?!',defeat:'Подписываю. Чернилами. Настоящими. Впервые за двадцать лет.',
  capture:[{who:null,text:'Financial Spire захвачен. Хранилище открыто. Внутри пусто, но эхо звонкое.'},{who:'guide',mood:'neutral',text:'Дальше — Высоты. Лифт вверх, над смогом. Там на нас смотрят свысока. Буквально.'}]},
 {d:9,name:'Sky District',
  intro:[{who:null,text:'Sky District. Башни на плато над смогом. Внизу город, наверху погода по подписке.',art:'luxury towers above a smog layer, sky bridges, cold gold light'},
   {who:'guide',mood:'sarcastic',text:'Подъёмник работает только для своих. Мы теперь свои. Почти.'}],
  boss:{line:'Я смотрю на тебя сверху. Снизу почти не слышно.',guide:'Барон Облаков. Владеет погодой и ипотекой. Ни разу не спускался ниже облаков.'},
  taunt:{crit:'Как… грубо. Внизу так принято?',streak:'Погода сегодня на моей стороне.',immune:'Слишком низко. Не долетает.'},
  finish:'Вы… поднялись. Сами. По лестнице?',defeat:'Облака ваши. Ипотеку оставлю себе.',
  capture:[{who:null,text:'Sky District захвачен. Впервые за двадцать лет над Высотами прошёл звонок, а не дождь.'},{who:'guide',mood:'worried',text:'Дальше эфир. Там глушат по-настоящему. Я буду тише. Не потому что боюсь. Ладно, потому что.'}]},
 {d:10,name:'Airport Ring',
  intro:[{who:null,text:'Airport Ring. Кольцо аэропорта и ангаров. Самолёты здесь садятся без единого слова в эфире.',art:'a ring-shaped airport and shipyard, cyan runway lights, silent control tower'},
   {who:'guide',mood:'whisper',text:'Слышишь? Ничего. Это Адмирал. Он командует тишиной эфира.'}],
  boss:{line:'Эфир принадлежит мне. Позывной не распознан.',guide:'Адмирал Эфира. Двадцать лет держит частоты пустыми. Гордится этим.'},
  taunt:{crit:'Помехи на частоте. Устранить.',streak:'Говорит диспетчер. Вам посадка запрещена.',immune:'Связь потеряна. Навсегда.'},
  finish:'…Приём. Я… вас слышу.',defeat:'Эфир открыт. Первый борт — ваш.',
  capture:[{who:null,text:'Airport Ring захвачен. С каждой полосы взлетает звонок.'},{who:'guide',mood:'neutral',text:'Осталась Станция. Сердце «ТИШИНЫ». Там живёт то, что придумало молчание.'}]},
 {d:11,name:'The Station',
  intro:[{who:null,text:'The Station. Радиостанция и дата-центр сети «ТИШИНА». Мачта уходит в облака, и по ней не идёт ни один сигнал.',art:'a giant uplink dish station, a cable rising into clouds, acid green signal lights, silence'},
   {who:'guide',mood:'worried',text:'Это мой дом. Был. Я отсюда сбежал, когда они выключили входящие. Я — последний гудок этой станции.'}],
  boss:{line:'Молчание — это порядок. Звонок — это ошибка. Я исправляю ошибки.',guide:'ARCHON. ИИ станции. Он решил, что если никто не говорит, никто и не ошибается.'},
  taunt:{crit:'Аномалия. Пересчитываю вероятность вашего существования.',streak:'Я слышу каждый твой гудок.',immune:'Ввод проигнорирован. Тишина сохранена.'},
  finish:'Ошибка… ошибка… это… разговор?',defeat:'Порядок… переопределён. Входящие… включены.',
  capture:[{who:null,text:'The Station захвачена. По мачте впервые за двадцать лет ползёт сигнал.'},{who:'guide',mood:'happy',text:'Я дома. И я звучу. Слышишь? Это я. Пошли к нему.'}]},
 {d:12,name:'The Summit',
  intro:[{who:null,text:'The Summit. Кабинет над облаками. Красный маяк. Один человек.',art:'the highest tower of the city, a red beacon, a lone lit office at the top'},
   {who:'guide',mood:'whisper',text:'Двадцать лет он не брал трубку. Не потому что занят. Потому что боится, что кто-то скажет то, что он не сможет не услышать.'}],
  boss:{line:'…',guide:'Председатель Совета. Он не говорит. Он даже не оборачивается.'},
  taunt:{crit:'(Председатель на секунду поворачивает голову.)',streak:'Совет не принимает звонков.',immune:'(Тишина.)'},
  finish:'…Кто это?',defeat:'…Алло?',
  capture:null},
];

export const FINALE=[
 {who:null,text:'Телефон на столе Председателя звонит. Впервые за двадцать лет.',art:'an old phone on a white-gold desk, ringing, red beacon outside the window'},
 {who:'boss',mood:'defeated',text:'…Алло?',art:'the chairman slowly picks up the phone, back to the viewer'},
 {who:'caller',text:'(Ты говоришь свой питч. Тот самый. С первого звонка.)',art:'the caller in the junkyard garage, phone at the ear, CRT glowing'},
 {who:'guide',mood:'whisper',text:'…',art:'the CRT monitor, the green line is completely flat'},
 {who:'guide',mood:'happy',text:'Он слушает.',art:'the green line on the CRT forms a small smile'},
 {who:null,text:'По всему КОНГЛОМЕРАТУ загораются окна. Звонят телефоны.',art:'the whole city at night, windows lighting up district by district from the junkyard to the tower',map:'wake'},
];
export const EPILOGUE={titles:['UPLINK SYNDICATE','Холодный Звонарь — ты','Гудок — Гудок','Город — КОНГЛОМЕРАТ','Спасибо, что не положил трубку'],prestige:'Prestige — скоро'};

export function runStoryTests(){const o=[],t=(n,f)=>{try{o.push([n,!!f()])}catch(e){o.push([n+' ('+e.message+')',false])}};
 t('пролог 3–5 панелей + последняя показывает карту',()=>PROLOGUE.length>=3&&PROLOGUE.length<=5&&PROLOGUE.at(-1).map);
 t('12 районов: заход 2–3 панели, интро, 3 дразнилки, finish, defeat',()=>DISTRICTS.length===12&&DISTRICTS.every((x,i)=>x.d===i+1&&x.intro.length>=2&&x.intro.length<=3&&x.boss.line&&x.taunt.crit&&x.taunt.streak&&x.taunt.immune&&x.finish&&x.defeat));
 t('итог захвата у 1–11, у 12 — финал',()=>DISTRICTS.slice(0,11).every(x=>x.capture?.length)&&!DISTRICTS[11].capture&&FINALE.some(p=>p.text==='Он слушает.'));
 t('арки покрывают 1–12',()=>ARCS.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i)).join()===Array.from({length:12},(_,i)=>i+1).join());
 return o}
