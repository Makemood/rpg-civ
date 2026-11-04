import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHistory,parseHand} from './parser.js';
import {analyzeHand,coachingReport} from './advice.js';
import {demo} from './demo.js';
const examples=parseHistory(demo).hands;
test('SB: практический совет привязан к позиции и действию, не результату',()=>{
 const h=examples[1],notes=analyzeHand(h);assert.ok(notes.some(n=>n.key==='sb'&&n.evidence.includes('SB')));
 assert.deepEqual(analyzeHand({...h,result:500}),notes);
 assert.ok(!analyzeHand({...h,position:'BTN'}).some(n=>n.key==='sb'));
});
test('короткий min-raise отмечается как тема; пуш не помечается',()=>{
 const h=examples[2];assert.ok(analyzeHand(h).some(n=>n.key==='short'));
 const text=h.raw.replace('Hero: raises 600 to 1,200','Hero: raises 5,925 to 6,525 and is all-in');
 assert.ok(!analyzeHand(parseHand(text)).some(n=>n.key==='short'));
});
test('цена постфлоп-колла учитывает уже сформированный банк',()=>{
 const h=examples[1],action=h.streets.find(s=>s.name==='Флоп').actions.find(a=>a.name==='Hero'&&a.type==='calls');
 assert.equal(action.potBefore,1850);assert.equal(action.amount,600);
 assert.ok(analyzeHand(h).find(n=>n.key==='postflop').evidence.includes('24,5%'));
});
test('против overbet all-in чужая непокрытая часть не улучшает цену колла',()=>{
 const raw=`Poker Hand #TEST: Tournament #1, Bounty Hunters $2.50 Hold'em No Limit - Level1(50/100(10)) - 2026/11/04 12:00:00
Table '1' 3-max Seat #3 is the button
Seat 1: Alice (2,000 in chips)
Seat 2: Hero (1,000 in chips)
Seat 3: Bob (2,010 in chips)
Alice: posts the ante 10
Hero: posts the ante 10
Bob: posts the ante 10
Alice: posts small blind 50
Hero: posts big blind 100
*** HOLE CARDS ***
Dealt to Hero [As Qs]
Bob: raises 1,900 to 2,000 and is all-in
Alice: folds
Hero: calls 890 and is all-in
*** SUMMARY ***`;
 const h=parseHand(raw),a=h.streets.find(s=>s.name==='Префлоп').actions.at(-1);
 assert.equal(a.toCall,890);assert.equal(a.potBefore,2180);assert.equal(a.eligiblePot,1170);
 assert.equal(a.facingAllIn,true);assert.ok(analyzeHand(h).find(n=>n.key==='allin').evidence.includes('43,2%'));
});
test('Flip & Go не оценивается; отсутствие заметок не зависит от выигрыша',()=>{
 assert.deepEqual(analyzeHand({...examples[1],tournament:'Flip & Go $5'}),[]);
});
test('отчёт считает руку один раз по теме, а не по числу улиц',()=>{
 const h={...examples[1],advice:[{key:'postflop',street:'Флоп'},{key:'postflop',street:'Тёрн'}]};
 const report=coachingReport([h]);assert.equal(report[0].hands.length,1);assert.equal(report[0].per1000,1000);assert.equal(report[0].net,h.result);assert.equal(report[0].months[0].count,1);
});
test('оверколл офсьютного бродвея требует коллера перед Hero',()=>{
 const h=parseHand(examples[1].raw.replace('[Qh Jh]','[Qh Jc]').replace('Frank: folds','Frank: calls 450'));
 assert.ok(analyzeHand(h).some(n=>n.key==='overcall'));
 assert.ok(!analyzeHand(parseHand(examples[1].raw.replace('[Qh Jh]','[Qh Jc]'))).some(n=>n.key==='overcall'));
});
test('рейз-фолд на коротком стеке требует собственного рейза до фолда',()=>{
 const h=parseHand(examples[2].raw.replace('Dan: folds','Dan: raises 2,000 to 3,200').replace('Eva: folds','Hero: folds\nEva: folds'));
 assert.ok(analyzeHand(h).some(n=>n.key==='raisefold'));
 assert.ok(!analyzeHand({...h,stack:40}).some(n=>n.key==='raisefold'));
 assert.ok(!analyzeHand(examples[2]).some(n=>n.key==='raisefold'));
});
test('лимп отличается от защиты BB и SB',()=>{
 const h=parseHand(examples[0].raw.replace('Hero: raises 180 to 330','Hero: calls 150'));
 assert.ok(analyzeHand(h).some(n=>n.key==='limp'));
 assert.ok(!analyzeHand({...h,position:'BB'}).some(n=>n.key==='limp'));
});
