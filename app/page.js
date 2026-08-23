'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function publishPost() {
    if (!message.trim()) {
      setStatus('กรุณาใส่ข้อความก่อนโพสต์');
      return;
    }

    setLoading(true);
    setStatus('กำลังโพสต์...');

    try {
      const res = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โพสต์ไม่สำเร็จ');

      setStatus(`โพสต์สำเร็จ ✓ Post ID: ${data.id}`);
      setMessage('');
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
        <p className="sub">โพสต์เข้า Facebook Page จากระบบ 2BOrder โดยตรง</p>

        <label htmlFor="message">ข้อความโพสต์</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="พิมพ์ข้อความที่ต้องการโพสต์..."
          rows={8}
        />

        <button onClick={publishPost} disabled={loading}>
          {loading ? 'กำลังโพสต์...' : 'โพสต์ Facebook'}
        </button>

        {status && <div className="status">{status}</div>}
      </section>
    </main>
  );
}
