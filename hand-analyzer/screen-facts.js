const amountPattern='(?:[0-9][0-9,]*(?:\\.[0-9]+)?)';
const number=s=>Number(s.replace(/,/g,''));
export function screenFacts(text){
 const field=label=>{const m=text.match(new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:=]?\\s*\\$?(${amountPattern})\\s*(BB|chips)?\\s*(?:$|\\n)`,'i'));return m?{value:number(m[1]),unit:m[2]?.toUpperCase()==='BB'?'bb':'chips'}:null;};
 const actions=[];for(const line of text.split('\n')){const m=line.trim().match(new RegExp(`^([A-Za-z0-9_ .-]{1,32}):\\s*(folds|checks|calls|bets|raises|all-in)(?:\\s+\\$?(${amountPattern}))?(?:\\s+to\\s+(${amountPattern}))?(?:\\s+and is all-in)?\\s*$`,'i'));if(m)actions.push({player:m[1],action:m[2].toLowerCase(),amount:m[4]?number(m[4]):m[3]?number(m[3]):null,unit:'unknown'});}
 return {handId:text.match(/(?:Poker\s+)?Hand\s*#\s*([A-Za-z0-9_-]+)/i)?.[1]||null,pot:field('Pot|Total pot'),call:field('Call|To call'),stack:field('Stack|Hero stack'),actions};
}
export function screenMetrics(facts){
 const {pot,call,stack}=facts,metrics={};
 if(pot&&call&&pot.unit===call.unit&&pot.value>=0&&call.value>0)metrics.price=100*call.value/(pot.value+call.value);
 if(pot&&stack&&pot.unit===stack.unit&&pot.value>0)metrics.spr=stack.value/pot.value;
 return metrics;
}
export function appendObservation(log,observation){
 const previous=log.at(-1);if(previous&&previous.hand===observation.hand&&previous.text===observation.text)return {log,added:false};
 return {log:[...log,observation].slice(-200),added:true};
}
