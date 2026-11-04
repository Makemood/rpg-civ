import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHistory,parseHand,summarize} from './parser.js';
import {demo} from './demo.js';
import {readZip} from './zip.js';
const samples=demo.split(/(?=^Poker Hand #)/m).filter(Boolean);
test('счёт учитывает ставки по улицам, возврат и не дублирует SUMMARY',()=>{
 const h=parseHand(samples[0]);assert.equal(h.invested,650);assert.equal(h.collected,1455);assert.equal(h.result,805/150);assert.equal(h.position,'UTG');assert.equal(h.cbet,true);assert.equal(h.cbetOpp,true);
});
test('SB не оплачивается повторно при колле; заметка не объявляет ошибку',()=>{
 const h=parseHand(samples[1]);assert.equal(h.invested,1075);assert.equal(h.result,-1075/200);assert.equal(h.position,'SB');assert.equal(h.vpip,true);assert.equal(h.pfr,false);assert.equal(h.threeOpp,true);assert.equal(h.threeBet,false);assert.equal(h.warnings.length,1);
});
test('рейз с BB учитывает уже внесённый блайнд',()=>{
 const text=samples[0].replace('Seat 2: Bob','Seat 2: Temp').replace('Seat 3: Hero','Seat 3: Bob').replace('Seat 2: Temp','Seat 2: Hero').replace('Bob: posts big blind 150','Hero: posts big blind 150').replace('Hero: raises 180 to 330','Bob: raises 180 to 330').replace('Bob: calls 180','Hero: raises 570 to 900');
 const h=parseHand(text);assert.equal(h.threeBet,true);assert.equal(h.threeOpp,true);assert.equal(h.position,'BB');assert.equal(h.invested,1220);
});
test('сумма двух выплат из side pots и единственный SUMMARY fallback',()=>{
 const text=samples[0].replace('Hero collected 1,455 from pot','Hero collected 700 from main pot\nHero collected 755 from side pot');assert.equal(parseHand(text).collected,1455);
 assert.equal(parseHand(samples[0].replace('Hero collected 1,455 from pot','')).collected,1455);
});
test('неизвестный формат исключается с объяснением',()=>{
 const parsed=parseHistory(samples[0].replace("Hold'em No Limit",'Omaha Pot Limit'));assert.equal(parsed.hands.length,0);assert.equal(parsed.errors.length,1);
});
test('ноль возможностей не выдаётся за 0%',()=>{assert.equal(summarize([]).threeBet,null);assert.equal(summarize([]).vpip,null);});
test('HU: button является SB, другой игрок BB',()=>{
 const text=samples[0].replace(/^Seat [1-4]:.*\n/gm,'').replace('Seat #6 is the button','Seat #6 is the button').replace('Seat 5: Eva','Seat 5: Hero').replace('Dealt to Hero','Dealt to Hero');assert.equal(parseHand(text).position,'BB');
});
test('повреждённый ZIP отклоняется',async()=>{await assert.rejects(()=>readZip(new ArrayBuffer(40)),/ZIP/);});
