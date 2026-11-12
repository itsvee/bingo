import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useGame } from './useGame';
import { Card, Draws, NumberHistory, preview } from './Board';
import JoinQRCode from './JoinQRCode';
export default function GamePage({roomKey}) {
  const router=useRouter();
  const room=typeof roomKey==='string'?roomKey.toUpperCase():null;
  const {state,connected,pending,error,action}=useGame(room);
  const [name,setName]=useState('');
  const [code,setCode]=useState('');
  const [copied,setCopied]=useState(false);
  const disabled=!connected||pending;
  async function create() {
    const result=await action('room:create');
    if(result) router.push(`/host/${result.room}`);
  }
  async function join(e) {
    e.preventDefault();
    const target=room||code.trim().toUpperCase();
    const result=await action('room:join',{room:target,name});
    if(result&&!room) router.push(`/${result.room}`);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${location.origin}/${state.room}`); setCopied(true); }
    catch { setCopied(false); }
  }
  const host=state?.role==='host';
  return <>
    <Head><title>{state?`ห้อง ${state.room} · `:''}บิงโกคลับ — เล่นด้วยกัน สนุกด้วยกัน</title><meta name="description" content="บิงโก 5×5 เล่นกับเพื่อนได้ทันที สร้างห้อง แชร์รหัส แล้วลุ้นเลขไปด้วยกัน"/><meta name="theme-color" content="#fffaf0"/></Head>
    <div className={`app-shell ${state ? (host ? 'host-session' : 'player-session') : ''}`}>
      <header className="topbar"><a className="brand" href="/"><span className="brand-icon" aria-hidden="true">✦</span>บิงโก<span>คลับ</span></a><span className={`connection ${connected?'online':''}`} role="status">{connected?'พร้อมเล่น':'กำลังเชื่อมต่อ…'}</span></header>
      <main id="main-content">
      {error&&<div className="error" role="alert">{error}</div>}
      {state ? <>
        <div className="room-heading"><div><p className="eyebrow">{host?'โต๊ะของคุณ':'มาเล่นด้วยกัน'}</p><h1>ห้อง <span className="room-code">{state.room}</span></h1></div><button className="button secondary compact" onClick={copy}>{copied?'คัดลอกแล้ว ✓':'คัดลอกลิงก์ชวนเพื่อน'}</button></div>
        {state.winner&&<section className="winner" role="status"><span aria-hidden="true">✦</span><div><p>บิงโก! เรามีผู้ชนะแล้ว</p><h2>{state.winner.name}</h2><p>ครบหนึ่งแถว รับความเฮไปเลย</p></div><a className="button" href="/">เล่นรอบใหม่</a></section>}
        {!state.hostOnline&&!host&&<p className="notice" role="status">ผู้จัดเกมหลุดการเชื่อมต่อ รอสักครู่ เกมและการ์ดยังอยู่เหมือนเดิม</p>}
        <div className="game-layout">
          <div className="play-area">
            {state.status==='waiting'?<section className="waiting-panel"><span className="eyebrow">พร้อมแล้วก็ชวนเพื่อนเลย</span><h2>รอเพื่อนเข้าห้อง</h2><p>{host?'แชร์ลิงก์หรือรหัสห้องให้เพื่อน แล้วเริ่มเกมเมื่อทุกคนพร้อม':'การ์ดของคุณพร้อมแล้ว รอผู้จัดเกมเริ่มรอบนี้'}</p><div className="ticket-code">{state.room}</div>{host&&<JoinQRCode room={state.room}/>}<p className="muted">กติกา 5×5 · เลข 1–75 · ครบ 1 แถวชนะ</p>{host&&<button className="button" disabled={disabled||!state.players.some(p=>p.online)} onClick={()=>action('game:start')}>{pending?'กำลังเริ่ม…':`เริ่มเกม · ${state.players.filter(p=>p.online).length} คนพร้อม`}</button>}</section>:<Draws drawn={state.drawn}/>}
            {host&&state.status==='playing'&&<button className="button draw-button" disabled={disabled||state.drawn.length===75} onClick={()=>action('game:draw')}>{pending?'กำลังสุ่ม…':state.drawn.length===75?'ออกครบทั้ง 75 เลขแล้ว':'สุ่มเลขถัดไป'}<span aria-hidden="true">↗</span></button>}
            {!host&&<section className="your-card"><div className="section-label"><h2>การ์ดของ {state.name}</h2><span>แต้มให้อัตโนมัติ</span></div><Card card={state.card} drawn={state.drawn}/><button className="button claim-button" disabled={disabled||state.status!=='playing'} onClick={()=>action('game:claim')}>{pending?'กำลังตรวจ…':'บิงโก! ครบแถวแล้ว'}</button><p className="card-note">แนวนอน แนวตั้ง หรือทแยง ครบ 1 แถวก็กดบิงโกได้เลย</p></section>}
            <NumberHistory drawn={state.drawn}/>
          </div>
          <aside className="sidebar"><details className="room-extras" open={host || undefined}><summary>เพื่อนร่วมโต๊ะและกติกา <span>{state.players.length} คน</span></summary><section className="roster"><div className="section-label"><h2>เพื่อนร่วมโต๊ะ</h2><span>{state.players.length} คน</span></div>{state.players.length?<ul>{state.players.map((p,i)=><li key={p.id}><span className="avatar">{String(i+1).padStart(2,'0')}</span><span>{p.name}{p.id===state.me&&<small> (คุณ)</small>}</span><small className={p.online?'player-online':''}>{p.online?'พร้อม':'ออฟไลน์'}</small></li>)}</ul>:<p className="muted">ยังไม่มีผู้เล่น ชวนเพื่อนคนแรกเข้ามาได้เลย</p>}</section><Rules/><p className="session-note">กลับเข้าห้องเดิมได้จากแท็บนี้ หากรีเฟรชระหว่างเกม</p></details></aside>
        </div>
      </>:<div className="home-layout"><section className="home-copy"><p className="eyebrow">เพื่อนพร้อม เลขพร้อม ลุย!</p><h1>ความสนุก<br/>อยู่แค่<span className="accent">หนึ่งแถว</span></h1><p className="intro">รวมแก๊ง เปิดห้อง แล้วลุ้นไปด้วยกัน<br/>บิงโกคลาสสิก 5×5 เล่นง่าย ไม่ต้องโหลดแอป</p><div className="entry-panel">{!room&&<><button className="button create-button" disabled={disabled} onClick={create}>{pending?'กำลังสร้างห้อง…':'สร้างห้อง ชวนเพื่อนเล่น'}<span aria-hidden="true">↗</span></button><div className="divider"><span>หรือเข้าห้องของเพื่อน</span></div></>}<form onSubmit={join}><h2>{room?`เข้าร่วมห้อง ${room}`:'มีรหัสห้องแล้ว?'}</h2>{!room&&<label>รหัสห้อง<input autoComplete="off" autoCapitalize="characters" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} pattern="[a-fA-F0-9]{6}" placeholder="เช่น A3F8B2" required/></label>}<label>ชื่อที่เพื่อนเรียก<input autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder="ใส่ชื่อของคุณ" required/></label><button className="button secondary" disabled={disabled||!name.trim()}>{pending?'กำลังเข้าห้อง…':'เข้าร่วมวง'}</button></form></div><p className="home-footnote">ไม่ต้องสมัครสมาชิก · สูงสุด 60 คนต่อห้อง</p></section><section className="home-board"><div className="board-caption"><span className="mini-tag">การ์ดพร้อม เสียงเฮพร้อม</span><span aria-hidden="true">✦</span></div><Card card={preview} drawn={[8,28,40,55,71,3,14] } demo/><div className="board-bottom"><strong>5×5</strong><span>แถวเดียวก็เฮได้<br/><small>ช่องกลางฟรี ลุ้นต่อได้เลย</small></span><span className="round-arrow" aria-hidden="true">↗</span></div><Rules/></section></div>}
      </main>
      <footer><span>บิงโกคลับ · เล่นด้วยกัน สนุกด้วยกัน</span><span>75 เลข / 25 ช่อง / 1 เสียงเฮ</span></footer>
    </div>
  </>;
}
function Rules(){ return <section className="rules"><h2>กติกาสั้น ๆ</h2><ol><li>รับการ์ด 5×5 ช่องกลางฟรี</li><li>ผู้จัดสุ่มเลข ระบบแต้มให้ทุกคน</li><li>ครบแนวนอน แนวตั้ง หรือทแยง 1 แถว กด “บิงโก!”</li></ol></section>; }
