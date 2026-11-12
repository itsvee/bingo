const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../lib/engine.cjs');
test('cards have 5x5 column ranges and a free center', () => {
  for (let i = 0; i < 100; i++) {
    const card = engine.createCard();
    assert.equal(card.length, 25);
    assert.equal(card[12], null);
    assert.equal(new Set(card.filter(n => n !== null)).size, 24);
    card.forEach((n, index) => { if (n !== null) assert.ok(n >= index % 5 * 15 + 1 && n <= (index % 5 + 1) * 15); });
  }
});

test('one horizontal, vertical or diagonal line wins, including free center', () => {
 const card = engine.createCard();
 const lines = [...Array.from({length:5}, (_,r) => Array.from({length:5},(_,c)=>r*5+c)), ...Array.from({length:5}, (_,c)=>Array.from({length:5},(_,r)=>r*5+c)), [0,6,12,18,24],[4,8,12,16,20]];
 for (const line of lines) {
 const numbers = line.map(i=>card[i]).filter(n=>n!==null);
 assert.equal(engine.hasBingo(card, numbers), true);
 assert.equal(engine.hasBingo(card, numbers.slice(1)), false);
 }
});

test('room authority, private cards, reconnect and validated claims', () => {
 const game = new engine.Game();
 const host = game.create('h');
 const player = game.join('p', {room:host.room, name:'วี'});
 assert.equal(game.view('h').players.length, 1);
 assert.equal(game.view('h').card, null);
 assert.equal(game.view('p').card.length,25);
 assert.throws(()=>game.start('p'));
 assert.throws(()=>game.draw('p'));
 assert.throws(()=>game.resume('evil',{room:host.room,token:'wrong'}));
 assert.throws(()=>game.claim('p'));
 game.start('h');
 assert.throws(()=>game.join('late',{room:host.room,name:'สาย'}));
 assert.throws(()=>game.claim('p'));
 game.disconnect('p');
 game.resume('p2',{room:host.room,token:player.token});
 assert.deepEqual(game.view('p2').card,player.card);
 for(let i=0;i<75;i++) game.draw('h');
 assert.equal(new Set(game.view('h').drawn).size,75);
 assert.throws(()=>game.draw('h'));
 game.claim('p2');
 assert.equal(game.view('h').winner.name,'วี');
 assert.throws(()=>game.draw('h'));
 assert.throws(()=>game.start('h'));
 assert.equal(JSON.stringify(game.view('h')).includes(player.token),false);
});
