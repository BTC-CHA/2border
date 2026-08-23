'use client';

import { useEffect, useMemo, useState } from 'react';

function buildMenuCaption(menu) {
  if (!menu) return '';
  const lines = [
    `🍽️ เมนูแนะนำวันนี้: ${menu.name}`,
    `ราคา ${Number(menu.price || 0).toLocaleString('th-TH')} บาท`,
  ];
  if (menu.description) lines.push(menu.description);
  lines.push('', 'สั่งอาหารผ่านเว็บ 2BOrder ได้เลยครับ');
  return lines.join('\n');
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [menusError, setMenusError] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    loadMenus();
  }, []);

  async function loadMenus() {
    setMenusLoading(true);
    setMenusError('');
    try {
      const res = await fetch('/api/menus', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'โหลดเมนูไม่สำเร็จ');
      setMenus(data.menus || []);
    } catch (error) {
      setMenusError(error.message || 'โหลดเมนูไม่สำเร็จ');
      setMenus([]);
    } finally {
      setMenusLoading(false);
    }
  }

  const selectedMenu = useMemo(
    () => menus.find((menu) => String(menu.id) === String(selectedMenuId)) || null,
    [menus, selectedMenuId]
  );

  function chooseMenu(menu) {
    setSelectedMenuId(String(menu.id));
    setMessage(buildMenuCaption(menu));
    setImageFile(null);
    const input = document.getElementById('imageFile');
    if (input) input.value = '';
    setImageUrl(menu.image_url || '');
    setStatus(menu.image_url ? 'เลือกเมนูแล้ว ✓ รูปและแคปชันถูกใส่ให้อัตโนมัติ' : 'เลือกเมนูแล้ว ✓ เมนูนี้ยังไม่มีรูปในระบบ');
  }

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
        <p className="sub">เลือกเมนู → รูปและแคปชันเด้งอัตโนมัติ → กดโพสต์ได้เลย</p>

        <div style={{ marginBottom: 20, padding: 14, border: '1px solid #e7e9ee', borderRadius: 16, background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <strong>🍚 เลือกเมนูจากร้าน</strong>
            <button type="button" onClick={loadMenus} disabled={menusLoading} style={{ width: 'auto', marginTop: 0, padding: '8px 12px', background: '#111827' }}>↻ รีเฟรช</button>
          </div>

          {menusLoading ? (
            <div style={{ color: '#667085' }}>กำลังโหลดเมนู...</div>
          ) : menusError ? (
            <div style={{ color: '#b42318', lineHeight: 1.5 }}>{menusError}</div>
          ) : (
            <select
              value={selectedMenuId}
              onChange={(e) => {
                const menu = menus.find((item) => String(item.id) === e.target.value);
                if (menu) chooseMenu(menu);
                else setSelectedMenuId('');
              }}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d5d9e2', font: 'inherit', background: '#fff' }}
            >
              <option value="">— เลือกเมนู —</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} · {Number(menu.price || 0).toLocaleString('th-TH')} บ. · {menu.category}
                </option>
              ))}
            </select>
          )}

          {selectedMenu && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#667085' }}>
              เลือกแล้ว: <strong style={{ color: '#111827' }}>{selectedMenu.name}</strong>
              {selectedMenu.image_url ? ' · มีรูป ✓' : ' · ยังไม่มีรูป'}
            </div>
          )}
        </div>

        <label htmlFor="message">ข้อความโพสต์ / แคปชัน</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="พิมพ์ข้อความที่ต้องการโพสต์..."
          rows={7}
        />

        {selectedMenu && (
          <button
            type="button"
            onClick={() => setMessage(buildMenuCaption(selectedMenu))}
            style={{ width: 'auto', marginTop: 10, background: '#111827', padding: '9px 12px' }}
          >
            ✨ สร้างแคปชันใหม่
          </button>
        )}

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
