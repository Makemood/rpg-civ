const num = s => Number(String(s ?? '0').replace(/,/g,''));
const money = '[\\d,]+(?:\\.\\d+)?';
export function parseHistory(text) {
  const chunks = text.replace(/\r/g,'').split(/(?=^(?:Poker|GGPoker) Hand #)/m).filter(x=>/^(?:Poker|GGPoker) Hand #/.test(x));
  const hands=[], errors=[];
  for(const raw of chunks){try{hands.push(parseHand(raw));}catch(e){errors.push(`${raw.split('\n')[0].slice(0,90)}: ${e.message}`);}}
  return {hands,errors};
}
export function parseHand(raw){
  const lines=raw.trim().split('\n');
  const header=lines[0],id=header.match(/Hand #([^:]+)/)?.[1];
  if(!id || !/Tournament #/.test(header) || !/Hold'em No Limit/.test(header)) throw Error('Поддерживаются турнирные раздачи No Limit Hold’em');
  const blinds=header.match(new RegExp(`\\((${money})/(${money})(?:\\((${money})\\))?\\)`));
  if(!blinds || !num(blinds[2]))throw Error('Не распознаны блайнды');
  const sb=num(blinds[1]),bb=num(blinds[2]),ante=num(blinds[3]);
  const dealt=raw.match(/Dealt to Hero \[([^\]]+)\]/); if(!dealt)throw Error('Нет карт Hero');
  const date=header.match(/\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}/)?.[0]||'';
  const tournamentId=header.match(/Tournament #([^, :]+)/)?.[1]||'';
  const tournament=header.split(/Tournament #[^,]+,\s*/)[1]?.split(/\s+Hold'em/)[0]||tournamentId;
  const seats=[];
  for(const line of lines){const m=line.match(new RegExp(`^Seat (\\d+): (.+) \\((${money}) in chips\\)`));if(m)seats.push({seat:+m[1],name:m[2],stack:num(m[3])});}
  const hero=seats.find(x=>x.name==='Hero'); if(!hero)throw Error('Нет места Hero');
  const button=+raw.match(/Seat #(\d+) is the button/)?.[1];
  const sorted=seats.sort((a,b)=>a.seat-b.seat);const at=sorted.findIndex(x=>x.seat===button);
  const order=at<0?[]:[...sorted.slice(at+1),...sorted.slice(0,at+1)];
  const labels=order.length===2?['BB','BTN/SB']:order.length===3?['SB','BB','BTN']:order.length===4?['SB','BB','CO','BTN']:order.length===5?['SB','BB','HJ','CO','BTN']:order.length===6?['SB','BB','UTG','HJ','CO','BTN']:order.length===7?['SB','BB','UTG','LJ','HJ','CO','BTN']:order.length===8?['SB','BB','UTG','UTG+1','LJ','HJ','CO','BTN']:['SB','BB','UTG','UTG+1','UTG+2','LJ','HJ','CO','BTN'];
  const positions=Object.fromEntries(order.map((x,i)=>[x.name,labels[i]||'?']));
  let street='Блайнды',contributions={},invested=0,collected=0,raises=0,voluntary=false,pfr=false,threeOpp=false,threeBet=false,preAggressor=null,cbetOpp=false,cbet=false,flopActed=false,flopBet=false;
  const streets=[],warnings=[],active=new Set(seats.map(s=>s.name)),opponentStacks=[],spent={},allIn=new Set();let pot=0,callersAfterRaise=0;
  function group(){let g=streets.find(x=>x.name===street);if(!g){g={name:street,board:'',actions:[]};streets.push(g);}return g;}
  for(const line of lines){
    if(line.startsWith('*** SUMMARY'))break;
    const marker=line.match(/^\*\*\* (HOLE CARDS|FLOP|TURN|RIVER|SHOW DOWN|SHOWDOWN)/);
    if(marker){street=({'HOLE CARDS':'Префлоп',FLOP:'Флоп',TURN:'Тёрн',RIVER:'Ривер','SHOW DOWN':'Шоудаун',SHOWDOWN:'Шоудаун'})[marker[1]];if(marker[1]!=='HOLE CARDS')contributions={};group().board=[...line.matchAll(/\[([^\]]+)\]/g)].map(x=>x[1]).join(' ');continue;}
    const won=line.match(new RegExp(`^Hero collected (${money}) from`));if(won)collected+=num(won[1]);
    const returned=line.match(new RegExp(`^Uncalled bet \\((${money})\\) returned to (.+)$`));if(returned){const value=num(returned[1]);pot-=value;spent[returned[2]]=(spent[returned[2]]||0)-value;if(returned[2]==='Hero')invested-=value;}
    const action=line.match(/^(.+?): (folds|checks|calls|bets|raises|posts|shows|doesn't show)(.*)$/);if(!action)continue;
    const [,name,type,tail]=action, isHero=name==='Hero',pre=street==='Префлоп';
    const highest=Math.max(0,...Object.values(contributions)),remaining=Math.max(0,hero.stack-(spent.Hero||0));
    const amountMatch=tail.match(new RegExp(`(${money})`));let amount=num(amountMatch?.[1]);
    const raiseTo=type==='raises'?num(tail.match(new RegExp(`to (${money})`))?.[1]):null;
    if(type==='raises')amount=raiseTo-(contributions[name]||0);
    const opponents=[...active].filter(n=>n!=='Hero');
    const faced=Math.min(remaining,Math.max(0,highest-(contributions.Hero||0)));
    const cap=(spent.Hero||0)+faced;
    const eligiblePot=faced===remaining&&remaining>0?Object.entries(spent).reduce((sum,[n,v])=>sum+(n==='Hero'?v:Math.min(v,cap)),0):pot;
    group().actions.push({name,position:positions[name]||'?',type,text:`${name} (${positions[name]||'?'}): ${type}${tail}`,amount,raiseTo,allIn:/all-in/.test(tail),potBefore:pot,eligiblePot,toCall:faced,remaining,raisesBefore:raises,callersAfterRaise,opponents:opponents.length,facingAllIn:opponents.some(n=>allIn.has(n)&&((contributions[n]||0)===highest)),board:group().board});
    if(pre&&isHero&&raises===1)threeOpp=true;
    if(pre&&isHero&&raises===1&&type==='raises')threeBet=true;
    if(pre&&type==='raises'){raises++;preAggressor=name;callersAfterRaise=0;}
    if(pre&&type==='calls'&&raises>0)callersAfterRaise++;
    if(pre&&isHero&&['calls','bets','raises'].includes(type)){voluntary=true;if(type==='raises')pfr=true;}
    if(street==='Флоп'){
      if(!isHero&&['bets','raises'].includes(type))flopBet=true;
      if(isHero&&!flopActed){cbetOpp=preAggressor==='Hero'&&!flopBet;cbet=cbetOpp&&type==='bets';flopActed=true;}
    }
    if(['calls','bets','raises','posts'].includes(type)){
      pot+=amount;spent[name]=(spent[name]||0)+amount;if(/all-in/.test(tail))allIn.add(name);
      if(isHero)invested+=amount;
      if(!/ante/.test(tail))contributions[name]=(contributions[name]||0)+amount;
    }
    if(pre&&isHero&&type==='raises'&&hero.stack/bb<=12&&!/all-in/.test(tail))warnings.push('Рейз при стеке ≤12 бб: сравните с пушем с учётом диапазонов и баунти. Сам по себе небольшой рейз не является ошибкой.');
    if(pre&&isHero&&type==='calls'&&raises>0&&positions.Hero==='SB')warnings.push('Колл из SB против рейза: разберите игру без позиции и альтернативы 3-бет/фолд. Для оценки нужен диапазон оппонента.');
    if(type==='folds')active.delete(name);
    if(pre&&isHero&&['calls','raises'].includes(type)){for(const s of seats)if(s.name!=='Hero'&&active.has(s.name))opponentStacks.push(s.stack);}
  }
  // Summary duplicates collection lines; use it only when collection lines are absent.
  if(!collected){const summary=raw.split('*** SUMMARY ***')[1]||'';for(const m of summary.matchAll(new RegExp(`^Seat \\d+: Hero[^\\n]*?(?:won|collected) \\((${money})\\)`,'gm')))collected+=num(m[1]);}
  const result=(collected-invested)/bb;
  const effective=opponentStacks.length?Math.min(hero.stack,Math.max(...opponentStacks))/bb:null;
  if(/Flip\s*&\s*Go/i.test(tournament))warnings.push('Flip & Go: автоматические выставления не оцениваются как решения.');
  const buyinParts=[...tournament.matchAll(/\$([\d.]+)/g)].map(x=>+x[1]);
  return {id,tournamentId,tournament,date,position:positions.Hero||'?',cards:dealt[1].split(/\s+/),sb,bb,ante,seats:seats.length,players:seats.map(s=>({...s,position:positions[s.name]||'?'})),maxSeats:+raw.match(/(\d+)-max/)?.[1]||seats.length,stack:hero.stack/bb,effective,result,invested,collected,vpip:voluntary,pfr,threeOpp,threeBet,cbetOpp,cbet,streets,warnings,buyin:buyinParts.length?buyinParts.reduce((a,b)=>a+b,0):null,bounty:/bounty|\bKO\b|knockout/i.test(tournament),raw};
}
export function summarize(hands){
  const sum=key=>hands.reduce((n,h)=>n+Number(h[key]),0),ratio=(a,b)=>b?100*a/b:null;
  return {count:hands.length,tournaments:new Set(hands.map(x=>x.tournamentId)).size,vpip:ratio(sum('vpip'),hands.length),pfr:ratio(sum('pfr'),hands.length),threeBet:ratio(sum('threeBet'),sum('threeOpp')),threeOpp:sum('threeOpp'),cbet:ratio(sum('cbet'),sum('cbetOpp')),cbetOpp:sum('cbetOpp'),result:sum('result'),bb100:ratio(sum('result'),hands.length)};
}
