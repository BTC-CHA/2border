'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Boxes, CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { vx } from '../../../vxClient';
import TeacherNav from '../../TeacherNav';

const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const statusLabel={draft:'ฉบับร่าง',open:'เปิดรับงาน',closed:'ปิดรับงาน'};
const progressMeta={
 not_started:{label:'ยังไม่เริ่ม',cls:'vx-progress muted'},
 in_progress:{label:'กำลังทำ',cls:'vx-progress working'},
 final:{label:'Final แล้ว',cls:'vx-progress final'}
};

export default function AssignmentDetail(){
 const {id}=useParams();
 const assignmentId=Number(id);
 const [assignment,setAssignment]=useState(null);
 const [families,setFamilies]=useState([]);
 const [bank,setBank]=useState([]);
 const [students,setStudents]=useState([]);
 const [progress,setProgress]=useState([]);
 const [finalRows,setFinalRows]=useState([]);
 const [studentSearch,setStudentSearch]=useState('');
 const [studentStatus,setStudentStatus]=useState('all');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');

 async function load(){
  setLoading(true);setError('');
  const [{data:a,error:ae},{data:f,error:fe},{data:q,error:qe},{data:st,error:se},{data:pr,error:pe},{data:fr,error:fre}]=await Promise.all([
   vx.from('vx_assignments').select('*').eq('id',assignmentId).single(),
   vx.from('vx_question_families').select('*').eq('is_active',true),
   vx.from('vx_question_bank').select('*').eq('is_active',true),
   vx.rpc('vx_teacher_students'),
   vx.from('vx_student_assignment_progress').select('*').eq('assignment_id',assignmentId),
   vx.rpc('vx_teacher_final_results')
  ]);
  const err=ae||fe||qe||se||pe||fre;
  if(err)setError(err.message);
  setAssignment(a||null);
  setFamilies(f||[]);
  setBank(q||[]);
  setStudents(st||[]);
  setProgress(pr||[]);
  setFinalRows((fr||[]).filter(r=>Number(r.assignment_id)===assignmentId));
  setLoading(false);
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

 const progressMap=useMemo(()=>Object.fromEntries(progress.map(p=>[String(p.student_id),p])),[progress]);
 const finalAgg=useMemo(()=>{
  const map={};
  finalRows.forEach(r=>{
   const key=String(r.student_id);
   if(!map[key])map[key]={scores:[],final_at:r.submitted_at||r.final_at||null};
   map[key].scores.push(Number(r.score||0));
  });
  Object.values(map).forEach(x=>{x.avg=x.scores.length?Math.round(x.scores.reduce((a,b)=>a+b,0)/x.scores.length):0});
  return map;
 },[finalRows]);

 const studentRows=useMemo(()=>students.map(s=>{
  const p=progressMap[String(s.student_id)];
  const f=finalAgg[String(s.student_id)];
  return {
   ...s,
   status:p?.status||'not_started',
   flagged_count:p?.flagged_count||0,
   started_at:p?.started_at||null,
   final_at:p?.final_at||f?.final_at||null,
   final_score:f?.avg??null
  };
 }),[students,progressMap,finalAgg]);

 const stats=useMemo(()=>{
  const scores=studentRows.filter(x=>x.final_score!==null).map(x=>Number(x.final_score));
  return {
   total:studentRows.length,
   not_started:studentRows.filter(x=>x.status==='not_started').length,
   in_progress:studentRows.filter(x=>x.status==='in_progress').length,
   final:studentRows.filter(x=>x.status==='final').length,
   flagged:studentRows.reduce((n,x)=>n+Number(x.flagged_count||0),0),
   average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0
  };
 },[studentRows]);

 const visibleStudents=useMemo(()=>{
  const q=studentSearch.trim().toLowerCase();
  return studentRows.filter(s=>{
   const statusOk=studentStatus==='all'||s.status===studentStatus;
   const qOk=!q||`${s.full_name} ${s.student_code}`.toLowerCase().includes(q);
   return statusOk&&qOk;
  });
 },[studentRows,studentSearch,studentStatus]);

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
  <header className="vx-top"><div><Link className="vx-file" href="/verifyx/teacher"><ArrowLeft size={15}/>Assignments</Link><p className="vx-kicker" style={{marginTop:14}}>ASSIGNMENT</p><h1>{assignment.title}</h1><p>{assignment.course||'ไม่ระบุวิชา'} · {statusLabel[assignment.status]||assignment.status}</p></div><div className="vx-toolbar"><button className="vx-btn secondary" onClick={load}><RefreshCw size={15}/>Refresh</button><Link className="vx-btn secondary" href="/verifyx/teacher/question-bank"><Boxes size={15}/>Question Bank</Link></div></header>

  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}

  <section className="vx-card" style={{marginBottom:14}}><p className="vx-kicker">OVERVIEW</p><h2>ภาพรวม Assignment</h2><p>สถานะนักเรียนและผล Final ของงานนี้</p>
   <div className="vx-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',marginTop:14}}>
    <div className="vx-result" style={{marginTop:0}}><small>นักเรียนทั้งหมด</small><div className="vx-score" style={{fontSize:24}}>{stats.total}</div></div>
    <div className="vx-result" style={{marginTop:0}}><small>ยังไม่เริ่ม</small><div className="vx-score" style={{fontSize:24}}>{stats.not_started}</div></div>
    <div className="vx-result" style={{marginTop:0}}><small>กำลังทำ</small><div className="vx-score" style={{fontSize:24}}>{stats.in_progress}</div></div>
    <div className="vx-result" style={{marginTop:0}}><small>Final แล้ว</small><div className="vx-score" style={{fontSize:24}}>{stats.final}</div></div>
    <div className="vx-result" style={{marginTop:0}}><small>คะแนนเฉลี่ย Final</small><div className="vx-score" style={{fontSize:24}}>{stats.average}/100</div></div>
    <div className="vx-result" style={{marginTop:0}}><small>ธงเหลืองค้าง</small><div className="vx-score" style={{fontSize:24}}>{stats.flagged}</div></div>
   </div>
   <div className="vx-form" style={{marginTop:16}}><div className="vx-form-row"><label>ค้นหานักเรียน<input value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} placeholder="ชื่อหรือรหัสนักเรียน"/></label><label>สถานะ<select value={studentStatus} onChange={e=>setStudentStatus(e.target.value)}><option value="all">ทั้งหมด</option><option value="not_started">ยังไม่เริ่ม</option><option value="in_progress">กำลังทำ</option><option value="final">Final แล้ว</option></select></label></div></div>
   <div className="vx-list">{visibleStudents.length?visibleStudents.map(s=>{const meta=progressMeta[s.status];return <article className="vx-item" key={s.student_id}><div><h3>{s.full_name}</h3><p>{s.student_code}</p><div className="vx-tags">{s.status==='in_progress'&&<><span>เริ่ม {s.started_at?new Date(s.started_at).toLocaleString('th-TH'):'—'}</span><span>{s.flagged_count} ธงเหลือง</span></>}{s.status==='final'&&<><span>คะแนน {s.final_score??0}/100</span><span>Final {s.final_at?new Date(s.final_at).toLocaleString('th-TH'):'—'}</span></>}</div></div><span className={meta.cls}>{meta.label}</span></article>}):<div className="vx-empty">ไม่พบนักเรียนตามตัวกรอง</div>}</div>
  </section>

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
