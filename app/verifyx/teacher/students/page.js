'use client';

import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const statusMeta={
 not_started:{label:'ยังไม่เริ่ม',cls:'vx-progress muted'},
 in_progress:{label:'กำลังทำ',cls:'vx-progress working'},
 final:{label:'Final แล้ว',cls:'vx-progress final'}
};
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};

export default function StudentsPage(){
 const [rows,setRows]=useState([]),[assignments,setAssignments]=useState([]),[progress,setProgress]=useState([]),[finalRows,setFinalRows]=useState([]),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  const [{data:students,error:se},{data:as,error:ae},{data:pr,error:pe},{data:fr,error:fe}]=await Promise.all([
   vx.rpc('vx_teacher_students'),
   vx.from('vx_assignments').select('id,title,status,difficulty,question_count,course').order('created_at',{ascending:false}),
   vx.from('vx_student_assignment_progress').select('*'),
   vx.rpc('vx_teacher_final_results')
  ]);
  const err=se||ae||pe||fe;if(err)setError(err.message);
  setRows(students||[]);setAssignments(as||[]);setProgress(pr||[]);setFinalRows(fr||[]);setLoading(false)
 }
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return rows.filter(r=>!q||`${r.full_name} ${r.student_code}`.toLowerCase().includes(q))},[rows,search]);
 const progressMap=useMemo(()=>Object.fromEntries(progress.map(p=>[`${p.student_id}:${p.assignment_id}`,p])),[progress]);
 const statusFor=(studentId,assignmentId)=>progressMap[`${studentId}:${assignmentId}`]?.status||'not_started';
 const finalCount=progress.filter(p=>p.status==='final').length;
 const workingCount=progress.filter(p=>p.status==='in_progress').length;
 const finalAgg=useMemo(()=>{
  const map={};
  finalRows.forEach(r=>{const k=`${r.student_id}:${r.assignment_id}`;if(!map[k])map[k]={scores:[],final_at:r.submitted_at||r.final_at||null};map[k].scores.push(Number(r.score||0));if(!map[k].final_at&&(r.submitted_at||r.final_at))map[k].final_at=r.submitted_at||r.final_at});
  Object.values(map).forEach(x=>{x.avg=x.scores.length?Math.round(x.scores.reduce((a,b)=>a+b,0)/x.scores.length):0});
  return map;
 },[finalRows]);
 function openStudent(r){setSelected(r)}
 const selectedAssignments=useMemo(()=>selected?assignments.map(a=>{const p=progressMap[`${selected.student_id}:${a.id}`];const f=finalAgg[`${selected.student_id}:${a.id}`];const status=p?.status||'not_started';return {...a,progress:p,status,finalScore:f?.avg??null,finalAt:p?.final_at||f?.final_at||null}}):[],[selected,assignments,progressMap,finalAgg]);
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="students"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Students</h1><p>ติดตามสถานะการบ้านของนักเรียน · กดรายชื่อเพื่อดูรายละเอียด</p></div></div>
 <div className="vx-grid vx-student-stats" style={{marginBottom:16}}><div className="vx-card"><small>Students</small><h2>{rows.length}</h2></div><div className="vx-card"><small>กำลังทำ</small><h2>{workingCount}</h2></div><div className="vx-card"><small>Final แล้ว</small><h2>{finalCount}</h2></div></div>
 <section className="vx-card"><div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสนักเรียน" style={{flex:'1 1 220px',minWidth:0,padding:11,borderRadius:12,border:'1px solid #ead6ca'}}/><button className="vx-link primary" onClick={load}>Refresh</button></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:<div className="vx-student-list">{filtered.map(r=>{
  const counts={not_started:0,in_progress:0,final:0};assignments.forEach(a=>counts[statusFor(r.student_id,a.id)]++);
  return <button type="button" onClick={()=>openStudent(r)} className="vx-card vx-student-card" key={r.student_id} style={{textAlign:'left',width:'100%',cursor:'pointer'}}><div className="vx-student-head"><div style={{display:'flex',gap:10,alignItems:'center'}}><div className="vx-logo" style={{width:42,height:42,fontSize:16}}>{(r.full_name||'?')[0]}</div><div><h3 style={{margin:0}}>{r.full_name}</h3><small>{r.student_code}</small></div></div><div className="vx-tags"><span>{counts.in_progress} กำลังทำ</span><span>{counts.final} Final</span></div></div><div className="vx-tags" style={{marginTop:12}}><span>ยังไม่เริ่ม {counts.not_started}</span><span>กดเพื่อดูรายละเอียด</span></div></button>})}</div>}</section>
 {selected&&<div style={{position:'fixed',inset:0,background:'rgba(50,30,20,.25)',display:'flex',justifyContent:'flex-end',zIndex:99}} onClick={()=>setSelected(null)}><aside onClick={e=>e.stopPropagation()} style={{width:'min(520px,96vw)',height:'100%',overflow:'auto',background:'#fffaf7',padding:22}}><button onClick={()=>setSelected(null)} style={{float:'right'}}>✕</button><p className="vx-kicker">STUDENT DETAIL</p><h2 style={{marginBottom:4}}>{selected.full_name}</h2><p style={{marginTop:0}}>{selected.student_code}</p><div className="vx-list">{selectedAssignments.map(a=>{const meta=statusMeta[a.status];return <article className="vx-card" key={a.id}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div><h3>{a.title}</h3><p>{a.course||'ไม่ระบุวิชา'} · {diffLabel[a.difficulty]||a.difficulty} · {a.question_count||0} ข้อ</p></div><span className={meta.cls}>{meta.label}</span></div>{a.status==='in_progress'&&<div className="vx-tags"><span>เริ่ม {a.progress?.started_at?new Date(a.progress.started_at).toLocaleString('th-TH'):'—'}</span><span>{a.progress?.flagged_count||0} ธงเหลือง</span></div>}{a.status==='final'&&<><div className="vx-result" style={{marginTop:10}}><div className="vx-score">{a.finalScore??0}/100</div><p>คะแนนเฉลี่ย Final ของ Assignment</p></div><div className="vx-tags"><span>Final {a.finalAt?new Date(a.finalAt).toLocaleString('th-TH'):'—'}</span></div></>}{a.status==='not_started'&&<div className="vx-empty" style={{marginTop:10}}>นักเรียนยังไม่ได้เริ่มงานนี้</div>}</article>})}</div></aside></div>}
 </div></main>;
}
