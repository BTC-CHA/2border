'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Boxes, CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { vx } from '../../../vxClient';
import TeacherNav from '../../TeacherNav';

const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const statusLabel={draft:'ฉบับร่าง',open:'เปิดรับงาน',closed:'ปิดรับงาน'};

export default function AssignmentDetail(){
 const {id}=useParams();
 const assignmentId=Number(id);
 const [assignment,setAssignment]=useState(null);
 const [families,setFamilies]=useState([]);
 const [bank,setBank]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');

 async function load(){
  setLoading(true);setError('');
  const [{data:a,error:ae},{data:f,error:fe},{data:q,error:qe}]=await Promise.all([
   vx.from('vx_assignments').select('*').eq('id',assignmentId).single(),
   vx.from('vx_question_families').select('*').eq('is_active',true),
   vx.from('vx_question_bank').select('*').eq('is_active',true)
  ]);
  if(ae||fe||qe)setError((ae||fe||qe).message);
  setAssignment(a||null);setFamilies(f||[]);setBank(q||[]);setLoading(false);
 }
 useEffect(()=>{if(assignmentId)load()},[assignmentId]);

 const eligibleFamilies=useMemo(()=>{
  if(!assignment)return [];
  const ids=new Set(bank.map(q=>q.family_id));
  return families.filter(f=>f.category===assignment.question_category&&f.difficulty===assignment.difficulty&&ids.has(f.id));
 },[assignment,families,bank]);

 const eligibleVariants=useMemo(()=>{
  const ids=new Set(eligibleFamilies.map(f=>f.id));
  return bank.filter(q=>ids.has(q.family_id));
 },[eligibleFamilies,bank]);

 const familyRows=useMemo(()=>eligibleFamilies.map(f=>({
  ...f,
  variants:eligibleVariants.filter(q=>q.family_id===f.id)
 })),[eligibleFamilies,eligibleVariants]);

 const ready=assignment ? eligibleFamilies.length>=Number(assignment.question_count||0) : false;
 const missing=assignment ? Math.max(0,Number(assignment.question_count||0)-eligibleFamilies.length) : 0;

 async function saveRules(e){
  e.preventDefault();setError('');setMessage('');
  const fd=new FormData(e.currentTarget);
  const difficulty=String(fd.get('difficulty'));
  const questionCount=Number(fd.get('questionCount'));
  const randomize=fd.get('randomize')==='on';
  const familyIds=new Set(bank.map(q=>q.family_id));
  const available=families.filter(f=>f.is_active&&f.category==='part_modeling'&&f.difficulty===difficulty&&familyIds.has(f.id)).length;
  if(questionCount>available){setError(`ระดับ ${diffLabel[difficulty]} มี Family พร้อมใช้ ${available} กลุ่ม แต่ต้องการ ${questionCount} ข้อ`);return;}
  const {error}=await vx.from('vx_assignments').update({difficulty,question_count:questionCount,randomize_questions:randomize,updated_at:new Date().toISOString()}).eq('id',assignmentId);
  if(error)return setError(error.message);
  setMessage('บันทึกกติกา Assignment แล้ว');await load();
 }

 if(loading||!assignment)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังโหลด Assignment...</div></div></main>;

 return <main className="vx-page"><div className="vx-wrap">
  <TeacherNav active="assignments"/>
  <header className="vx-top"><div><Link className="vx-file" href="/verifyx/teacher"><ArrowLeft size={15}/>Assignments</Link><p className="vx-kicker" style={{marginTop:14}}>ASSIGNMENT RULES</p><h1>{assignment.title}</h1><p>{assignment.course||'ไม่ระบุวิชา'} · {statusLabel[assignment.status]||assignment.status}</p></div><Link className="vx-btn secondary" href="/verifyx/teacher/question-bank"><Boxes size={15}/>Question Bank</Link></header>

  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}

  <section className="vx-card"><div className="vx-top" style={{marginBottom:12}}><div><p className="vx-kicker">RULE</p><h3>กติกาการบ้าน</h3><p>Assignment นี้ดึงโจทย์จาก Question Bank อัตโนมัติ ไม่ต้องเพิ่มโจทย์ทีละข้อ</p></div><span className="vx-status">Final ครั้งเดียว</span></div>
   <form className="vx-form" onSubmit={saveRules}><div className="vx-form-row"><label>หมวด<select disabled defaultValue="part_modeling"><option value="part_modeling">Part Modeling</option></select></label><label>ระดับ<select name="difficulty" defaultValue={assignment.difficulty||'basic'}><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label></div><div className="vx-form-row"><label>จำนวนข้อ<input name="questionCount" type="number" min="1" defaultValue={assignment.question_count||1} required/></label><label><span><input name="randomize" type="checkbox" defaultChecked={assignment.randomize_questions!==false}/> สุ่มโจทย์ให้นักเรียน</span></label></div><button className="vx-btn primary">บันทึกกติกา</button></form>
  </section>

  <section className="vx-card" style={{marginTop:14}}><div className="vx-top" style={{marginBottom:10}}><div><p className="vx-kicker">BANK READINESS</p><h3>ความพร้อมของคลังโจทย์</h3></div><button className="vx-file" onClick={load}><RefreshCw size={14}/>เช็กใหม่</button></div>
   <div className={ready?'vx-success':'vx-error'} style={{marginTop:0,display:'flex',alignItems:'center',gap:8}}>{ready?<CheckCircle2 size={18}/>:<CircleAlert size={18}/>}<span>{ready?`พร้อมใช้งาน · ต้องการ ${assignment.question_count} ข้อ · มี ${eligibleFamilies.length} Family / ${eligibleVariants.length} Variant`:`ยังไม่พร้อม · ขาดอีก ${missing} Family สำหรับระดับ ${diffLabel[assignment.difficulty]}`}</span></div>
   <div className="vx-tags"><span>หมวด Part Modeling</span><span>ระดับ {diffLabel[assignment.difficulty]}</span><span>{eligibleFamilies.length} Families</span><span>{eligibleVariants.length} Variants</span><span>{assignment.randomize_questions?'Random ON':'Random OFF'}</span></div>
  </section>

  <section className="vx-list"><div className="vx-top" style={{margin:'18px 0 0'}}><div><p className="vx-kicker">RANDOM POOL PREVIEW</p><h3>โจทย์ที่มีโอกาสถูกสุ่ม</h3><p>ระบบเลือกได้สูงสุด 1 Variant ต่อ Family สำหรับนักเรียนหนึ่งคน</p></div></div>
   {familyRows.length?familyRows.map(f=><article className="vx-card" key={f.id}><div className="vx-top" style={{marginBottom:10}}><div><p className="vx-kicker">{f.code} · {diffLabel[f.difficulty]}</p><h3>{f.name}</h3><p>{f.description||'Part Modeling'}</p></div><span className="vx-status">{f.variants.length} variants</span></div><div className="vx-tags">{f.variants.map(v=><span key={v.id}>{v.variant_code} · {v.title}</span>)}</div></article>):<div className="vx-empty">ยังไม่มี Family ที่พร้อมใช้สำหรับระดับนี้ ไปเพิ่มหรือเปิดใช้โจทย์ใน Question Bank ก่อน</div>}
  </section>
 </div></main>;
}
