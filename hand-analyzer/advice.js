// Coaching heuristics use observable actions, never hidden ranges or the hand result.
const f=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:1});
export const topics={
 sb:{title:'Коллы из SB против рейза',why:'Вы будете играть без позиции; BB ещё может сделать сквиз. Офсьютным бродвеям трудно реализовать эквити против сильного диапазона.',practice:'Перед коллом из SB назовите причину: цена, диапазон открывшегося и план против сквиза. Для спорных рук отдельно сравните 3-бет и фолд. Не заменяйте все коллы автоматическим 3-бетом.'},
 overcall:{title:'Офсьютный бродвей в мультивей-банке',why:'Когда рейз уже заколлировали, KJo, QJo, KTo, QTo и JTo часто попадают под доминацию. Дополнительный игрок ухудшает реализацию эквити.',practice:'Перед оверколлом проверьте позицию, размер рейза и игроков позади. Начните разбор с офсьютных бродвеев; низкая цена сама по себе не делает колл прибыльным.'},
 short:{title:'Небольшие рейзы при стеке ≤12 бб',why:'После рейза и колла остаётся мало пространства для постфлопа. При этом min-raise может быть частью хорошей стратегии — это не автоматическая ошибка.',practice:'До рейза запишите план против пуша: с чем рейз-колл, с чем рейз-фолд и что пушите сразу. Сравните варианты для позиции, анте и эффективного стека.'},
 raisefold:{title:'Рейз-фолд при стеке ≤20 бб',why:'Вы вкладываете заметную долю короткого стека и затем сдаётесь. Это повод проверить план открытия, а не доказательство, что фолд был плохим.',practice:'Разберите диапазон рестила соперника и цену колла. Если заранее планировали фолд на частый пуш, сравните открытие с фолдом или собственным пушем.'},
 limp:{title:'Лимп вне малого блайнда',why:'Лимп оставляет инициативу соперникам и приглашает мультивей. На SB и в некоторых баунти-ситуациях лимп может быть нормальной частью стратегии.',practice:'Для каждого такого лимпа сформулируйте, почему он лучше рейза или фолда. Не добавляйте слабую руку только ради дешёвого флопа; учтите вероятность изолейта.'},
 allin:{title:'Решения против олл-ина',why:'Цена колла зависит от банка и оставшегося стека. Сам факт баунти не делает любой колл выгодным; нужно знать награду и покрываете ли вы соперника.',practice:'Сначала посчитайте чиповую цену колла, затем сравните эквити против предполагаемого диапазона. Баунти и ICM рассматривайте отдельно; приложение не знает их денежной стоимости.'},
 postflop:{title:'Постфлоп-коллы: проверка цены',why:'Шансы банка задают ориентир по эквити, но не определяют ответ без диапазона соперника. На флопе и тёрне возможны будущие ставки.',practice:'Перед коллом назовите руки, которые бьёте, и возможные улучшения. Не считайте все ауты чистыми. На ривере проверьте, достаточно ли блефов в диапазоне соперника.'},
 isolation:{title:'Изолейты слабой руки против лимпа',why:'Слабая разномастная рука или низкий одномастный мусор плохо играют против нескольких коллеров. Глубокий стек сам по себе не оправдывает изолейт.',practice:'Оцените, как часто лимпер сдаётся, есть ли позиция и кто ещё войдёт в банк. Не расширяйте изолейт только потому, что лимпер выглядит слабым.'}
};
export function handClass(cards){const order='23456789TJQKA';const [a,b]=cards;if(!a||!b)return '?';const r=[a[0],b[0]].sort((x,y)=>order.indexOf(y)-order.indexOf(x));return r[0]===r[1]?r.join(''):r.join('')+(a.at(-1)===b.at(-1)?'s':'o');}
export function analyzeHand(h){
 if(/Flip\s*&\s*Go/i.test(h.tournament))return [];
 const notes=[],pre=h.streets.find(s=>s.name==='Префлоп')?.actions||[],hc=handClass(h.cards);let heroRaised=false;
 const add=(key,street,evidence,task)=>{if(!notes.some(n=>n.key===key&&n.street===street))notes.push({key,street,title:topics[key].title,evidence,task:task||topics[key].practice});};
 for(const a of pre.filter(a=>a.name==='Hero'&&['calls','raises','folds','checks'].includes(a.type))){
  if(a.type==='calls'&&a.raisesBefore>0&&h.position==='SB')add('sb','Префлоп',`${hc}, SB, стек ${f(h.stack)} бб. Колл ${f(a.amount/h.bb)} бб против рейза.`);
  if(a.type==='calls'&&a.raisesBefore>0&&a.callersAfterRaise>0&&['KJo','QJo','KTo','QTo','JTo'].includes(hc))add('overcall','Префлоп',`${hc}: колл ${f(a.amount/h.bb)} бб после рейза и ${a.callersAfterRaise} колла(ов).`);
  if(a.type==='raises'&&h.stack<=12&&!a.allIn)add('short','Префлоп',`Стек ${f(h.stack)} бб, рейз до ${f(a.raiseTo/h.bb)} бб без олл-ина.`);
  if(a.type==='folds'&&heroRaised&&h.stack<=20)add('raisefold','Префлоп',`Стек в начале ${f(h.stack)} бб; после своего рейза Hero выбросил на дальнейшую агрессию.`);
  if(a.type==='calls'&&a.raisesBefore===0&&!['SB','BB','BTN/SB','?'].includes(h.position))add('limp','Префлоп',`${hc}, ${h.position}: вход коллом без предшествующего рейза.`);
  if(a.type==='raises'&&a.raisesBefore===0&&pre.slice(0,pre.indexOf(a)).some(x=>x.type==='calls')&&['T2s','T3s','J2s','Q2s','K2o','Q3o','J4o','T4o'].includes(hc))add('isolation','Префлоп',`${hc}, ${h.position}: рейз до ${f(a.raiseTo/h.bb)} бб против лимпа.`);
  if(a.type==='raises')heroRaised=true;
 }
 for(const s of h.streets){for(const a of s.actions){
  if(a.name!=='Hero'||!['calls','folds'].includes(a.type)||a.toCall<=0||!Number.isFinite(a.eligiblePot))continue;
  const paid=a.type==='calls'?a.amount:a.toCall,price=100*paid/(a.eligiblePot+paid);
  const evidence=`${a.type==='calls'?'Колл':'Фолд на ставку'}: ${f(paid/h.bb)} бб при банке ${f(a.eligiblePot/h.bb)} бб до колла. Чиповый ориентир по эквити ${f(price)}%.${a.opponents>1?' Мультивей: показатель приблизительный, возможны побочные банки и действия позади.':''}`;
  if(a.facingAllIn)add('allin',s.name,evidence,`Необходимое эквити ≈ цена колла / (банк до колла + цена колла). Здесь ${f(paid/h.bb)} / (${f(a.eligiblePot/h.bb)} + ${f(paid/h.bb)}) ≈ ${f(price)}%. Сравните с эквити ${hc} против диапазона пуша. Это порог без баунти и ICM, а не оценка «колл/фолд правильный».`);
  else if(s.name!=='Префлоп'&&a.type==='calls')add('postflop',s.name,evidence);
 }}
 return notes;
}
export function coachingReport(hands){
 const map=new Map();for(const h of hands){const seen=new Set();for(const note of h.advice||analyzeHand(h)){if(seen.has(note.key))continue;seen.add(note.key);if(!map.has(note.key))map.set(note.key,{key:note.key,...topics[note.key],hands:[],net:0});const g=map.get(note.key);g.hands.push(h);g.net+=h.result;}}
 const broad=key=>['allin','postflop'].includes(key)?1:0;
 return [...map.values()].sort((a,b)=>broad(a.key)-broad(b.key)||b.hands.length-a.hands.length).map(g=>({...g,per1000:hands.length?1000*g.hands.length/hands.length:0,examples:[...g.hands].sort((a,b)=>a.result-b.result).slice(0,3),months:[...new Set(hands.map(h=>h.date.slice(0,7)).filter(Boolean))].sort().map(month=>{const total=hands.filter(h=>h.date.startsWith(month)).length,count=g.hands.filter(h=>h.date.startsWith(month)).length;return {month,count,per1000:1000*count/total};})}));
}
