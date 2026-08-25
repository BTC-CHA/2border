'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { vx } from '../vxClient';

const KEY='verifyx-student';

export default function StudentPage(){
  const [identity,setIdentity]=useState(null);
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{try{setIdentity(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{};load()},[]);
  async function load(){const {data,error}=await vx.rpc('vx_get_open_assignments');if(error)setError(error.message);setItems(data||[])}
  function login(e){e.preventDefault();const fd=new FormData(e.currentTarget);const x={studentCode:String(fd.get('code')).trim(),fullName:String(fd.get('name')).trim()};localStorage.setItem(KEY,JSON.stringify(x));setIdentity(x)}
  if(!identity)return <main className="vx-page"><div className="vx-wrap"><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><section className="vx-card vx-login"><div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>STUDENT MODE</p><h2>เข้าสู่ VerifyX</h2><form className="vx-form" onSubmit={login}><label>รหัสนักเรียน<input name="code" required/></label><label>ชื่อ - นามสกุล<input name="name" required/></label><button className="vx-btn primary">เข้าสู่ระบบนักเรียน</button></form></section></div></main>;
  return <main className="vx-page"><div className="vx-wrap"><header className="vx-top"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>STUDENT MODE</p><h1>งานที่เปิดรับ</h1><p>{identity.fullName} · {identity.studentCode}</p></div><div className="vx-toolbar"><Link className="vx-link secondary" href="/verifyx/student/history"><History size={15}/>ประวัติการส่ง</Link><button className="vx-btn secondary" onClick={()=>{localStorage.removeItem(KEY);setIdentity(null)}}>เปลี่ยนผู้ใช้</button></div></header>{error&&<div className="vx-error">{error}</div>}<section className="vx-list">{items.length?items.map(a=><Link className="vx-item" style={{textDecoration:'none',color:'inherit'}} key={a.id} href={`/verifyx/student/assignment/${a.id}`}><div><h3>{a.title}</h3><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-tags"><span>{a.question_count||0} ข้อ</span><span>{a.max_attempts} attempts</span></div></div><span className="vx-status">เปิดรับงาน</span></Link>):<div className="vx-empty">ยังไม่มี Assignment ที่เปิดรับ</div>}</section></div></main>;
}
