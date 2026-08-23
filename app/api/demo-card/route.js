import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '1200px', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg,#fff7ed 0%,#ffffff 55%,#eff6ff 100%)',
        padding: '72px', fontFamily: 'sans-serif', color: '#111827'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:42,fontWeight:800,color:'#0f172a'}}>2BOrder</div>
          <div style={{fontSize:26,padding:'12px 22px',borderRadius:999,background:'#dbeafe',color:'#1d4ed8',fontWeight:700}}>ใช้จริงกับร้านเรา</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',marginTop:84}}>
          <div style={{fontSize:64,fontWeight:900,lineHeight:1.12}}>ร้านอาหารยุคใหม่</div>
          <div style={{fontSize:64,fontWeight:900,lineHeight:1.12,color:'#2563eb'}}>ไม่ต้องไล่จดออเดอร์เอง</div>
          <div style={{fontSize:34,marginTop:34,color:'#475569'}}>ลูกค้าสั่งเอง • ร้านเห็นคิว • เช็กเงิน • จัดส่ง • สะสมแต้ม</div>
        </div>

        <div style={{display:'flex',gap:24,marginTop:70,flexWrap:'wrap'}}>
          {[
            ['🧾','รับออเดอร์ออนไลน์'],['⏱️','จัดคิวและเวลารอ'],['💳','ติดตามการชำระเงิน'],
            ['🛵','Delivery & Rider'],['⭐','สมาชิกและแต้มสะสม'],['📊','สรุปยอดขาย']
          ].map(([icon,text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:14,width:'31%',padding:'24px',borderRadius:24,background:'#ffffff',border:'1px solid #e2e8f0',boxShadow:'0 8px 24px rgba(15,23,42,.06)'}}>
              <div style={{fontSize:34}}>{icon}</div><div style={{fontSize:25,fontWeight:700}}>{text}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'end'}}>
          <div style={{fontSize:26,color:'#64748b'}}>ระบบที่ไม่ได้ทำไว้โชว์ — ร้านเราใช้รับออเดอร์จริงทุกวัน</div>
          <div style={{fontSize:30,fontWeight:800,color:'#2563eb'}}>2BOrder</div>
        </div>
      </div>
    ),
    { width: 1200, height: 1200 }
  );
}
