'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Plus,Trash2,BookOpen,UsersRound,LockKeyhole,ChevronRight} from 'lucide-react';
import {vx} from '../vxClient';
import TeacherNav from './TeacherNav';

const statusLabel={draft:'ฉบับร่าง',open:'เปิดรับงาน',closed:'ปิดรับงาน'};
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const typeLabel={cad:'CAD / Engineering',mcq:'Multiple Choice',mixed:'CAD + Multiple Choice'};

export default function TeacherPage(){
 const [items,setItems]=useState([]),[startedAssignments,setStartedAssignments]=useState(new Set()),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[show,setShow]=useState(false),[saving,setSaving]=useState(false),[busyId,setBusyId]=useState(null);
 const [cadCount,setCadCount]=useState(3),[mcqCount,setMcqCount]=useState(0),[sections,setSections]=useState([]),[selectedSections,setSelectedSections]=useState([]),[assignmentSections,setAssignmentSections]=useState({}),[teacherTeam,setTeacherTeam]=useState([]);
 const submitLock=useRef(false);
 async function load(){
  setLoading(true);setError('');
  const [{data,error},{data:pr,error:pe},{data:structure,error:se},{data:maps,error:me},{data:team,error:te}]=await Promise.all([
   vx.from('vx_assignments').select('*, vx_questions(count)').order('created_at',{ascending:false}),
   vx.from('vx_student_assignment_progress').select('assignment_id'),
   vx.rpc('vx_teacher_academic_structure'),
   vx.from('vx_assignment_sections').select('assignment_id,section_id'),
   vx.rpc('vx_teacher_team')
  ]);
  if(error||pe||se||me||te)setError((error||pe||se||me||te).message);
  setItems(data||[]);setStartedAssignments(new Set((pr||[]).map(x=>Number(x.assignment_id))));setTeacherTeam(team||[]);
  const ss=(structure||[]).filter(x=>x.section_id&&x.section_active).map(x=>({id:Number(x.section_id),code:x.section_code,name:x.section_name,department:x.department_name,year:x.academic_year,term:x.term}));
  setSections(Array.from(new Map(ss.map(x=>[x.id,x])).values()));
  const by={};(maps||[]).forEach(x=>{const k=Number(x.assignment_id);if(!by[k])by[k]=[];by[k].push(Number(x.section_id))});setAssignmentSections(by);
  setLoading(false)
 }
 useEffect(()=>{load()},[]);
 const stats=useMemo(()=>({total:items.length,open:items.filter(x=>x.status==='open').length,draft:items.filter(x=>x.status==='draft').length,locked:items.filter(x=>startedAssignments.has(Number(x.id))).length}),[items,startedAssignments]);
 const sectionMap=useMemo(()=>Object.fromEntries(sections.map(s=>[s.id,s])),[sections]);
 const teacherMap=useMemo(()=>Object.fromEntries(teacherTeam.map(t=>[t.user_id,t.display_name])),[teacherTeam]);
 const draftTotal=Number(cadCount||0)+Number(mcqCount||0);
 async function getPoolInfo(difficulty,subject='SolidWorks',category=''){const {data,error}=await vx.rpc('vx_teacher_assignment_pool_info_v2',{p_difficulty:difficulty,p_subject:subject,p_category_code:category});if(error)throw error;const x=data?.[0]||{};return {cad:Number(x.cad_family_count||0),variants:Number(x.cad_variant_count||0),mcq:Number(x.mcq_question_count||0)}}
 async function ensurePool({difficulty,cadCount,mcqCount,subject='SolidWorks',category=''}){const pool=await getPoolInfo(difficulty,subject,category);if(cadCount>0&&pool.cad<cadCount)throw new Error(`CAD Bank ระดับ ${diffLabel[difficulty]||difficulty} มี Family พร้อมใช้ ${pool.cad} Family แต่ต้องการ ${cadCount} ข้อ`);if(mcqCount>0&&pool.mcq<mcqCount)throw new Error(`MCQ Bank ${subject} ระดับ ${diffLabel[difficulty]||difficulty} มี ${pool.mcq} ข้อ แต่ต้องการ ${mcqCount} ข้อ`);return pool}
 function deriveType(cad,mcq){if(cad>0&&mcq>0)return 'mixed';if(cad>0)return 'cad';return 'mcq'}
 function toggleSection(id){setSelectedSections(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id])}
 async function create(e){
  e.preventDefault();if(submitLock.current)return;submitLock.current=true;setSaving(true);setError('');setMessage('');const form=e.currentTarget;const fd=new FormData(form);
  try{
   const difficulty=String(fd.get('difficulty')||'basic'),cad=Number(cadCount||0),mcq=Number(mcqCount||0),total=cad+mcq,subject=String(fd.get('subject')||'SolidWorks').trim()||'SolidWorks';
   if(total<1)throw new Error('กรุณากำหนดจำนวนข้ออย่างน้อย 1 ข้อ');
   if(sections.length>0&&selectedSections.length===0)throw new Error('กรุณาเลือกอย่างน้อย 1 Section ที่จะได้รับ Assignment');
   await ensurePool({difficulty,cadCount:cad,mcqCount:mcq,subject});const type=deriveType(cad,mcq);
   const {data:created,error}=await vx.from('vx_assignments').insert({title:String(fd.get('title')||'').trim(),course:String(fd.get('course')||'').trim(),description:String(fd.get('description')||'').trim(),status:fd.get('status')||'draft',max_attempts:1,question_category:type==='mcq'?'mcq':'part_modeling',difficulty,question_count:total,randomize_questions:fd.get('randomize')==='on',assignment_type:type,cad_question_count:cad,mcq_question_count:mcq,mcq_subject:subject,mcq_category_code:''}).select('id').single();
   if(error)throw error;
   if(sections.length>0){const {error:mapErr}=await vx.rpc('vx_teacher_set_assignment_sections',{p_assignment_id:created.id,p_section_ids:selectedSections});if(mapErr)throw mapErr}
   form.reset();setCadCount(3);setMcqCount(0);setSelectedSections([]);setShow(false);setMessage(`สร้าง Assignment ${typeLabel[type]||type} รวม ${total} ข้อเรียบร้อยแล้ว`);await load();window.scrollTo({top:0,behavior:'smooth'})
  }catch(err){setError(err.message)}finally{setSaving(false);submitLock.current=false}
 }
 async function setStatus(a,status){setBusyId(a.id);setError('');setMessage('');try{if(status==='open')await ensurePool({difficulty:a.difficulty||'basic',cadCount:Number(a.cad_question_count||0),mcqCount:Number(a.mcq_question_count||0),subject:a.mcq_subject||'SolidWorks',category:a.mcq_category_code||''});const {error}=await vx.from('vx_assignments').update({status,updated_at:new Date().toISOString()}).eq('id',a.id);if(error)throw error;setMessage(`เปลี่ยน “${a.title}” เป็น ${statusLabel[status]} แล้ว`);await load()}catch(err){setError(err.message)}finally{setBusyId(null)}}
 async function removeEmpty(a){if(startedAssignments.has(Number(a.id)))return setError('Assignment นี้มีประวัตินักเรียนแล้ว ห้ามลบ ให้ปิดรับงานแทน');const count=a.vx_questions?.[0]?.count||0;if(count>0)return setError('Assignment ที่มีโจทย์เดิมแล้วต้องลบโจทย์ก่อน');if(!window.confirm(`ลบ “${a.title}” ใช่ไหม?`))return;setBusyId(a.id);const {error}=await vx.from('vx_assignments').delete().eq('id',a.id);setBusyId(null);if(error)return setError(error.message);setMessage('ลบ Assignment แล้ว');load()}
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="assignments"/>
  <section className="vx-dashboard-head"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>TEACHER MODE</p><h1>Assignments</h1><p>สร้างงานจาก CAD Mass Properties และข้อสอบปรนัย พร้อมกำหนด Section เป้าหมาย</p></div><button className="vx-btn primary vx-create-btn" onClick={()=>setShow(v=>!v)}><Plus size={17}/>{show?'ปิดฟอร์ม':'สร้าง Assignment'}</button></section>
  <section className="vx-overview-strip"><div><small>ทั้งหมด</small><strong>{stats.total}</strong></div><div><small>เปิดรับงาน</small><strong>{stats.open}</strong></div><div><small>ฉบับร่าง</small><strong>{stats.draft}</strong></div><div><small>มีประวัตินักเรียน</small><strong>{stats.locked}</strong></div></section>
  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}
  {show&&<section className="vx-card vx-create-panel"><p className="vx-kicker">NEW ASSIGNMENT</p><h2>สร้าง Assignment ใหม่</h2><form className="vx-form" onSubmit={create}><div className="vx-form-row"><label>ชื่อ Assignment<input name="title" required placeholder="เช่น การบ้าน #02"/></label><label>วิชา / Course<input name="course" placeholder="เช่น Drawing 001"/></label></div><label>คำอธิบาย<textarea name="description" rows="3"/></label><div className="vx-form-row"><label>ระดับ<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>Subject สำหรับปรนัย<input name="subject" defaultValue="SolidWorks"/></label></div><div className="vx-form-row"><label>CAD / Mass Properties<input value={cadCount} onChange={e=>setCadCount(Math.max(0,Number(e.target.value)||0))} type="number" min="0"/></label><label>ปรนัย Multiple Choice<input value={mcqCount} onChange={e=>setMcqCount(Math.max(0,Number(e.target.value)||0))} type="number" min="0"/></label></div><div className="vx-card" style={{padding:14}}><div className="vx-tags"><span>CAD {cadCount}</span><span>ปรนัย {mcqCount}</span><span><b>รวม {draftTotal} ข้อ</b></span></div></div>
   {sections.length>0?<div><p className="vx-kicker">TARGET SECTION</p><div className="vx-list">{sections.map(s=><label key={s.id} className="vx-card" style={{display:'flex',gap:10,alignItems:'center',padding:12,cursor:'pointer'}}><input type="checkbox" checked={selectedSections.includes(s.id)} onChange={()=>toggleSection(s.id)}/><span><b>{s.department} · {s.name}</b> <small>({s.code})</small></span></label>)}</div></div>:<div className="vx-empty">โรงเรียนยังไม่มี Section · Assignment นี้จะมองเห็นได้ทั้งโรงเรียน</div>}
   <div className="vx-form-row"><label>สถานะ<select name="status" defaultValue="draft"><option value="draft">ฉบับร่าง</option><option value="open">เปิดรับงาน</option><option value="closed">ปิดรับงาน</option></select></label><label className="vx-checkline"><input name="randomize" type="checkbox" defaultChecked/><span>สุ่มโจทย์ และสลับตัวเลือกปรนัย</span></label></div><button className="vx-btn primary" disabled={saving||draftTotal<1||(sections.length>0&&selectedSections.length===0)}>{saving?'กำลังตรวจคลังโจทย์...':`บันทึก Assignment · ${draftTotal} ข้อ`}</button></form></section>}
  {loading?<div className="vx-empty">กำลังโหลด...</div>:<section className="vx-assignment-grid">{items.length?items.map(a=>{const oldCount=a.vx_questions?.[0]?.count||0,hasHistory=startedAssignments.has(Number(a.id)),type=a.assignment_type||'cad',targetIds=assignmentSections[Number(a.id)]||[];return <article className="vx-assignment-card" key={a.id}><div className="vx-assignment-main"><div className="vx-assignment-icon"><BookOpen size={20}/></div><div className="vx-assignment-copy"><div className="vx-assignment-title-row"><h3>{a.title}</h3><span className={`vx-assignment-status ${a.status}`}>{statusLabel[a.status]||a.status}</span></div><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-assignment-meta"><span>ครู {teacherMap[a.created_by]||'—'}</span><span>{typeLabel[type]||type}</span><span>{diffLabel[a.difficulty]||a.difficulty}</span>{Number(a.cad_question_count||0)>0&&<span>CAD {a.cad_question_count}</span>}{Number(a.mcq_question_count||0)>0&&<span>ปรนัย {a.mcq_question_count}</span>}<span>รวม {a.question_count} ข้อ</span>{targetIds.length?targetIds.map(id=><span key={id}>Section {sectionMap[id]?.name||id}</span>):<span>Legacy · ทั้งโรงเรียน</span>}{hasHistory&&<span><LockKeyhole size={12}/>ล็อกกติกาแล้ว</span>}</div></div></div><div className="vx-assignment-footer"><div className="vx-assignment-note"><UsersRound size={14}/>{hasHistory?'มีนักเรียนเริ่มงานแล้ว':'ยังไม่มีประวัตินักเรียน'}</div><div className="vx-assignment-actions">{a.status!=='open'&&<button className="vx-link secondary" disabled={busyId===a.id} onClick={()=>setStatus(a,'open')}>เปิดรับงาน</button>}{a.status==='open'&&<button className="vx-link secondary" disabled={busyId===a.id} onClick={()=>setStatus(a,'closed')}>ปิดรับงาน</button>}<Link className="vx-link primary" href={`/verifyx/teacher/assignment/${a.id}`}>จัดการ<ChevronRight size={15}/></Link>{!hasHistory&&oldCount===0&&<button className="vx-icon-btn danger" title="ลบ" disabled={busyId===a.id} onClick={()=>removeEmpty(a)}><Trash2 size={15}/></button>}</div></div></article>}):<div className="vx-empty">ยังไม่มี Assignment</div>}</section>}
 </div></main>
}
