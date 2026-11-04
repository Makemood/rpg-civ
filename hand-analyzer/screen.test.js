import {test} from 'node:test';
import assert from 'node:assert/strict';
import {screenFacts,screenMetrics,appendObservation} from './screen-facts.js';
test('экранные числа извлекаются только по явным подписям',()=>{
 const f=screenFacts('Pot: 1,000\nCall: 250\nStack: 5000\nHero: calls 250');
 assert.equal(f.pot.value,1000);assert.equal(f.call.value,250);assert.equal(f.actions[0].player,'Hero');assert.equal(screenMetrics(f).price,20);assert.equal(screenMetrics(f).spr,5);
 assert.equal(screenFacts('250 1000 Fold Raise').pot,null);
});
test('цифры ника или кнопка Call не превращаются в действие',()=>{
 assert.deepEqual(screenFacts('Hero123\nCall: 250\nFold').actions,[]);
});
test('несовпадающие единицы не дают выдуманный результат',()=>{
 assert.equal(screenMetrics(screenFacts('Pot: 10 BB\nCall: 250')).price,undefined);
 assert.equal(screenMetrics(screenFacts('Pot: 10 BB\nCall: 2.5 BB')).price,20);
});
test('возврат суммы рейза to и номер раздачи',()=>{
 const f=screenFacts('Hand #TM123\nVillain: raises 200 to 400');assert.equal(f.handId,'TM123');assert.equal(f.actions[0].amount,400);assert.equal(f.actions[0].unit,'unknown');
});
test('идентичные соседние кадры не дублируются, новая раздача сохраняется',()=>{
 const observation={hand:1,text:'Hero: checks'};const a=appendObservation([],observation);assert.equal(a.added,true);assert.equal(appendObservation(a.log,observation).added,false);assert.equal(appendObservation(a.log,{...observation,hand:2}).added,true);
});
test('журнал ограничен последними 200 наблюдениями',()=>{
 let log=[];for(let i=0;i<210;i++)log=appendObservation(log,{hand:1,text:String(i)}).log;assert.equal(log.length,200);assert.equal(log[0].text,'10');
});
