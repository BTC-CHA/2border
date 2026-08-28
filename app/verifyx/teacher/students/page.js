'use client';

import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const statusMeta={not_started:{label:'ยังไม่เริ่ม',cls:'vx-progress muted'},in_progress:{label:'กำลังทำ',cls:'vx-progress working'},final:{label:'Final แล้ว',cls:'vx-progress final'}};

export default function StudentsPage(){
 const [rows,setRows]=useState([]),[assignments,setAssignments]=useState([]),[progress,setProgress]=useState([]),[finalRows,setFinalRows]=useState([]),[structure,setStructure]=useState([]),[assignmentSections,setAssignmentSections]=useState({});
 const [selected,setSelected]=useState(null),[showAdd,setShowAdd]=useState(false),[search,setSearch]=useState(''),[statusFilter,setStatusFilter]=useState('all'),[sectionFilter,setSectionFilter]=useState('all'),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const sections=useMemo(()=>Array.from(new Map(structure.filter(x=>x.section_id).map(x=>[String(x.section_id),{id:x.section_id,code:x.section_code,name:x.section_name,departmentName:x.department_name}])).values()),[structure]);
 const sectionMap=useMemo(()=>Object.fromEntries(sections.map(s=>[String(s.id),s])),[sections]);

 async function load(){
  setLoading(true);setError('');
  const [{data:students,error:se},{data:as,error:ae},{data:pr,error:pe},{data:fr,error:fe},{data:st,error:ste},{data:maps,error:me}]=await Promise.all([
   vx.from('vx_students').select('student_id:id,student_code,full_name,email,auth_user_id,claimed_at,section_id').order('student_code'),
   vx.from('vx_assignments').select('id,title,status,difficulty,question_count,course,assignment_type,cad_question_count,mcq_question_count').order('created_at',{ascending:false}),
   vx.from('vx_student_assignment_progress').select('*'),
   vx.rpc('vx_teacher_final_results_v2'),
   vx.rpc('vx_teacher_academic_structure'),
   vx.from('vx_assignment_sections').select('assignment_id,section_id')
  ]);
  const err=se||ae||pe||fe||ste||me;if(err)setError(err.message);
  setRows(students||[]);setAssignments(as||[]);setProgress(pr||[]);setFinalRows(fr||[]);setStructure(st||[]);
  const by={};(maps||[]).forEach(x=>{const k=String(x.assignment_id);if(!by[k])by[k]=[];by[k].push(String(x.section_id))});setAssignmentSections(by);setLoading(false)
 }
 useEffect(()=>{load()},[]);

 async function addStudent(e){e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');const form=e.currentTarget,fd=new FormData(form),rawSection=String(fd.get('section')||'');const {error}=await vx.rpc('vx_teacher_upsert_student',{p_student_code:String(fd.get('code')).trim(),p_full_name:String(fd.get('name')).trim(),p_email:String(fd.get('email')).trim().toLowerCase(),p_section_id:rawSection?Number(rawSection):null});setSaving(false);if(error)return setError(error.message);form.reset();setShowAdd(false);setMessage('บันทึกรายชื่อนักเรียนแล้ว');await load()}
 const progressMap=useMemo(()=>Object.fromEntries(progress.map(p=>[`${p.student_id}:${p.assignment_id}`,p])),[progress]);
 const statusFor=(sid,aid)=>progressMap[`${sid}:${aid}`]?.status||'not_started';
 const assignmentApplies=(a,s)=>{const target=assignmentSections[String(a.id)]||[];return !target.length||(s.section_id!=null&&target.includes(String(s.section_id)))};
 const assignmentsFor=s=>assignments.filter(a=>assignmentApplies(a,s));
 const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return rows.filter(r=>{if(q&&!`${r.full_name} ${r.student_code} ${r.email||''}`.toLowerCase().includes(q))return false;if(sectionFilter!=='all'&&String(r.section_id||'')!==sectionFilter)return false;if(statusFilter==='all')return true;return assignmentsFor(r).some(a=>statusFor(r.student_id,a.id)===statusFilter)})},[rows,search,statusFilter,sectionFilter,assignments,assignmentSections,progressMap]);
 const finalAgg=useMemo(()=>{const map={};finalRows.forEach(r=>{const k=`${r.student_id}:${r.assignment_id}`;if(!map[k])map[k]={scores:[],cad:[],mcq:[],final_at:r.submitted_at||null};const sc=Number(r.score||0);map[k].scores.push(sc);if(r.question_type==='cad')map[k].cad.push(sc);if(r.question_type==='mcq')map[k].mcq.push(sc)});Object.values(map).forEach(x=>{x.avg=x.scores.length?Math.round(x.scores.reduce((a,b)=>a+b,0)/x.scores.length):0;x.cadAvg=x.cad.length?Math.round(x.cad.reduce((a,b)=>a+b,0)/x.cad.length):null;x.mcqAvg=x.mcq.length?Math.round(x.mcq.reduce((a,b)=>a+b,0)/x.mcq.length):null});return map},[finalRows]);

 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="students"/>
  <div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Students</h1><p>Roster · Section · Email Verification · สถานะ Assignment</p></div><button className="vx-btn primary" onClick={()=>setShowAdd(v=>!v)}>{showAdd?'ปิดฟอร์ม':'เพิ่มนักเรียน'}</button></div>
  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}
  {showAdd&&<section className="vx-card" style={{marginBottom:16}}><p className="vx-kicker">STUDENT ROSTER</p><h2>เพิ่ม / อัปเดตรายชื่อนักเรียน</h2><p>Email ต้องตรงกับบัญชีที่นักเรียนจะใช้สมัคร VerifyX</p><form className="vx-form" onSubmit={addStudent}><div className="vx-form-row"><label>รหัสนักเรียน<input name="code" required/></label><label>Section<select name="section" defaultValue="" required={sections.length>0}><option value="">{sections.length?'เลือก Section':'ยังไม่มี Section'}</option>{sections.map(s=><option key={s.id} value={s.id}>{s.departmentName} · {s.name} ({s.code})</option>)}</select></label></div><label>ชื่อ - นามสกุล<input name="name" required/></label><label>Email นักเรียน<input name="email" type="email" required/></label><button className="vx-btn primary" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึกรายชื่อ'}</button></form></section>}

  <div className="vx-grid vx-student-stats" style={{marginBottom:16}}><div className="vx-card"><small>Students</small><h2>{rows.length}</h2></div><div className="vx-card"><small>ยืนยันบัญชีแล้ว</small><h2>{rows.filter(r=>r.auth_user_id).length}</h2></div><div className="vx-card"><small>รอยืนยัน</small><h2>{rows.filter(r=>!r.auth_user_id).length}</h2></div></div>
  <section className="vx-card"><div className="vx-form" style={{marginTop:0}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ / รหัส / Email"/><div className="vx-form-row"><label>Section<select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)}><option value="all">ทุก Section</option>{sections.map(s=><option key={s.id} value={String(s.id)}>{s.departmentName} · {s.name}</option>)}</select></label><label>สถานะ Assignment<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="not_started">ยังไม่เริ่ม</option><option value="in_progress">กำลังทำ</option><option value="final">Final แล้ว</option></select></label></div></div>
   {loading?<div className="vx-empty">กำลังโหลด...</div>:<div className="vx-student-list">{filtered.length?filtered.map(r=>{const relevant=assignmentsFor(r),counts={not_started:0,in_progress:0,final:0};relevant.forEach(a=>counts[statusFor(r.student_id,a.id)]++);const section=sectionMap[String(r.section_id||'')];return <button type="button" onClick={()=>setSelected(r)} className="vx-card vx-student-card" key={r.student_id} style={{textAlign:'left',width:'100%',cursor:'pointer'}}><div className="vx-student-head"><div><h3 style={{margin:0}}>{r.full_name}</h3><small>{r.student_code} · {r.email||'ยังไม่มี Email'}</small></div><span className={`vx-progress ${r.auth_user_id?'final':'working'}`}>{r.auth_user_id?'Verified':'Waiting'}</span></div><div className="vx-tags" style={{marginTop:10}}>{section?<span>{section.departmentName} · {section.name}</span>:<span>ยังไม่กำหนด Section</span>}<span>งาน {relevant.length}</span><span>ยังไม่เริ่ม {counts.not_started}</span><span>กำลังทำ {counts.in_progress}</span><span>Final {counts.final}</span></div></button>}):<div className="vx-empty">ไม่พบนักเรียน</div>}</div>}
  </section>

  {selected&&<div style={{position:'fixed',inset:0,background:'rgba(50,30,20,.25)',display:'flex',justifyContent:'flex-end',zIndex:99}} onClick={()=>setSelected(null)}><aside onClick={e=>e.stopPropagation()} style={{width:'min(520px,96vw)',height:'100%',overflow:'auto',background:'#fffaf7',padding:22}}><button onClick={()=>setSelected(null)} style={{float:'right'}}>✕</button><p className="vx-kicker">STUDENT PROFILE</p><h2>{selected.full_name}</h2><p>{selected.student_code}<br/>{selected.email||'ยังไม่มี Email'}<br/>{sectionMap[String(selected.section_id||'')]?`${sectionMap[String(selected.section_id)].departmentName} · ${sectionMap[String(selected.section_id)].name}`:'ยังไม่กำหนด Section'}</p><div className={selected.auth_user_id?'vx-success':'vx-empty'}>{selected.auth_user_id?'Email verified และผูกบัญชีแล้ว':'รอนักเรียนสมัคร → Verify Email → ผูก School Code + Student Code'}</div><div className="vx-list" style={{marginTop:14}}>{assignmentsFor(selected).map(a=>{const p=progressMap[`${selected.student_id}:${a.id}`],status=p?.status||'not_started',f=finalAgg[`${selected.student_id}:${a.id}`],meta=statusMeta[status];return <article className="vx-card" key={a.id}><div className="vx-top"><div><h3>{a.title}</h3><p>{a.course||'ไม่ระบุวิชา'}</p></div><span className={meta.cls}>{meta.label}</span></div><div className="vx-tags"><span>รวม {a.question_count} ข้อ</span>{Number(a.cad_question_count||0)>0&&<span>CAD {a.cad_question_count}</span>}{Number(a.mcq_question_count||0)>0&&<span>ปรนัย {a.mcq_question_count}</span>}</div>{status==='final'&&<div className="vx-result"><div className="vx-score">{f?.avg??0}/100</div><div className="vx-tags">{f?.cadAvg!=null&&<span>CAD {f.cadAvg}</span>}{f?.mcqAvg!=null&&<span>ปรนัย {f.mcqAvg}</span>}</div></div>}</article>})}</div></aside></div>}
 </div></main>;
}
