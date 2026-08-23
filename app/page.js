'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function publishPost() {
    if (!message.trim() && !imageUrl.trim() && !imageFile) {
      setStatus('กรุณาใส่ข้อความหรือเลือกรูปภาพก่อนโพสต์');
      return;
    }

    setLoading(true);
    setStatus('กำลังโพสต์...');

    try {
      let res;

      if (imageFile) {
        const form = new FormData();
        form.append('message', message);
        form.append('image', imageFile);
        res = await fetch('/api/facebook/post', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/facebook/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, imageUrl }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โพสต์ไม่สำเร็จ');

      setStatus(`โพสต์สำเร็จ ✓ ${data.type === 'photo' ? 'Photo' : 'Post'} ID: ${data.id || '-'}`);
      setMessage('');
      setImageUrl('');
      setImageFile(null);
      const input = document.getElementById('imageFile');
      if (input) input.value = '';
    } catch (err) {
      setStatus(`ผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const effectivePreview = previewUrl || imageUrl.trim();

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

        <label htmlFor="imageFile" style={{ marginTop: 16 }}>เลือกรูปจากเครื่อง</label>
        <input
          id="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setImageFile(file);
            if (file) setImageUrl('');
          }}
          style={{ width: '100%', border: '1px solid #d5d9e2', borderRadius: 16, padding: 12, font: 'inherit', marginBottom: 8 }}
        />

        <div style={{ textAlign: 'center', color: '#8a94a6', margin: '10px 0' }}>หรือ</div>

        <label htmlFor="imageUrl">URL รูปภาพ</label>
        <input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (e.target.value.trim()) {
              setImageFile(null);
              const input = document.getElementById('imageFile');
              if (input) input.value = '';
            }
          }}
          placeholder="https://example.com/menu.jpg"
          style={{ width: '100%', border: '1px solid #d5d9e2', borderRadius: 16, padding: 14, font: 'inherit', marginBottom: 8 }}
        />

        {effectivePreview && (
          <div style={{ marginTop: 12, border: '1px solid #e7e9ee', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
            <img src={effectivePreview} alt="Preview" style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain' }} />
          </div>
        )}

        <button onClick={publishPost} disabled={loading}>
          {loading ? 'กำลังโพสต์...' : (imageFile || imageUrl.trim()) ? 'โพสต์รูป + แคปชัน' : 'โพสต์ Facebook'}
        </button>

        {status && <div className="status">{status}</div>}
      </section>
    </main>
  );
}
