'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { vx } from '../vxClient';
import TeacherNav from './TeacherNav';

const statusLabel={draft:'ฉบับร่าง',open:'เปิดรับงาน',closed:'ปิดรับงาน'};
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};

export default function TeacherPage(){
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [show,setShow]=useState(false); const [saving,setSaving]=useState(false); const [busyId,setBusyId]=useState(null);
  const submitLock=useRef(false);
  async function load(){setLoading(true);setError('');const {data,error}=await vx.from('vx_assignments').select('*, vx_questions(count)').order('created_at',{ascending:false});if(error)setError(error.message);setItems(data||[]);setLoading(false)}
  useEffect(()=>{load()},[]);

  async function getPoolInfo(difficulty){
    const {data:families,error:familyError}=await vx.from('vx_question_families').select('id').eq('category','part_modeling').eq('difficulty',difficulty).eq('is_active',true);
    if(familyError)throw familyError;
    const ids=(families||[]).map(f=>f.id);
    if(!ids.length)return {familyCount:0,variantCount:0};
    const {data:variants,error:variantError}=await vx.from('vx_question_bank').select('family_id').in('family_id',ids).eq('is_active',true);
    if(variantError)throw variantError;
    return {familyCount:new Set((variants||[]).map(v=>v.family_id)).size,variantCount:(variants||[]).length};
  }

  async function ensurePool(difficulty,questionCount){
    const pool=await getPoolInfo(difficulty);
    if(pool.familyCount<questionCount){
      const missing=questionCount-pool.familyCount;
      throw new Error(`Question Bank ระดับ ${diffLabel[difficulty]||difficulty} มี Family พร้อมใช้ ${pool.familyCount} Family แต่ Assignment ต้องการ ${questionCount} ข้อ — ขาดอีก ${missing} Family`);
    }
    return pool;
  }

  async function create(e){
    e.preventDefault(); if(submitLock.current)return; submitLock.current=true; setSaving(true); setError(''); setMessage('');
    const form=e.currentTarget; const fd=new FormData(form);
    try{
      const difficulty=String(fd.get('difficulty')||'basic');
      const questionCount=Number(fd.get('questionCount')||1);
      await ensurePool(difficulty,questionCount);
      const {error}=await vx.from('vx_assignments').insert({title:String(fd.get('title')||'').trim(),course:String(fd.get('course')||'').trim(),description:String(fd.get('description')||'').trim(),status:fd.get('status')||'draft',max_attempts:1,question_category:'part_modeling',difficulty,question_count:questionCount,randomize_questions:fd.get('randomize')==='on'});
      if(error)throw error;
      form.reset(); setShow(false); setMessage('สร้าง Assignment เรียบร้อยแล้ว และ Question Bank มีโจทย์เพียงพอ'); await load(); window.scrollTo({top:0,behavior:'smooth'});
    }catch(err){setError(err.message)}finally{setSaving(false);submitLock.current=false}
  }

  async function setStatus(a,status){
    setBusyId(a.id);setError('');setMessage('');
    try{
      if(status==='open')await ensurePool(a.difficulty||'basic',Number(a.question_count||1));
      const {error}=await vx.from('vx_assignments').update({status,updated_at:new Date().toISOString()}).eq('id',a.id);
      if(error)throw error;
      setMessage(`เปลี่ยน “${a.title}” เป็น ${statusLabel[status]} แล้ว`);await load();
    }catch(err){setError(err.message)}finally{setBusyId(null)}
  }

  async function removeEmpty(a){const count=a.vx_questions?.[0]?.count||0;if(count>0)return setError('Assignment ที่มีโจทย์แล้วต้องลบโจทย์ก่อน');if(!window.confirm(`ลบ “${a.title}” ใช่ไหม?`))return;setBusyId(a.id);setError('');setMessage('');const {error}=await vx.from('vx_assignments').delete().eq('id',a.id);setBusyId(null);if(error)return setError(error.message);setMessage('ลบ Assignment ที่ว่างแล้ว');load()}
  return <main className="vx-page"><div className="vx-wrap">
    <TeacherNav active="assignments"/>
    <header className="vx-top"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>TEACHER MODE</p><h1>Assignments</h1><p>เลือกระดับ จำนวนข้อ และให้ระบบสุ่มจาก Question Bank</p></div><div className="vx-toolbar"><button className="vx-btn primary" onClick={()=>setShow(v=>!v)}><Plus size={16}/>สร้าง Assignment</button></div></header>
    {message&&<div className="vx-success">{message}</div>}
    {show&&<section className="vx-card"><h3>สร้าง Assignment</h3><form className="vx-form" onSubmit={create}><label>ชื่อ Assignment<input name="title" required/></label><label>วิชา / Course<input name="course"/></label><label>คำอธิบาย<textarea name="description" rows="3"/></label><div className="vx-form-row"><label>หมวด<select name="category" defaultValue="part_modeling" disabled><option value="part_modeling">Part Modeling</option></select></label><label>ระดับ<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label></div><div className="vx-form-row"><label>จำนวนข้อ<input name="questionCount" type="number" min="1" defaultValue="3" required/></label><label>สถานะ<select name="status" defaultValue="draft"><option value="draft">ฉบับร่าง</option><option value="open">เปิดรับงาน</option><option value="closed">ปิดรับงาน</option></select></label></div><label><span><input name="randomize" type="checkbox" defaultChecked/> สุ่มโจทย์ให้นักเรียน</span></label><div className="vx-empty" style={{marginTop:0}}>ก่อนสร้างและก่อนเปิดรับงาน ระบบจะเช็กว่า Question Bank ระดับที่เลือกมี Family พร้อมใช้ครบตามจำนวนข้อ · Final Submit ได้ครั้งเดียว</div><button className="vx-btn primary" disabled={saving}>{saving?'กำลังตรวจคลังโจทย์...':'บันทึก'}</button></form></section>}
    {error&&<div className="vx-error">{error}</div>}
    {loading?<div className="vx-empty">กำลังโหลด...</div>:<section className="vx-list">{items.length?items.map(a=>{const oldCount=a.vx_questions?.[0]?.count||0;return <article className="vx-item" key={a.id}><div><h3>{a.title}</h3><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-tags"><span>Part Modeling</span><span>{diffLabel[a.difficulty]||a.difficulty}</span><span>{a.randomize_questions?'สุ่ม':'ไม่สุ่ม'} {a.question_count} ข้อ</span><span>Final ครั้งเดียว</span>{oldCount>0&&<span>โจทย์เดิม {oldCount} ข้อ</span>}</div></div><div className="vx-toolbar"><span className="vx-status">{statusLabel[a.status]||a.status}</span>{a.status!=='open'&&<button className="vx-link secondary" disabled={busyId===a.id} onClick={()=>setStatus(a,'open')}>เปิดรับงาน</button>}{a.status==='open'&&<button className="vx-link secondary" disabled={busyId===a.id} onClick={()=>setStatus(a,'closed')}>ปิดรับงาน</button>}<Link className="vx-link secondary" href={`/verifyx/teacher/assignment/${a.id}`}>จัดการ</Link>{oldCount===0&&<button className="vx-link secondary" disabled={busyId===a.id} onClick={()=>removeEmpty(a)}><Trash2 size={14}/>ลบ</button>}</div></article>}):<div className="vx-empty">ยังไม่มี Assignment</div>}</section>}
  </div></main>
}
