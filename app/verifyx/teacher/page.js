'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { vx } from '../vxClient';
import TeacherNav from './TeacherNav';

export default function TeacherPage(){
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [show,setShow]=useState(false); const [saving,setSaving]=useState(false);
  async function load(){setLoading(true);setError('');const {data,error}=await vx.from('vx_assignments').select('*, vx_questions(count)').order('created_at',{ascending:false});if(error)setError(error.message);setItems(data||[]);setLoading(false)}
  useEffect(()=>{load()},[]);
  async function create(e){e.preventDefault();setSaving(true);const fd=new FormData(e.currentTarget);const {error}=await vx.from('vx_assignments').insert({title:String(fd.get('title')||'').trim(),course:String(fd.get('course')||'').trim(),description:String(fd.get('description')||'').trim(),status:fd.get('status')||'draft',max_attempts:Number(fd.get('maxAttempts')||3)});setSaving(false);if(error)return setError(error.message);e.currentTarget.reset();setShow(false);load()}
  return <main className="vx-page"><div className="vx-wrap">
    <TeacherNav active="assignments"/>
    <header className="vx-top"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>TEACHER MODE</p><h1>Assignments</h1><p>จัดการงานและโจทย์ VerifyX ที่ใช้ prefix vx_</p></div><div className="vx-toolbar"><button className="vx-btn primary" onClick={()=>setShow(v=>!v)}><Plus size={16}/>สร้าง Assignment</button></div></header>
    {show&&<section className="vx-card"><h3>สร้าง Assignment</h3><form className="vx-form" onSubmit={create}><label>ชื่อ Assignment<input name="title" required/></label><label>วิชา / Course<input name="course"/></label><label>คำอธิบาย<textarea name="description" rows="3"/></label><div className="vx-form-row"><label>สถานะ<select name="status" defaultValue="draft"><option value="draft">ฉบับร่าง</option><option value="open">เปิดรับงาน</option><option value="closed">ปิดรับงาน</option></select></label><label>Attempts / ข้อ<input name="maxAttempts" type="number" min="1" defaultValue="3"/></label></div><button className="vx-btn primary" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึก'}</button></form></section>}
    {error&&<div className="vx-error">{error}</div>}
    {loading?<div className="vx-empty">กำลังโหลด...</div>:<section className="vx-list">{items.length?items.map(a=><article className="vx-item" key={a.id}><div><h3>{a.title}</h3><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-tags"><span>{a.vx_questions?.[0]?.count||0} ข้อ</span><span>{a.max_attempts} attempts</span><span>Volume + Area</span></div></div><div className="vx-toolbar"><span className="vx-status">{a.status}</span><Link className="vx-link secondary" href={`/verifyx/teacher/assignment/${a.id}`}>จัดการ</Link></div></article>):<div className="vx-empty">ยังไม่มี Assignment</div>}</section>}
  </div></main>
}
