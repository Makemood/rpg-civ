import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHistory} from './parser.js';
import {demo} from './demo.js';
import {opponentProfiles,playerKey,classifyPlayer} from './opponents.js';
const h=parseHistory(demo).hands[0];
test('VPIP/PFR считаются один раз за руку; обязательные блайнды не VPIP',()=>{
 const p=opponentProfiles([h]);const bob=p.get(playerKey(h,'Bob')),alice=p.get(playerKey(h,'Alice'));
 assert.equal(bob.hands,1);assert.equal(bob.vpip,100);assert.equal(bob.pfr,0);assert.equal(bob.threeOpp,1);assert.equal(alice.vpip,0);assert.ok(!p.has(playerKey(h,'Hero')));
});
test('одно анонимное имя в разных турнирах не объединяется',()=>{
 const other={...h,tournamentId:'different'};const p=opponentProfiles([h,other]);assert.equal(p.get(playerKey(h,'Bob')).hands,1);assert.equal(p.get(playerKey(other,'Bob')).hands,1);
});
test('на маленькой выборке автоматическая метка не назначается',()=>{
 assert.equal(classifyPlayer({hands:99,vpip:90,pfr:0}).type,'unknown');
 assert.equal(classifyPlayer({hands:100,vpip:90,pfr:0}).type,'whale');
});
test('ручная метка имеет приоритет даже при малой выборке',()=>{
 assert.equal(classifyPlayer({hands:2,vpip:0,pfr:0},'fish').type,'fish');assert.equal(classifyPlayer({hands:200,vpip:90,pfr:0},'unknown').label,'Неизвестно');
});
test('автоотметки различают пассивный широкий стиль и агрессию',()=>{
 assert.equal(classifyPlayer({hands:100,vpip:45,pfr:15}).type,'fish');
 assert.equal(classifyPlayer({hands:100,vpip:25,pfr:20}).type,'reg');
 assert.equal(classifyPlayer({hands:100,vpip:70,pfr:60}).type,'unknown');
});
test('ноль возможностей 3-бета даёт прочерк, а не нулевую частоту',()=>{
 const p=opponentProfiles([h]);assert.equal(p.get(playerKey(h,'Dan')).threeBet,0);assert.equal(p.get(playerKey(h,'Bob')).threeBet,0);
 const first=opponentProfiles([{...h,streets:h.streets.map(s=>s.name==='Префлоп'?{...s,actions:s.actions.map(a=>({...a,raisesBefore:0}))}:s)}]);assert.equal(first.get(playerKey(h,'Bob')).threeBet,null);
});
