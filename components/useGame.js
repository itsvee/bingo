import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
export function useGame(room) {
  const socketRef = useRef(null);
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const socket = io({ transports:['polling','websocket'], upgrade:false, autoConnect:false });
    socketRef.current = socket;
    const receive = value => { if (active) setState(value); };
    socket.on('state', receive);
    socket.on('connect', () => {
      if (!active) return;
      setConnected(true); setError('');
      let saved;
      try { saved = room && JSON.parse(sessionStorage.getItem(`bingo:${room}`)); } catch {}
      if (saved?.token) {
        setPending(true);
        socket.timeout(8000).emit('room:resume', {room,token:saved.token}, (err, reply) => {
          if (!active) return;
          setPending(false);
          if (err || !reply?.ok) { setState(null); setError(reply?.error || 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่'); }
          else receive(reply.state);
        });
      }
    });
    socket.on('disconnect', () => { if (active) setConnected(false); });
    socket.on('connect_error', () => { if (active) { setConnected(false); setError('เชื่อมต่อไม่ได้ กำลังลองใหม่…'); } });
    socket.connect();
    return () => { active = false; socket.removeAllListeners(); socket.disconnect(); socketRef.current = null; };
  }, [room]);
  async function action(event, payload = {}) {
    if (!socketRef.current?.connected) { setError('การเชื่อมต่อขาดหาย กรุณารอสักครู่'); return null; }
    setPending(true); setError('');
    try {
      const reply = await socketRef.current.timeout(8000).emitWithAck(event,payload);
      if (!reply.ok) throw new Error(reply.error);
      setState(reply.state);
      if (reply.state.token) {
        try { sessionStorage.setItem(`bingo:${reply.state.room}`,JSON.stringify({token:reply.state.token})); }
        catch { setError('เบราว์เซอร์บันทึกสิทธิ์ไม่ได้ อย่ารีเฟรชหน้านี้ระหว่างเกม'); }
      }
      return reply.state;
    } catch (err) { setError(err.message === 'operation has timed out' ? 'หมดเวลารอ กรุณาลองอีกครั้ง' : err.message); return null; }
    finally { setPending(false); }
  }
  return {state,connected,pending,error,action};
}
