// Only inspect predefined Hero card corners. Card backs never imply card identities.
export const heroCardCorners=[
 {rank:{x:.433,y:.722,w:.030,h:.054},suit:{x:.433,y:.774,w:.035,h:.047}},
 {rank:{x:.490,y:.722,w:.030,h:.054},suit:{x:.490,y:.774,w:.035,h:.047}}
];
export function rankFromText(text,confidence){const clean=text.toUpperCase().replace(/\s/g,'');return confidence>=45&&/^(?:[AKQJT2-9]|10)$/.test(clean)?clean==='10'?'T':clean:null;}
export function suitFromPixels(rgba,width,height){
 const dark=[],red=[];let white=0;
 for(let p=0;p<width*height;p++){const i=p*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];if(r>205&&g>205&&b>205)white++;if(Math.max(r,g,b)<145)dark.push(p);else if(r>135&&r>g*1.4&&r>b*1.3)red.push(p);}
 if(white/(width*height)<.42)return {suit:null,reason:'Нет достаточно светлого фона карты'};
 const pixels=red.length>dark.length?red:dark,isRed=pixels===red;if(pixels.length<width*height*.07||pixels.length>width*height*.7)return {suit:null,reason:'Не выделен символ масти'};
 let x0=width,x1=0,y0=height,y1=0;for(const p of pixels){const x=p%width,y=Math.floor(p/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const w=x1-x0+1,h=y1-y0+1;if(w<4||h<5||w/h<.45||w/h>1.5)return {suit:null,reason:'Неясная форма символа'};
 const bands=Array(5).fill(0);for(const p of pixels){const y=Math.floor(p/width);bands[Math.min(4,Math.floor((y-y0)/h*5))]++;}const fractions=bands.map(v=>v/pixels.length);
 // A diamond is symmetric and widest in its middle; a heart is top-heavy.
 if(isRed){if(fractions[2]>.27&&fractions[0]<.14&&fractions[4]<.14)return {suit:'d',reason:'Красный ромб; проверьте'};if(fractions[0]>.13&&fractions[1]>.22&&fractions[4]<.14)return {suit:'h',reason:'Красное сердце; проверьте'};}
 // A spade grows from a pointed top. Clubs have a rounded upper lobe.
 else{if(fractions[0]<.11&&fractions[2]+fractions[3]>.54&&fractions[4]<.18)return {suit:'s',reason:'Чёрная пика; проверьте'};if(fractions[0]>.13&&fractions[1]>.16&&fractions[3]>.17&&fractions[4]<.18)return {suit:'c',reason:'Чёрный трилистник; проверьте'};}
 return {suit:null,reason:'Неоднозначный символ; выберите масть вручную'};
}
export function combineCards(readings){
 const cards=readings.map(r=>r.rank&&r.suit?r.rank+r.suit:null);if(cards[0]&&cards[0]===cards[1])return [null,null];return cards;
}
