'use client';

import { useMemo, useState } from 'react';

const MODES = [
  { key: 'food', icon: '🍜', title: 'ขายอาหาร', desc: 'เมนูเด่น โปร ราคา และคำชวนหิว' },
  { key: 'review', icon: '⭐', title: 'รีวิวจริง', desc: 'เปลี่ยนเสียงลูกค้าให้เป็น Social Proof' },
  { key: 'system', icon: '💻', title: 'ขายระบบ 2BOrder', desc: 'โชว์ UI + Benefit จากระบบที่ใช้จริง' },
];

const TONES = {
  food: [
    ['ชวนหิว', 'วันนี้กินอะไรดี 😋\n{title}\nราคา {price}\nสดใหม่ ทำตามออเดอร์ พร้อมเสิร์ฟให้หายหิวครับ'],
    ['ขายตรง', 'เมนูแนะนำวันนี้ 🔥\n{title} — {price}\nสั่งง่าย อร่อยจริง พร้อมส่งถึงบ้าน'],
    ['เป็นกันเอง', 'หิวเมื่อไหร่ก็แวะมาได้ 😋\nวันนี้ขอป้ายยา {title} ราคา {price}\nใครยังไม่ลอง ต้องจัดแล้วครับ'],
  ],
  review: [
    ['อบอุ่น', 'ขอบคุณทุกคำรีวิวครับ ❤️\n“{review}”\nเสียงจากลูกค้าจริงแบบนี้ คือกำลังใจของร้านเลย'],
    ['Social Proof', 'ลูกค้าบอกว่า… ⭐\n“{review}”\nขอบคุณที่ไว้ใจเรา และกลับมาอุดหนุนกันครับ'],
    ['สั้นคม', 'รีวิวจริงจากลูกค้าจริง ⭐\n“{review}”\nขอบคุณมากครับ ❤️'],
  ],
  system: [
    ['Benefit', '{title}\n{benefit}\nนี่คือระบบที่เราใช้กับร้านจริง ไม่ใช่แค่ mockup — 2BOrder'],
    ['Case Study', 'จากปัญหาหน้างานจริง → กลายเป็นฟีเจอร์นี้\n{title}\n{benefit}\nเราใช้เองทุกวัน แล้วค่อยพัฒนาให้ดีขึ้นเรื่อย ๆ'],
    ['ขายแบบนุ่ม', 'ถ้าร้านยังรับออเดอร์หลายช่องทางจนเริ่มวุ่น…\n{title}\n{benefit}\n2BOrder ช่วยรวมงานให้จัดการง่ายขึ้นในหน้าเดียว'],
  ],
};

const TODAY_TEST_CAPTION = `ร้านอาหารยุคใหม่ ไม่ต้องไล่จดออเดอร์เองแล้ว 🧾\n\nนี่คือ 2BOrder ระบบที่เราใช้กับร้านจริงทุกวัน ตั้งแต่รับออเดอร์ จัดคิว เช็กการชำระเงิน ไปจนถึง Delivery, Rider และสมาชิกสะสมแต้ม\n\nเราไม่ได้ทำระบบนี้ไว้โชว์ครับ — ใช้งานจริง เจอปัญหาจริง แล้วค่อย ๆ ปรับจากหน้างานจริง 😊\n\n#2BOrder #ระบบร้านอาหาร #รับออเดอร์ออนไลน์ #Delivery #Rider`;

