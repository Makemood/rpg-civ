// Normalized regions for the supplied GGPoker 8-max window layout.
// These are layout coordinates, never remembered player identities or actions.
export const ggSeats=[
 {label:'Снизу (Hero)',x:.432,y:.845,w:.142,h:.080,button:[.5,.785]},
 {label:'Слева снизу',x:.150,y:.720,w:.128,h:.085,button:[.25,.71]},
 {label:'Слева',x:.018,y:.482,w:.135,h:.085,button:[.14,.50]},
 {label:'Слева сверху',x:.175,y:.260,w:.130,h:.083,button:[.25,.37]},
 {label:'Сверху',x:.433,y:.208,w:.132,h:.085,button:[.50,.29]},
 {label:'Справа сверху',x:.720,y:.260,w:.130,h:.083,button:[.78,.37]},
 {label:'Справа',x:.860,y:.482,w:.125,h:.085,button:[.85,.50]},
 {label:'Справа снизу',x:.721,y:.720,w:.130,h:.085,button:[.75,.71]}
];
export const ggPot={x:.400,y:.374,w:.252,h:.054};
export const ggSixSeats=[
 {label:'Снизу (Hero)',x:.438,y:.846,w:.135,h:.080,button:[.50,.725]},
 {label:'Слева снизу',x:.056,y:.690,w:.125,h:.081,button:[.22,.69]},
 {label:'Слева сверху',x:.080,y:.293,w:.125,h:.078,button:[.23,.35]},
 {label:'Сверху',x:.435,y:.205,w:.135,h:.080,button:[.50,.29]},
 {label:'Справа сверху',x:.792,y:.293,w:.140,h:.078,button:[.772,.35]},
 {label:'Справа снизу',x:.825,y:.690,w:.128,h:.081,button:[.77,.69]}
];
export const ggLayouts={gg8:{seats:ggSeats,pot:ggPot},gg6:{seats:ggSixSeats,pot:{x:.400,y:.359,w:.235,h:.055}}};
export function parseSeatPatch(text){
 const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
 const found=text.match(/(?:^|\s)(\d{1,4}(?:[.,]\d{1,2})?)(?:\s*(?:BB|B8|8B)|\s+88)(?:\s|$)/i);
 const stack=found?{value:Number(found[1].replace(',','.')),unit:'bb'}:null;
 const actionLine=lines.find(x=>/^(fold|folds|check|checks|call|calls|bet|bets|raise|raises|all[ -]?in)(?:\s+[\d.,]+\s*(?:BB)?)?$/i.test(x));
 const name=lines.find(x=>!(found&&x.includes(found[0].trim()))&&!/^\$?\d+(?:[.,]\d+)?$/.test(x)&&x!==actionLine&&/^[\p{L}\p{N}_ .-]{2,32}$/u.test(x))||null;
 return {name,stack,visibleAction:actionLine||null};
}
export function parsePotPatch(text){
 const m=text.match(/(\d{1,5}(?:[.,]\d{1,2})?)(?:\s*(?:BB|B8|8B)|\s+88)(?:\s|$)/i);return m?{value:Number(m[1].replace(',','.')),unit:'bb'}:null;
}
export function seatPositions(dealer,occupied=8){
 if(!Number.isInteger(dealer)||dealer<0||dealer>7||occupied!==8)return null;
 const names=['BTN','SB','BB','UTG','UTG+1','LJ','HJ','CO'];return ggSeats.map((_,i)=>names[(i-dealer+8)%8]);
}
export function occupiedPositions(dealer,seats){
 const live=seats.filter(s=>s.name&&s.stack),indices=live.map(s=>s.index),at=indices.indexOf(dealer);if(at<0||live.length<2||live.length>8)return null;
 const labels={2:['BTN/SB','BB'],3:['BTN','SB','BB'],4:['BTN','SB','BB','CO'],5:['BTN','SB','BB','HJ','CO'],6:['BTN','SB','BB','UTG','HJ','CO'],7:['BTN','SB','BB','UTG','LJ','HJ','CO'],8:['BTN','SB','BB','UTG','UTG+1','LJ','HJ','CO']}[live.length];
 const result=seats.map(()=>null);for(let i=0;i<live.length;i++)result[indices[(at+i)%live.length]]=labels[i];return result;
}
export function dealerCandidate(rgba,width,height,layout=ggSeats){
 const seen=new Uint8Array(width*height),scale=width/582,minimum=Math.max(4,Math.floor(35*scale*scale)),candidates=[];
 const yellow=p=>{const i=p*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];return r>170&&g>145&&b<115&&r/g<1.48;};
 for(let y=Math.floor(height*.25);y<height*.79;y++)for(let x=Math.floor(width*.10);x<width*.90;x++){
  const start=y*width+x;if(seen[start]||!yellow(start))continue;const queue=[start];seen[start]=1;let minX=x,maxX=x,minY=y,maxY=y;
  for(let at=0;at<queue.length;at++){const p=queue[at],px=p%width,py=Math.floor(p/width);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);for(const next of [px>0?p-1:-1,px+1<width?p+1:-1,py>0?p-width:-1,py+1<height?p+width:-1])if(next>=0&&!seen[next]&&yellow(next)){seen[next]=1;queue.push(next);}}
  const w=maxX-minX+1,h=maxY-minY+1;if(queue.length<minimum||w<6*scale||w>22*scale||h<6*scale||h>22*scale||w/h<.65||w/h>1.5)continue;
  const cx=(minX+maxX)/2/width,cy=(minY+maxY)/2/height;const matches=layout.map((seat,index)=>({index,distance:Math.hypot(cx-seat.button[0],cy-seat.button[1])})).sort((a,b)=>a.distance-b.distance);if(matches[0].distance<.055)candidates.push(matches[0]);
 }
 return candidates.length===1?candidates[0].index:null;
}
export function tableFacts(readings,potText,confidence,dealer=null,layout='gg8'){
 const seats=readings.map((r,index)=>({index,...parseSeatPatch(r.text),confidence:r.confidence??0,raw:r.text}));
 const positions=occupiedPositions(dealer,seats);
 return {handId:null,pot:parsePotPatch(potText),call:null,stack:seats[0]?.stack||null,actions:[],table:{layout,seats,dealer,positions,confidence,cards:null,positionsTentative:true}};
}
