const { Server } = require('socket.io');
const { Game } = require('./engine.cjs');
function attachSocket(server) {
  const io = new Server(server, { maxHttpBufferSize: 8192, transports: ['polling', 'websocket'] });
  const game = new Game();
  function publish(code) {
    for (const [id, record] of game.members) {
      if (record.room === code) io.to(id).emit('state', game.view(id));
    }
  }
  io.on('connection', socket => {
    let count = 0, windowStart = Date.now();
    for (const [event, method] of Object.entries({ 'room:create':'create', 'room:join':'join', 'room:resume':'resume', 'game:start':'start', 'game:draw':'draw', 'game:claim':'claim' })) {
      socket.on(event, (payload, ack) => {
        if (typeof ack !== 'function') return;
        try {
          if (Date.now() - windowStart > 10000) { count = 0; windowStart = Date.now(); }
          if (++count > 100) throw new Error('ส่งคำขอถี่เกินไป กรุณารอสักครู่');
          if (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) throw new Error('ข้อมูลไม่ถูกต้อง');
          const result = game[method](socket.id, payload);
          const state = result || game.view(socket.id);
          ack({ ok:true, state });
          publish(state.room);
        } catch (error) { ack({ ok:false, error:error.message }); }
      });
    }
    socket.on('disconnect', () => {
      const code = game.members.get(socket.id)?.room;
      game.disconnect(socket.id);
      if (code && game.rooms.has(code)) publish(code);
    });
  });
  const cleanup = setInterval(() => game.prune(), 60000);
  cleanup.unref();
  io.on('close', () => clearInterval(cleanup));
  return io;
}
module.exports = { attachSocket };