export default function StudioPage() {
  const [mode, setMode] = useState('food');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [review, setReview] = useState('');
  const [benefit, setBenefit] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return imageUrl.trim();
  }, [imageFile, imageUrl]);

  const applyTemplate = (template) => {
    const next = template
      .replaceAll('{title}', title.trim() || (mode === 'system' ? 'ฟีเจอร์ของ 2BOrder' : 'เมนูแนะนำ'))
      .replaceAll('{price}', price.trim() ? `${price.trim()} บาท` : 'ราคาพิเศษ')
      .replaceAll('{review}', review.trim() || 'อร่อยมาก บริการดี สั่งง่าย')
      .replaceAll('{benefit}', benefit.trim() || 'ช่วยลดงานซ้ำ ลดความผิดพลาด และทำให้จัดการออเดอร์ง่ายขึ้น');
    setCaption(next);
  };

  const loadTodayTest = () => {
    setMode('system');
    setTitle('ร้านอาหารยุคใหม่ ไม่ต้องไล่จดออเดอร์เอง');
    setBenefit('ลูกค้าสั่งเอง • ร้านเห็นคิว • เช็กเงิน • จัดส่ง • สมาชิกและแต้มสะสม');
    setImageFile(null);
    setImageUrl('https://2border.vercel.app/api/demo-card');
    setCaption(TODAY_TEST_CAPTION);
    setStatus('โหลดโพสต์ทดสอบวันนี้แล้ว ✓ ตรวจรูปและแคปชันก่อนกดโพสต์');
  };

  const publish = async () => {
    if (!caption.trim() && !imageFile && !imageUrl.trim()) {
      setStatus('ใส่แคปชันหรือเลือกรูปก่อนครับ');
      return;
    }
    setLoading(true);
    setStatus('กำลังโพสต์...');
    try {
      let res;
      if (imageFile) {
        const form = new FormData();
        form.append('message', caption);
        form.append('image', imageFile);
        res = await fetch('/api/facebook/post', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/facebook/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: caption, imageUrl }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โพสต์ไม่สำเร็จ');
      setStatus(`โพสต์สำเร็จ ✓ ${data.type === 'photo' ? 'Photo' : 'Post'} ID: ${data.id || '-'}`);
    } catch (error) {
      setStatus(`ผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="studio-shell">
      <div className="studio-topbar">
        <div>
          <div className="brand">2BOrder</div>
          <h1>Content Studio</h1>
          <p>สร้างโพสต์ขายอาหาร รีวิวจริง และขายระบบจากหน้าเดียว</p>
        </div>
        <a href="/" className="studio-back">← Publisher</a>
      </div>

      <section style={{ marginBottom: 18, padding: 18, borderRadius: 18, background: '#eef6ff', border: '1px solid #bfdcff', display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ display: 'block', fontSize: 18 }}>✨ เทสโหมด “คิดโพสต์ให้วันนี้”</strong>
          <small style={{ color: '#526071' }}>ผมเตรียมหัวข้อ + ภาพ + แคปชันไว้ให้แล้ว กดโหลดแล้วตรวจ Preview ได้ทันที</small>
        </div>
        <button type="button" onClick={loadTodayTest} style={{ width: 'auto', marginTop: 0, paddingInline: 20 }}>โหลดโพสต์ทดสอบวันนี้</button>
      </section>

      <section className="mode-grid">
        {MODES.map((item) => (
          <button key={item.key} className={`mode-card ${mode === item.key ? 'active' : ''}`} onClick={() => { setMode(item.key); setCaption(''); }}>
            <span>{item.icon}</span>
            <strong>{item.title}</strong>
            <small>{item.desc}</small>
          </button>
        ))}
      </section>

      <section className="studio-grid">
        <div className="studio-panel">
          <h2>1. ใส่ข้อมูลต้นทาง</h2>
          <label>รูปภาพ</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setImageUrl(''); }} />
          <div className="or-text">หรือ URL รูป</div>
          <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); if (e.target.value.trim()) setImageFile(null); }} placeholder="https://..." />

          {mode === 'food' && <>
            <label>ชื่อเมนู</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น กะเพราหมูกรอบไข่ดาว" />
            <label>ราคา</label><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="69" inputMode="numeric" />
          </>}

          {mode === 'review' && <>
            <label>ข้อความรีวิว</label><textarea rows={5} value={review} onChange={(e) => setReview(e.target.value)} placeholder="เช่น อร่อยมาก ส่งไว แพ็กดี" />
          </>}

          {mode === 'system' && <>
            <label>ชื่อฟีเจอร์ / หัวข้อ</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น รับออเดอร์ออนไลน์แบบเรียลไทม์" />
            <label>Benefit</label><textarea rows={5} value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="เช่น ลดการพิมพ์ผิด ลูกค้าดูสถานะได้เอง ร้านเห็นคิวในหน้าเดียว" />
          </>}
        </div>

        <div className="studio-panel">
          <h2>2. เลือกสไตล์แคปชัน</h2>
          <div className="tone-list">
            {TONES[mode].map(([name, template]) => <button key={name} onClick={() => applyTemplate(template)}>{name}</button>)}
          </div>
          <label>แคปชัน</label>
          <textarea rows={10} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="เลือกสไตล์ด้านบน หรือพิมพ์เองได้เลย" />
        </div>

        <div className="studio-panel preview-panel">
          <h2>3. Preview & Publish</h2>
          <div className="post-preview">
            {preview ? <img src={preview} alt="preview" /> : <div className="preview-empty">เลือกรูปเพื่อดูตัวอย่าง</div>}
            <div className="preview-copy">{caption || 'แคปชันจะแสดงตรงนี้'}</div>
          </div>
          <button className="publish-main" onClick={publish} disabled={loading}>{loading ? 'กำลังโพสต์...' : 'โพสต์ Facebook'}</button>
          {status && <div className="status">{status}</div>}
        </div>
      </section>
    </main>
  );
}
