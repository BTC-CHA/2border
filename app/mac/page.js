'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const API = 'https://nfqlgzvsnxnruuozkjdw.supabase.co/functions/v1/a7-mac-collector';

const S = {
  page:{minHeight:'100vh',background:'#f5f7fb',padding:'24px',fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif',color:'#172033'},
  wrap:{maxWidth:760,margin:'0 auto'},
  panel:{background:'#fff',border:'1px solid #e5e9f0',borderRadius:20,padding:22,boxShadow:'0 8px 30px rgba(17,24,39,.06)'},
  badge:{display:'inline-block',padding:'5px 10px',borderRadius:999,background:'#e9f8ef',color:'#18763a',fontWeight:800,fontSize:12},
  title:{fontSize:28,margin:'10px 0 6px'},
  sub:{color:'#687386',lineHeight:1.6,margin:'0 0 18px'},
  count:{padding:'13px 15px',borderRadius:12,background:'#eef4ff',fontWeight:900,marginBottom:16},
  input:{width:'100%',padding:'13px 14px',border:'1px solid #d8dee9',borderRadius:12,fontSize:17,boxSizing:'border-box'},
  label:{display:'block',fontSize:13,color:'#687386',marginBottom:6},
  btn:{width:'100%',border:0,borderRadius:12,padding:'15px 18px',fontSize:18,fontWeight:800,cursor:'pointer',background:'#172033',color:'#fff',marginTop:14},
  status:{marginTop:14,padding:'13px 14px',borderRadius:12,background:'#f1f4f9',color:'#465267',lineHeight:1.5},
  card:{marginTop:18,background:'#fff',border:'1px solid #e5e9f0',borderRadius:18,padding:20,boxShadow:'0 8px 30px rgba(17,24,39,.06)'},
  row:{display:'grid',gridTemplateColumns:'160px 1fr',gap:8,padding:'8px 0',borderBottom:'1px solid #eef1f5'},
  k:{color:'#687386'},v:{fontWeight:700,wordBreak:'break-word'},
};

export default function MacCollectorPage(){
  const [station,setStation]=useState('');
  const [count,setCount]=useState(null);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('พร้อมใช้งาน');
  const [result,setResult]=useState(null);
  const [duplicate,setDuplicate]=useState(null);
  const timer=useRef(null);

  async function refreshCount(){
    try{
      const r=await fetch(API+'?action=summary',{cache:'no-store'});
      const d=await r.json();
      setCount(d.unique_devices ?? 0);
    }catch{ setCount(null); }
  }

  useEffect(()=>{
    refreshCount();
    return ()=>{ if(timer.current) clearInterval(timer.current); };
  },[]);

  async function poll(session){
    try{
      const r=await fetch(API+'?action=status&session='+encodeURIComponent(session),{cache:'no-store'});
      const d=await r.json();
      if(d.status==='reported'){
        if(timer.current) clearInterval(timer.current);
        setResult(d);
        setDuplicate(d.duplicate ? d.previous : null);
        setStatus(d.duplicate ? 'พบว่าเครื่องนี้เคยเก็บแล้ว — แสดงข้อมูลเดิมให้ตรวจสอบ' : 'เก็บข้อมูลสำเร็จ — ย้ายไปเครื่องถัดไปได้เลย');
        setBusy(false);
        refreshCount();
      } else if(d.error){
        if(timer.current) clearInterval(timer.current);
        setStatus('เกิดข้อผิดพลาด: '+d.error);
        setBusy(false);
      }
    }catch{}
  }

  async function collect(){
    setBusy(true);setResult(null);setDuplicate(null);setStatus('กำลังเตรียมไฟล์เก็บข้อมูล...');
    try{
      const r=await fetch(API+'?action=session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({station_label:station.trim()})});
      const d=await r.json();
      if(!r.ok || !d.session) throw new Error(d.error || 'สร้าง session ไม่สำเร็จ');
      const href=API+'?action=download&session='+encodeURIComponent(d.session);
      const a=document.createElement('a');
      a.href=href;
      a.download='Register-PC.cmd';
      document.body.appendChild(a);a.click();a.remove();
      setStatus('ดาวน์โหลด Register-PC.cmd แล้ว — เปิดไฟล์ 1 ครั้ง แล้วกลับมาหน้านี้ ระบบจะอัปเดตเอง');
      timer.current=setInterval(()=>poll(d.session),1200);
      poll(d.session);
    }catch(e){
      setStatus('เกิดข้อผิดพลาด: '+e.message);setBusy(false);
    }
  }

  const rows=useMemo(()=> result ? [
    ['หมายเลขเครื่อง',result.station_label || '-'],
    ['Computer Name',result.pc_name || '-'],
    ['Ethernet MAC',result.ethernet_mac || '-'],
    ['Wi‑Fi MAC',result.wifi_mac || '-'],
    ['IPv4',(result.ip_addresses || []).join(', ') || '-'],
    ['Windows',result.windows_caption || '-'],
  ] : [],[result]);

  return <main style={S.page}><div style={S.wrap}>
    <section style={S.panel}>
      <span style={S.badge}>A7 Solutions</span>
      <h1 style={S.title}>MAC PC Collector</h1>
      <p style={S.sub}>เปิดหน้านี้บนคอมแต่ละเครื่อง → กดเก็บ MAC → เปิดไฟล์ที่ดาวน์โหลด 1 ครั้ง → การ์ดข้อมูลจะขึ้นอัตโนมัติ</p>
      <div style={S.count}>เก็บแล้ว: {count===null?'กำลังตรวจสอบ...':count+' เครื่อง'}</div>
      <label style={S.label}>หมายเลขเครื่อง (ถ้ามี)</label>
      <input style={S.input} value={station} onChange={e=>setStation(e.target.value)} placeholder="เช่น 01" maxLength={40}/>
      <button style={{...S.btn,opacity:busy?.6:1}} disabled={busy} onClick={collect}>{busy?'กำลังรอข้อมูล...':'เก็บ MAC Address เครื่องนี้'}</button>
      <div style={S.status}>{status}</div>
    </section>

    {duplicate && <section style={{...S.card,background:'#fff8e6',borderColor:'#efd47d'}}>
      <div style={{fontWeight:900,fontSize:18}}>⚠️ เครื่องนี้เคยเก็บข้อมูลแล้ว</div>
      <div style={{marginTop:8,lineHeight:1.6}}>ข้อมูลเดิม: เครื่อง {duplicate.station_label || '-'} / {duplicate.pc_name || '-'} / {duplicate.ethernet_mac || duplicate.wifi_mac || '-'}</div>
    </section>}

    {result && <section style={S.card}>
      <div style={{fontWeight:900,fontSize:19,marginBottom:10}}>✅ ข้อมูลเครื่องนี้</div>
      {rows.map(([k,v])=><div key={k} style={S.row}><div style={S.k}>{k}</div><div style={S.v}>{v}</div></div>)}
    </section>}
  </div></main>;
}
