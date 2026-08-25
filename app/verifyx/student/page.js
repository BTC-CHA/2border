'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, PlayCircle, CheckCircle2, Circle } from 'lucide-react';
import { vx } from '../vxClient';

const KEY='verifyx-student';
const statusLabel={not_started:'ยังไม่เริ่ม',in_progress:'กำลังทำ',final:'Final แล้ว'};
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};

function StatusIcon({status}){
  if(status==='final')return <CheckCircle2 size={15}/>;
  if(status==='in_progress')return <PlayCircle size={15}/>;
  return <Circle size={15}/>;
}

export default function StudentPage(){
  const [identity,setIdentity]=useState(null);
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{try{setIdentity(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{}},[]);
  useEffect(()=>{if(identity)load(identity.studentCode)},[identity]);
  async function load(code){setError('');const {data,error}=await vx.rpc('vx_get_student_assignments',{p_student_code:code});if(error)setError(error.message);setItems(data||[])}
  function login(e){e.preventDefault();const fd=new FormData(e.currentTarget);const x={studentCode:String(fd.get('code')).trim(),fullName:String(fd.get('name')).trim()};localStorage.setItem(KEY,JSON.stringify(x));setIdentity(x)}
  const counts=useMemo(()=>({
    not_started:items.filter(x=>x.progress_status==='not_started').length,
    in_progress:items.filter(x=>x.progress_status==='in_progress').length,
    final:items.filter(x=>x.progress_status==='final').length
  }),[items]);
  if(!identity)return <main className="vx-page"><div className="vx-wrap"><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><section className="vx-card vx-login"><div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>STUDENT MODE</p><h2>เข้าสู่ VerifyX</h2><form className="vx-form" onSubmit={login}><label>รหัสนักเรียน<input name="code" required/></label><label>ชื่อ - นามสกุล<input name="name" required/></label><button className="vx-btn primary">เข้าสู่ระบบนักเรียน</button></form></section></div></main>;
  return <main className="vx-page"><div className="vx-wrap"><header className="vx-top"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>STUDENT MODE</p><h1>การบ้านของฉัน</h1><p>{identity.fullName} · {identity.studentCode}</p></div><div className="vx-toolbar"><Link className="vx-link secondary" href="/verifyx/student/history"><History size={15}/>ผล Final</Link><button className="vx-btn secondary" onClick={()=>{localStorage.removeItem(KEY);setIdentity(null);setItems([])}}>เปลี่ยนผู้ใช้</button></div></header>
  <div className="vx-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',marginBottom:16}}><div className="vx-card"><small>ยังไม่เริ่ม</small><h2>{counts.not_started}</h2></div><div className="vx-card"><small>กำลังทำ</small><h2>{counts.in_progress}</h2></div><div className="vx-card"><small>Final แล้ว</small><h2>{counts.final}</h2></div></div>
  {error&&<div className="vx-error">{error}</div>}<section className="vx-list">{items.length?items.map(a=>{const status=a.progress_status||'not_started';const cta=status==='final'?'ดูผล Final':status==='in_progress'?'ทำต่อ':'เริ่มทำ';return <Link className="vx-item" style={{textDecoration:'none',color:'inherit'}} key={a.id} href={`/verifyx/student/assignment/${a.id}`}><div><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><h3 style={{margin:0}}>{a.title}</h3><span className={`vx-progress ${status==='final'?'final':status==='in_progress'?'working':'muted'}`}><StatusIcon status={status}/>{statusLabel[status]||status}</span></div><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-tags"><span>Part Modeling</span><span>{diffLabel[a.difficulty]||a.difficulty}</span><span>{a.question_count||0} ข้อ</span><span>Final ครั้งเดียว</span></div></div><span className="vx-link secondary" style={{pointerEvents:'none',whiteSpace:'nowrap'}}>{cta}</span></Link>}):<div className="vx-empty">ยังไม่มี Assignment ที่เปิดรับ</div>}</section></div></main>;
}
