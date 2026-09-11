'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const API = 'https://nfqlgzvsnxnruuozkjdw.supabase.co/functions/v1/a7-mac-collector';

const S = {
  page:{minHeight:'100vh',background:'#f5f7fb',padding:'24px',fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif',color:'#172033'},
  wrap:{maxWidth:820,margin:'0 auto'},
  panel:{background:'#fff',border:'1px solid #e5e9f0',borderRadius:20,padding:22,boxShadow:'0 8px 30px rgba(17,24,39,.06)'},
  badge:{display:'inline-block',padding:'5px 10px',borderRadius:999,background:'#e9f8ef',color:'#18763a',fontWeight:800,fontSize:12},
  title:{fontSize:28,margin:'10px 0 6px'},
  sub:{color:'#687386',lineHeight:1.6,margin:'0 0 18px'},
  count:{padding:'13px 15px',borderRadius:12,background:'#eef4ff',fontWeight:900,marginBottom:16,fontSize:17},
  input:{width:'100%',padding:'13px 14px',border:'1px solid #d8dee9',borderRadius:12,fontSize:17,boxSizing:'border-box'},
  label:{display:'block',fontSize:13,color:'#687386',marginBottom:6},
  btn:{width:'100%',border:0,borderRadius:12,padding:'15px 18px',fontSize:18,fontWeight:800,cursor:'pointer',background:'#172033',color:'#fff',marginTop:14},
  miniBtn:{border:'1px solid #cfd8e3',background:'#fff',color:'#172033',borderRadius:11,padding:'11px 14px',fontSize:14,fontWeight:800,cursor:'pointer'},
  actions:{display:'flex',gap:8,flexWrap:'wrap',marginTop:12},
  status:{marginTop:14,padding:'13px 14px',borderRadius:12,background:'#f1f4f9',color:'#465267',lineHeight:1.5},
  card:{marginTop:14,background:'#fff',border:'1px solid #e5e9f0',borderRadius:18,padding:20,boxShadow:'0 8px 26px rgba(17,24,39,.05)'},
  cardHead:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:10},
  no:{fontSize:25,fontWeight:950,letterSpacing:'.02em'},
  pcTag:{padding:'6px 10px',borderRadius:999,background:'#eef4ff',fontWeight:900,fontSize:13},
  row:{display:'grid',gridTemplateColumns:'160px 1fr',gap:8,padding:'8px 0',borderBottom:'1px solid #eef1f5'},
  k:{color:'#687386'},v:{fontWeight:700,wordBreak:'break-word'},
  sectionTitle:{fontSize:18,fontWeight:900,margin:'20px 2px 4px'},
  empty:{padding:'24px',textAlign:'center',color:'#7b8492'},
};

function padNo(n){ return String(n || 0).padStart(3,'0'); }
function csvEscape(v){ return `"${String(v ?? '').replaceAll('"','""')}"`; }
function formatTime(v){
  if(!v) return '-';
  try{return new Date(v).toLocaleString('th-TH');}catch{return String(v);}
}

