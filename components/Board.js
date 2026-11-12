const letters = ['B','I','N','G','O'];
export const preview = [3,20,34,48,63,8,28,40,55,71,12,18,null,59,65,5,25,43,52,74,14,30,37,46,69];
export function Card({card,drawn=[],demo=false}) {
  return <div className="bingo-card" aria-label={demo ? 'ตัวอย่างการ์ดบิงโก' : 'การ์ดบิงโกของคุณ'}>
    <div className="card-columns">{letters.map((letter,i)=><div key={letter}><strong>{letter}</strong><small>{i*15+1}–{(i+1)*15}</small></div>)}</div>
    <div className="card-grid">{card.map((n,i)=>{
      const marked=n===null || drawn.includes(n);
      return <div key={i} className={`tile ${marked?'marked':''} ${n===null?'free':''}`} aria-label={n===null?'ช่องฟรี':`${n}${marked?' ออกแล้ว':''}`}>
        {n===null ? <><span aria-hidden="true">✦</span><small>ฟรี</small></> : <><span>{n}</span>{marked&&<small className="tick" aria-hidden="true">✓</small>}</>}
      </div>;
    })}</div>
  </div>;
}
export function Draws({drawn}) {
  const latest=drawn.at(-1);
  return <section className="draw-panel" aria-labelledby="draw-title">
    <div className="section-label"><h2 id="draw-title">เลขล่าสุด</h2><span>{drawn.length} / 75</span></div>
    <div className="latest-ball" aria-live="polite" aria-atomic="true">{latest ? <><small>{letters[Math.floor((latest-1)/15)]}</small><strong key={latest}>{latest}</strong></> : <span className="waiting-ball">รอสุ่มเลข</span>}</div>
    <div className="recent"><span>ก่อนหน้านี้</span>{drawn.slice(-5,-1).reverse().map(n=><b key={n}>{n}</b>)}{drawn.length<2&&<small>เลขที่ออกจะปรากฏที่นี่</small>}</div>
  </section>;
}
export function NumberHistory({drawn}) {
  return <details className="history"><summary>ดูเลขที่ออกทั้งหมด <span>{drawn.length} เลข</span></summary><div className="number-history">{Array.from({length:75},(_,i)=>i+1).map(n=><span key={n} className={drawn.includes(n)?'called':''} aria-label={`${n} ${drawn.includes(n)?'ออกแล้ว':'ยังไม่ออก'}`}>{n}</span>)}</div></details>;
}
