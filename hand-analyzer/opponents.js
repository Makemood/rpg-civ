export const playerKey=(h,name)=>JSON.stringify([h.tournamentId,name]);
export function opponentProfiles(hands){
 const result=new Map();
 for(const h of hands){
  const pre=h.streets.find(s=>s.name==='Префлоп')?.actions||[],posts=h.streets.find(s=>s.name==='Блайнды')?.actions||[];
  for(const player of h.players||[]){
   if(player.name==='Hero')continue;
   const acts=pre.filter(a=>a.name===player.name),posted=posts.some(a=>a.name===player.name&&a.type==='posts');if(!acts.length&&!posted)continue;
   const key=playerKey(h,player.name);
   if(!result.has(key))result.set(key,{key,name:player.name,tournament:h.tournament,tournamentId:h.tournamentId,hands:0,vpipCount:0,pfrCount:0,threeOpp:0,threeCount:0});
   const p=result.get(key);p.hands++;if(acts.some(a=>['calls','raises','bets'].includes(a.type)))p.vpipCount++;if(acts.some(a=>a.type==='raises'))p.pfrCount++;
   if(acts.some(a=>a.raisesBefore===1&&['calls','raises','folds'].includes(a.type)))p.threeOpp++;
   if(acts.some(a=>a.raisesBefore===1&&a.type==='raises'))p.threeCount++;
  }
 }
 for(const p of result.values()){p.vpip=100*p.vpipCount/p.hands;p.pfr=100*p.pfrCount/p.hands;p.threeBet=p.threeOpp?100*p.threeCount/p.threeOpp:null;}
 return result;
}
export function classifyPlayer(p,manual=''){
 if(manual)return {type:manual,label:({reg:'Рег',fish:'Фиш',whale:'Кит',unknown:'Неизвестно'})[manual]||'Неизвестно',source:'Ваша метка',tip:manual==='reg'?'Не предполагайте, что соперник всегда играет оптимально. Проверяйте конкретные частоты.':manual==='fish'?'Ищите наблюдаемый перекос: частые коллы, лимпы или лишнюю агрессию. Подстраивайтесь под него, а не под ярлык.':manual==='whale'?'Если соперник действительно часто коллирует, отдавайте приоритет велью. Баунти всё равно не оправдывает любой колл.':'Наблюдайте за действиями; готовых подстроек пока нет.'};
 if(!p||p.hands<100)return {type:'unknown',label:'Мало данных',source:`${p?.hands||0} из 100 раздач для гипотезы`,tip:'Ручную метку можно поставить по наблюдениям. Статистика на небольшой выборке нестабильна.'};
 const gap=p.vpip-p.pfr;
 if(p.vpip>=65&&gap>=35)return {type:'whale',label:'Похож на кита',source:'Авто · гипотеза',tip:'Очень широкий и преимущественно пассивный вход. Проверьте, сохраняются ли частые коллы постфлоп; тогда чаще ставьте на велью и реже блефуйте.'};
 if(p.vpip>=40&&gap>=20)return {type:'fish',label:'Похож на фиша',source:'Авто · гипотеза',tip:'Широкий вход с большим разрывом VPIP/PFR. Проверьте лимпы и коллы; изолируйте в позиции с руками, которые хорошо играют на велью.'};
 if(p.vpip>=15&&p.vpip<=32&&p.pfr>=12&&gap<=8)return {type:'reg',label:'Похож на рега',source:'Авто · гипотеза',tip:'Частоты похожи на дисциплинированную префлоп-игру. Этого недостаточно для оценки силы; ищите конкретные отклонения.'};
 return {type:'unknown',label:'Тип не определён',source:'Авто · нет ясного паттерна',tip:'Частоты не попадают в заданные шаблоны. Не считайте агрессивного игрока фишом только за высокий VPIP.'};
}