export default function MacCollectorPage(){
  const [station,setStation]=useState('');
  const [devices,setDevices]=useState([]);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('พร้อมใช้งาน');
  const [duplicate,setDuplicate]=useState(null);
  const timer=useRef(null);

  async function refreshDevices(){
    try{
      const r=await fetch(API+'?action=list',{cache:'no-store'});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error || 'โหลดรายการไม่สำเร็จ');
      setDevices(Array.isArray(d.devices)?d.devices:[]);
    }catch{
      setStatus('โหลดรายการเครื่องไม่สำเร็จ — ลอง Refresh หน้าเว็บ');
    }
  }

  useEffect(()=>{
    refreshDevices();
    return ()=>{ if(timer.current) clearInterval(timer.current); };
  },[]);

  async function poll(session){
    try{
      const r=await fetch(API+'?action=status&session='+encodeURIComponent(session),{cache:'no-store'});
      const d=await r.json();
      if(d.status==='reported'){
        if(timer.current) clearInterval(timer.current);
        setDuplicate(d.duplicate ? d.previous : null);
        setStatus(d.duplicate ? 'พบว่าเครื่องนี้เคยเก็บแล้ว — ระบบไม่เพิ่มเป็นเครื่องใหม่' : 'เก็บข้อมูลสำเร็จ — ย้ายไปเครื่องถัดไปได้เลย');
        setBusy(false);
        await refreshDevices();
      } else if(d.error){
        if(timer.current) clearInterval(timer.current);
        setStatus('เกิดข้อผิดพลาด: '+d.error);
        setBusy(false);
      }
    }catch{}
  }

  async function collect(){
    setBusy(true);setDuplicate(null);setStatus('กำลังเตรียมไฟล์เก็บข้อมูล...');
    try{
      const r=await fetch(API+'?action=session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({station_label:station.trim()})});
      const d=await r.json();
      if(!r.ok || !d.session) throw new Error(d.error || 'สร้าง session ไม่สำเร็จ');
      const href=API+'?action=download&session='+encodeURIComponent(d.session);
      const a=document.createElement('a');
      a.href=href;a.download='Register-PC.cmd';document.body.appendChild(a);a.click();a.remove();
      setStatus('ดาวน์โหลด Register-PC.cmd แล้ว — เปิดไฟล์ 1 ครั้ง แล้วกลับมาหน้านี้ ระบบจะอัปเดตเอง');
      timer.current=setInterval(()=>poll(d.session),1200);
      poll(d.session);
    }catch(e){
      setStatus('เกิดข้อผิดพลาด: '+e.message);setBusy(false);
    }
  }

  function exportCsv(){
    if(!devices.length) return;
    const rows=[
      ['No.','PC No.','Computer Name','Ethernet MAC','Wi-Fi MAC','IPv4','Windows','Collected Time'],
      ...devices.map(d=>[
        padNo(d.capture_no),d.station_label||'',d.pc_name||'',d.ethernet_mac||'',d.wifi_mac||'',
        (d.ip_addresses||[]).join(' | '),d.windows_caption||'',d.last_reported_at||d.reported_at||''
      ])
    ];
    const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='A7-MAC-PC-Collector.csv';a.click();URL.revokeObjectURL(a.href);
  }

  async function copyAll(){
    if(!devices.length) return;
    const text=devices.map(d=>`No.${padNo(d.capture_no)} | PC ${d.station_label||'-'} | ${d.pc_name||'-'} | LAN ${d.ethernet_mac||'-'} | Wi-Fi ${d.wifi_mac||'-'}`).join('\n');
    try{await navigator.clipboard.writeText(text);setStatus('Copy ข้อมูลทั้งหมดแล้ว');}
    catch{setStatus('Copy ไม่สำเร็จ — ใช้ Export CSV แทนได้เลย');}
  }

  const shown=useMemo(()=>[...devices].sort((a,b)=>(b.capture_no||0)-(a.capture_no||0)),[devices]);

  return <main style={S.page}><div style={S.wrap}>
    <section style={S.panel}>
      <span style={S.badge}>A7 Solutions</span>
      <h1 style={S.title}>MAC PC Collector</h1>
      <p style={S.sub}>เปิดหน้านี้บนคอมแต่ละเครื่อง → กดเก็บ MAC → เปิดไฟล์ที่ดาวน์โหลด 1 ครั้ง → การ์ดจะค้างอยู่ในรายการด้านล่าง</p>
      <div style={S.count}>เก็บแล้ว: {devices.length} เครื่อง</div>
      <label style={S.label}>หมายเลขเครื่อง (ถ้ามี)</label>
      <input style={S.input} value={station} onChange={e=>setStation(e.target.value)} placeholder="เช่น 01" maxLength={40}/>
      <button style={{...S.btn,opacity:busy?.6:1}} disabled={busy} onClick={collect}>{busy?'กำลังรอข้อมูล...':'เก็บ MAC Address เครื่องนี้'}</button>
      <div style={S.actions}>
        <button style={{...S.miniBtn,opacity:devices.length?1:.5}} disabled={!devices.length} onClick={exportCsv}>Export CSV</button>
        <button style={{...S.miniBtn,opacity:devices.length?1:.5}} disabled={!devices.length} onClick={copyAll}>Copy All</button>
        <button style={S.miniBtn} onClick={refreshDevices}>Refresh รายการ</button>
      </div>
      <div style={S.status}>{status}</div>
    </section>

    {duplicate && <section style={{...S.card,background:'#fff8e6',borderColor:'#efd47d'}}>
      <div style={{fontWeight:900,fontSize:18}}>⚠️ เครื่องนี้เคยเก็บข้อมูลแล้ว</div>
      <div style={{marginTop:8,lineHeight:1.6}}>ข้อมูลเดิม: PC {duplicate.station_label || '-'} / {duplicate.pc_name || '-'} / {duplicate.ethernet_mac || duplicate.wifi_mac || '-'}</div>
    </section>}

    <div style={S.sectionTitle}>รายการเครื่องที่เก็บแล้ว</div>
    {!shown.length && <div style={S.empty}>ยังไม่มีข้อมูล</div>}
    {shown.map(d=><section key={(d.ethernet_mac||d.wifi_mac||d.session_id)+'-'+d.capture_no} style={S.card}>
      <div style={S.cardHead}>
        <div style={S.no}>No.{padNo(d.capture_no)}</div>
        <div style={S.pcTag}>PC {d.station_label || '-'}</div>
      </div>
      <div style={S.row}><div style={S.k}>Computer Name</div><div style={S.v}>{d.pc_name || '-'}</div></div>
      <div style={S.row}><div style={S.k}>Ethernet MAC</div><div style={S.v}>{d.ethernet_mac || '-'}</div></div>
      <div style={S.row}><div style={S.k}>Wi‑Fi MAC</div><div style={S.v}>{d.wifi_mac || '-'}</div></div>
      <div style={S.row}><div style={S.k}>IPv4</div><div style={S.v}>{(d.ip_addresses||[]).join(', ') || '-'}</div></div>
      <div style={S.row}><div style={S.k}>Windows</div><div style={S.v}>{d.windows_caption || '-'}</div></div>
      <div style={{...S.row,borderBottom:0}}><div style={S.k}>Collected</div><div style={S.v}>{formatTime(d.last_reported_at||d.reported_at)}</div></div>
    </section>)}
  </div></main>;
}
