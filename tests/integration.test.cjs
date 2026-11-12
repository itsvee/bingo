const { test } = require('node:test');
const assert = require('node:assert/strict');
const { io } = require('socket.io-client');
const base = process.env.TEST_URL || 'http://127.0.0.1:3000';
function connect() {
  return new Promise((resolve,reject) => {
    const socket=io(base,{transports:['polling'],forceNew:true,reconnection:false,timeout:5000});
    socket.once('connect',()=>resolve(socket)); socket.once('connect_error',reject);
  });
}
const request=(socket,event,payload={})=>socket.timeout(5000).emitWithAck(event,payload);
function nextState(socket, predicate) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.off('state',listener);reject(new Error('State broadcast timed out'));},5000);
    function listener(state){if(predicate(state)){clearTimeout(timer);socket.off('state',listener);resolve(state);}}
    socket.on('state',listener);
  });
}
test('two real polling clients: create, join, reject spoofing, draw, resume, broadcast winner', async t=>{
  const host=await connect(), player=await connect();
  let resumed;
  t.after(()=>{host.disconnect();player.disconnect();resumed?.disconnect();});
  assert.equal(host.io.engine.transport.name,'polling');
  const created=await request(host,'room:create');
  assert.equal(created.ok,true);
  assert.equal((await request(host,'game:start')).ok,false);
  const roster=nextState(host,s=>s.players.length===1);
  const joined=await request(player,'room:join',{room:created.state.room,name:'วีทดสอบ'});
  assert.equal(joined.ok,true); assert.equal(joined.state.card.length,25);
  const publicState=await roster;
  assert.equal(publicState.card,null); assert.equal(publicState.token,undefined);
  assert.equal(publicState.players[0].card,undefined);
  for(const event of ['game:start','game:draw','game:claim']) assert.equal((await request(player,event,{room:created.state.room,winner:'ปลอม',drawn:[1,2,3]})).ok,false);
  assert.equal((await request(player,'room:resume',{room:created.state.room,token:'bad'})).ok,false);
  const started=nextState(player,s=>s.status==='playing');
  assert.equal((await request(host,'game:start')).ok,true); await started;
  assert.equal((await request(player,'game:claim',{card:Array(25).fill(null)})).ok,false);
  player.disconnect();
  resumed=await connect();
  const restored=await request(resumed,'room:resume',{room:created.state.room,token:joined.state.token});
  assert.equal(restored.ok,true);assert.deepEqual(restored.state.card,joined.state.card);
  const {hasBingo}=require('../lib/engine.cjs');
  let drawn=[];
  while(!hasBingo(joined.state.card,drawn)) {
    const broadcast=nextState(resumed,s=>s.drawn.length===drawn.length+1);
    const reply=await request(host,'game:draw',{number:999,drawn:[999]});
    assert.equal(reply.ok,true);
    await broadcast; drawn=reply.state.drawn;
    assert.ok(drawn.at(-1)>=1&&drawn.at(-1)<=75);
    assert.equal(new Set(drawn).size,drawn.length);
  }
  const winner=nextState(host,s=>s.status==='finished');
  const claimed=await request(resumed,'game:claim',{winner:'ปลอม'});
  assert.equal(claimed.ok,true);
  assert.equal((await winner).winner.name,'วีทดสอบ');
  assert.equal((await request(host,'game:draw')).ok,false);
  console.log(`Polling integration completed: ${drawn.length} distinct draws; winner วีทดสอบ`);
});
