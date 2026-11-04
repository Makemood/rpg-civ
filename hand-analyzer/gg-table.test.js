import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSeatPatch,parsePotPatch,seatPositions,occupiedPositions,dealerCandidate,tableFacts,ggSeats} from './gg-table.js';
import {rankFromText,suitFromPixels,combineCards} from './card-vision.js';
test('стек в BB отделяется от ника, десятичная запятая поддерживается',()=>{
 const seat=parseSeatPatch('Example_Player\n202,6 BB');assert.equal(seat.name,'Example_Player');assert.equal(seat.stack.value,202.6);assert.equal(parseSeatPatch('13 BB').name,null);
});
test('действие не выдаётся за ник или за изменение стека',()=>{
 assert.equal(parseSeatPatch('Fold\n16 BB').name,null);assert.equal(parseSeatPatch('Fold\n16 BB').visibleAction,'Fold');assert.equal(parseSeatPatch('Example\n16 BB').visibleAction,null);
});
test('банк читается по BB; отсутствие суммы остаётся неизвестным',()=>{
 assert.equal(parsePotPatch('Total: 2.7 BB').value,2.7);assert.equal(parsePotPatch('random text'),null);assert.equal(parsePotPatch('2.3 8B').value,2.3);assert.equal(parsePotPatch('2.3 88').value,2.3);
});
test('8-max: dealer справа сверху даёт Hero UTG',()=>{assert.equal(seatPositions(5)[0],'UTG');assert.equal(seatPositions(null),null);});
test('6-max с пустым верхним местом: 5 игроков, Hero BB',()=>{
 const seats=Array.from({length:6},(_,index)=>({index,name:index===3?null:'Player'+index,stack:index===3?null:{value:10,unit:'bb'}}));
 assert.deepEqual(occupiedPositions(4,seats),['BB','HJ','CO',null,'BTN','SB']);
});
test('жёлтый маркер — только кандидат, при отсутствии маркера dealer неизвестен',()=>{
 const w=582,h=436,rgba=new Uint8ClampedArray(w*h*4);for(let y=156;y<169;y++)for(let x=448;x<461;x++)if((x-454)**2+(y-162)**2<40){const p=(y*w+x)*4;rgba[p]=240;rgba[p+1]=220;rgba[p+2]=20;rgba[p+3]=255;}
 assert.equal(dealerCandidate(rgba,w,h,ggSeats),5);assert.equal(dealerCandidate(new Uint8ClampedArray(w*h*4),w,h),null);
});
test('нет суммы колла — нет выдуманной цены или действий',()=>{
 const facts=tableFacts(ggSeats.map((_,i)=>({text:'Player'+i+'\n10 BB',confidence:90})),'2.7 BB',90,5);assert.equal(facts.call,null);assert.deepEqual(facts.actions,[]);assert.equal(facts.table.cards,null);
});
test('ранг требует отдельного распознанного символа и достаточной уверенности',()=>{
 assert.equal(rankFromText('A',90),'A');assert.equal(rankFromText('10',70),'T');assert.equal(rankFromText('A',10),null);assert.equal(rankFromText('AK',90),null);
});
test('красный ромб: классификация масти без угадывания закрытых карт',()=>{
 const w=21,h=21,rgba=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,diamond=Math.abs(x-10)+Math.abs(y-10)<=9;rgba[i]=diamond?220:255;rgba[i+1]=diamond?0:255;rgba[i+2]=diamond?0:255;rgba[i+3]=255;}
 assert.equal(suitFromPixels(rgba,w,h).suit,'d');assert.equal(suitFromPixels(new Uint8ClampedArray(w*h*4),w,h).suit,null);
});
test('одна и та же карта не может распознаваться дважды',()=>{
 assert.deepEqual(combineCards([{rank:'A',suit:'s'},{rank:'A',suit:'d'}]),['As','Ad']);assert.deepEqual(combineCards([{rank:'A',suit:'s'},{rank:'A',suit:'s'}]),[null,null]);
});
