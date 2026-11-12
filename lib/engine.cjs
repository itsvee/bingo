const { randomInt, randomUUID, randomBytes } = require('node:crypto');
function shuffle(values) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
function createCard() {
  const columns = Array.from({ length: 5 }, (_, c) => shuffle(Array.from({ length: 15 }, (_, n) => c * 15 + n + 1)).slice(0, 5));
  return Array.from({ length: 25 }, (_, i) => i === 12 ? null : columns[i % 5][Math.floor(i / 5)]);
}
const lines = [...Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c)), ...Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c)), [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]];
function hasBingo(card, drawn) {
  const called = new Set(drawn);
  return lines.some(line => line.every(i => card[i] === null || called.has(card[i])));
}
class Game {
  constructor() { this.rooms = new Map(); this.members = new Map(); }
  prune() {
    for (const [code, room] of this.rooms) {
      if (Date.now() - room.updated > 12 * 60 * 60 * 1000) {
        for (const [id, member] of this.members) if (member.room === code) this.members.delete(id);
        this.rooms.delete(code);
      }
    }
  }
  bind(socket, room, member) {
    if (this.members.has(socket)) throw new Error('คุณอยู่ในห้องแล้ว กรุณากลับหน้าหลักเพื่อเปลี่ยนห้อง');
    if (member.socket) this.members.delete(member.socket);
    member.socket = socket;
    this.members.set(socket, { room: room.code, member });
    room.updated = Date.now();
    return { ...this.view(socket), token: member.token };
  }
  create(socket) {
    this.prune();
    if (this.members.has(socket)) throw new Error('คุณอยู่ในห้องแล้ว');
    if (this.rooms.size >= 500) throw new Error('ห้องเต็มระบบ กรุณาลองใหม่ภายหลัง');
    let code;
    do { code = randomBytes(4).toString('hex').slice(0,6).toUpperCase(); } while (this.rooms.has(code));
    const host = { id: randomUUID(), name: 'ผู้จัดเกม', token: randomBytes(32).toString('hex'), socket: null };
    const room = { code, host, players: [], status: 'waiting', drawn: [], deck: shuffle(Array.from({length:75},(_,i)=>i+1)), winner: null, updated: Date.now() };
    this.rooms.set(code, room);
    return this.bind(socket, room, host);
  }
  find(code) {
    this.prune();
    const room = typeof code === 'string' && this.rooms.get(code.toUpperCase());
    if (!room) throw new Error('ไม่พบห้องนี้ ห้องอาจหมดอายุแล้ว');
    return room;
  }
  join(socket, {room:code, name} = {}) {
    const room = this.find(code);
    if (this.members.has(socket)) throw new Error('คุณอยู่ในห้องแล้ว');
    if (room.status !== 'waiting') throw new Error('เกมเริ่มแล้ว เข้าร่วมรอบนี้ไม่ได้');
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 24) throw new Error('กรุณาใส่ชื่อ 1–24 ตัวอักษร');
    if (room.players.length >= 60) throw new Error('ห้องนี้มีผู้เล่นครบ 60 คนแล้ว');
    const player = { id: randomUUID(), name: name.trim(), token: randomBytes(32).toString('hex'), card: createCard(), socket: null };
    room.players.push(player);
    return this.bind(socket, room, player);
  }
  resume(socket, {room:code, token} = {}) {
    const room = this.find(code);
    const member = [room.host,...room.players].find(m => typeof token === 'string' && m.token === token);
    if (!member) throw new Error('สิทธิ์เข้าห้องไม่ถูกต้อง กรุณาเข้าร่วมใหม่');
    return this.bind(socket, room, member);
  }
  context(socket, hostOnly = false) {
    const record = this.members.get(socket);
    if (!record) throw new Error('กรุณาเข้าห้องก่อน');
    const room = this.find(record.room);
    if (hostOnly && record.member !== room.host) throw new Error('เฉพาะผู้จัดเกมเท่านั้น');
    room.updated = Date.now();
    return {room, member:record.member};
  }
  view(socket) {
    const {room,member} = this.context(socket);
    return { room:room.code, role:member === room.host ? 'host':'player', me:member.id, name:member.name, card:member.card || null, status:room.status, hostOnline:!!room.host.socket, players:room.players.map(p=>({id:p.id,name:p.name,online:!!p.socket})), drawn:[...room.drawn], winner:room.winner };
  }
  start(socket) {
    const {room} = this.context(socket,true);
    if (room.status !== 'waiting') throw new Error('เกมนี้เริ่มไปแล้ว');
    if (!room.players.some(p=>p.socket)) throw new Error('รอผู้เล่นอย่างน้อย 1 คนก่อน');
    room.status = 'playing';
  }
  draw(socket) {
    const {room} = this.context(socket,true);
    if (room.status !== 'playing') throw new Error('ยังสุ่มเลขไม่ได้ในตอนนี้');
    if (!room.deck.length) throw new Error('สุ่มครบทั้ง 75 เลขแล้ว');
    room.drawn.push(room.deck.pop());
  }
  claim(socket) {
    const {room,member} = this.context(socket);
    if (room.status !== 'playing' || !member.card || !hasBingo(member.card,room.drawn)) throw new Error('ยังไม่บิงโก ต้องครบ 1 แถวก่อนนะ');
    room.winner = {id:member.id,name:member.name};
    room.status = 'finished';
  }
  disconnect(socket) {
    const record = this.members.get(socket);
    if (record) { record.member.socket = null; this.members.delete(socket); }
  }
}
module.exports = { createCard, hasBingo, Game };
