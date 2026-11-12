import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function JoinQRCode({ room }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(`${window.location.origin}/${room}`);
  }, [room]);

  return <div className="join-qr">
    {url && <a className="join-qr-image" href={url} target="_blank" rel="noopener noreferrer" aria-label={`เปิดหน้าเข้าร่วมห้อง ${room}`}>
      <QRCodeSVG value={url} size={208} level="M" marginSize={4} bgColor="#ffffff" fgColor="#10291e" title={`สแกนเพื่อเข้าร่วมห้อง ${room}`} />
    </a>}
    <p>สแกนเพื่อเข้าห้อง แล้วใส่ชื่อของคุณ</p>
    {url && <a className="join-qr-link" href={url} target="_blank" rel="noopener noreferrer">{url}</a>}
  </div>;
}
