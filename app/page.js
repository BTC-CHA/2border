'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function publishPost() {
    if (!message.trim() && !imageUrl.trim()) {
      setStatus('กรุณาใส่ข้อความหรือ URL รูปภาพก่อนโพสต์');
      return;
    }

    setLoading(true);
    setStatus('กำลังโพสต์...');

    try {
      const res = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, imageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โพสต์ไม่สำเร็จ');

      setStatus(`โพสต์สำเร็จ ✓ ${data.type === 'photo' ? 'Photo' : 'Post'} ID: ${data.id || '-'}`);
      setMessage('');
      setImageUrl('');
    } catch (err) {
      setStatus(`ผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="brand">2BOrder</div>
        <h1>Facebook Publisher</h1>
        <p className="sub">โพสต์ข้อความหรือรูปภาพเข้า Facebook Page จากระบบ 2BOrder โดยตรง</p>

        <label htmlFor="message">ข้อความโพสต์ / แคปชัน</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="พิมพ์ข้อความที่ต้องการโพสต์..."
          rows={7}
        />

        <label htmlFor="imageUrl" style={{ marginTop: 16 }}>URL รูปภาพ (ถ้ามี)</label>
        <input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/menu.jpg"
          style={{ width: '100%', border: '1px solid #d5d9e2', borderRadius: 16, padding: 14, font: 'inherit', marginBottom: 8 }}
        />

        {imageUrl.trim() && (
          <div style={{ marginTop: 12, border: '1px solid #e7e9ee', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
            <img src={imageUrl} alt="Preview" style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain' }} />
          </div>
        )}

        <button onClick={publishPost} disabled={loading}>
          {loading ? 'กำลังโพสต์...' : imageUrl.trim() ? 'โพสต์รูป + แคปชัน' : 'โพสต์ Facebook'}
        </button>

        {status && <div className="status">{status}</div>}
      </section>
    </main>
  );
}
