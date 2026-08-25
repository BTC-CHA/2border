'use client';

import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const statusMeta={
 not_started:{label:'ยังไม่เริ่ม',cls:'vx-progress muted'},
 in_progress:{label:'กำลังทำ',cls:'vx-progress working'},
 final:{label:'Final แล้ว',cls:'vx-progress final'}
};

export default function StudentsPage(){
 const [rows,setRows]=useState([]),[assignments,setAssignments]=useState([]),[progress,setProgress]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  const [{data:students,error:se},{data:as,error:ae},{data:pr,error:pe}]=await Promise.all([
   vx.rpc('vx_teacher_students'),
   vx.from('vx_assignments').select('id,title,status,difficulty,question_count').order('created_at',{ascending:false}),
   vx.from('vx_student_assignment_progress').select('*')
  ]);
  const err=se||ae||pe;if(err)setError(err.message);
  setRows(students||[]);setAssignments(as||[]);setProgress(pr||[]);setLoading(false)
 }
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return rows.filter(r=>!q||`${r.full_name} ${r.student_code}`.toLowerCase().includes(q))},[rows,search]);
 const progressMap=useMemo(()=>Object.fromEntries(progress.map(p=>[`${p.student_id}:${p.assignment_id}`,p])),[progress]);
 const statusFor=(studentId,assignmentId)=>progressMap[`${studentId}:${assignmentId}`]?.status||'not_started';
 const finalCount=progress.filter(p=>p.status==='final').length;
 const workingCount=progress.filter(p=>p.status==='in_progress').length;
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="students"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Students</h1><p>ติดตามสถานะการบ้านของนักเรียน · ยังไม่เริ่ม / กำลังทำ / Final แล้ว</p></div></div>
 <div className="vx-grid vx-student-stats" style={{marginBottom:16}}><div className="vx-card"><small>Students</small><h2>{rows.length}</h2></div><div className="vx-card"><small>กำลังทำ</small><h2>{workingCount}</h2></div><div className="vx-card"><small>Final แล้ว</small><h2>{finalCount}</h2></div></div>
 <section className="vx-card"><div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสนักเรียน" style={{flex:'1 1 220px',minWidth:0,padding:11,borderRadius:12,border:'1px solid #ead6ca'}}/><button className="vx-link primary" onClick={load}>Refresh</button></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:<div className="vx-student-list">{filtered.map(r=>{
  const counts={not_started:0,in_progress:0,final:0};assignments.forEach(a=>counts[statusFor(r.student_id,a.id)]++);
  return <article className="vx-card vx-student-card" key={r.student_id}><div className="vx-student-head"><div style={{display:'flex',gap:10,alignItems:'center'}}><div className="vx-logo" style={{width:42,height:42,fontSize:16}}>{(r.full_name||'?')[0]}</div><div><h3 style={{margin:0}}>{r.full_name}</h3><small>{r.student_code}</small></div></div><div className="vx-tags"><span>{counts.in_progress} กำลังทำ</span><span>{counts.final} Final</span></div></div>
  <div className="vx-student-assignments">{assignments.length?assignments.map(a=>{const s=statusFor(r.student_id,a.id),meta=statusMeta[s];return <div className="vx-student-assignment" key={a.id}><div><b>{a.title}</b><small>{a.status==='open'?'เปิดรับงาน':a.status==='draft'?'ฉบับร่าง':'ปิดรับงาน'} · {a.question_count||0} ข้อ</small></div><span className={meta.cls}>{meta.label}</span></div>}):<div className="vx-empty">ยังไม่มี Assignment</div>}</div>
  <div className="vx-tags" style={{marginTop:12}}><span>ทำข้อเดิม {r.questions_attempted||0}</span><span>ผลเก่า {r.total_submissions||0}</span><span>Best avg {Number(r.best_average||0).toFixed(0)}/100</span></div></article>})}</div>}</section>
 </div></main>;
}
