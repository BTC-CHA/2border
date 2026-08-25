'use client';

import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(3):'—';
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
export default function ResultsPage(){
 const [rows,setRows]=useState([]),[assignmentMeta,setAssignmentMeta]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[assignment,setAssignment]=useState('all'),[student,setStudent]=useState('all'),[difficulty,setDifficulty]=useState('all'),[result,setResult]=useState('all'),[selected,setSelected]=useState(null),[error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  const [{data,error},{data:as,error:ae}]=await Promise.all([
   vx.rpc('vx_teacher_final_results'),
   vx.from('vx_assignments').select('id,title,difficulty,course,status').order('created_at',{ascending:false})
  ]);
  if(error||ae)setError((error||ae).message);setRows(data||[]);setAssignmentMeta(as||[]);setLoading(false)
 }
 useEffect(()=>{load()},[]);
 const metaMap=useMemo(()=>Object.fromEntries(assignmentMeta.map(a=>[String(a.id),a])),[assignmentMeta]);
 const enriched=useMemo(()=>rows.map(r=>({...r,difficulty:metaMap[String(r.assignment_id)]?.difficulty||null,course:metaMap[String(r.assignment_id)]?.course||''})),[rows,metaMap]);
 const assignments=useMemo(()=>Array.from(new Map(enriched.map(r=>[String(r.assignment_id),r.assignment_title])).entries()),[enriched]);
 const students=useMemo(()=>Array.from(new Map(enriched.map(r=>[String(r.student_id),`${r.student_name} · ${r.student_code}`])).entries()),[enriched]);
 const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return enriched.filter(r=>{
   const qOk=!q||`${r.student_name} ${r.student_code} ${r.assignment_title} ${r.question_title} ${r.course}`.toLowerCase().includes(q);
   const aOk=assignment==='all'||String(r.assignment_id)===assignment;
   const sOk=student==='all'||String(r.student_id)===student;
   const dOk=difficulty==='all'||r.difficulty===difficulty;
   const passBoth=Boolean(r.volume_pass)&&Boolean(r.area_pass);
   const rOk=result==='all'||(result==='pass'?passBoth:!passBoth);
   return qOk&&aOk&&sOk&&dOk&&rOk;
 })},[enriched,search,assignment,student,difficulty,result]);
 function clearFilters(){setSearch('');setAssignment('all');setStudent('all');setDifficulty('all');setResult('all')}
 function csv(){
  const h=['student_code','student_name','assignment','difficulty','question_number','question_title','score','volume','reference_volume','volume_error_percent','volume_pass','surface_area','reference_area','area_error_percent','area_pass','mass','reference_mass','com_x','com_y','com_z','reference_com_x','reference_com_y','reference_com_z','final_at'];
  const lines=filtered.map(r=>[r.student_code,r.student_name,r.assignment_title,r.difficulty,r.question_number,r.question_title,r.score,r.volume,r.reference_volume,r.volume_error_percent,r.volume_pass,r.surface_area,r.reference_area,r.area_error_percent,r.area_pass,r.mass,r.reference_mass,r.com_x,r.com_y,r.com_z,r.reference_com_x,r.reference_com_y,r.reference_com_z,r.submitted_at].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','));
  const b=new Blob(['\ufeff'+h.join(',')+'\n'+lines.join('\n')],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='verifyx-final-results.csv';a.click();URL.revokeObjectURL(u)
 }
 const avg=filtered.length?filtered.reduce((n,r)=>n+Number(r.score||0),0)/filtered.length:0;
 const passed=filtered.filter(r=>r.volume_pass&&r.area_pass).length;
 const failed=filtered.length-passed;
 const studentCount=new Set(filtered.map(r=>r.student_id)).size;
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="results"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Results</h1><p>ผล Final ของโรงเรียนนี้ · กรองและ Export ได้ตาม Assignment / Student / Difficulty / PASS-FAIL</p></div></div>
 <div className="vx-grid vx-result-stats" style={{marginBottom:16}}><div className="vx-card"><small>Final Answers</small><h2>{filtered.length}</h2></div><div className="vx-card"><small>Students</small><h2>{studentCount}</h2></div><div className="vx-card"><small>PASS / FAIL</small><h2>{passed} / {failed}</h2></div><div className="vx-card"><small>Average</small><h2>{avg.toFixed(0)}/100</h2></div></div>
 <section className="vx-card"><div className="vx-form" style={{marginTop:0}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ / รหัส / Assignment / วิชา / ชื่อข้อ"/><div className="vx-form-row"><label>Assignment<select value={assignment} onChange={e=>setAssignment(e.target.value)}><option value="all">ทั้งหมด</option>{assignments.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label><label>Student<select value={student} onChange={e=>setStudent(e.target.value)}><option value="all">ทั้งหมด</option>{students.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div><div className="vx-form-row"><label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="all">ทั้งหมด</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>ผลรวม Volume + Area<select value={result} onChange={e=>setResult(e.target.value)}><option value="all">ทั้งหมด</option><option value="pass">PASS ทั้งคู่</option><option value="fail">มี FAIL อย่างน้อย 1 ค่า</option></select></label></div><div className="vx-toolbar"><button className="vx-link secondary" type="button" onClick={clearFilters}>ล้างตัวกรอง</button><button className="vx-link secondary" type="button" onClick={csv} disabled={!filtered.length}>Export CSV ({filtered.length})</button><button className="vx-link primary" type="button" onClick={load}>Refresh</button></div></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:<div style={{display:'grid',gap:8,marginTop:14}}>{filtered.length?filtered.map(r=><button key={r.result_id} onClick={()=>setSelected(r)} style={{textAlign:'left',border:'1px solid #efddd2',background:'#fffaf7',borderRadius:14,padding:12,cursor:'pointer',display:'grid',gridTemplateColumns:'1fr auto',gap:8}}><div><b>{r.student_name}</b><div style={{fontSize:11,color:'#927667'}}>{r.student_code} · {r.assignment_title} · ข้อ {r.question_number}</div><div className="vx-tags"><span>{diffLabel[r.difficulty]||'—'}</span><span>V {r.volume_pass?'PASS':'FAIL'}</span><span>A {r.area_pass?'PASS':'FAIL'}</span><span>Final</span></div></div><strong style={{fontSize:24,color:'#d97b45'}}>{Number(r.score).toFixed(0)}</strong></button>):<div className="vx-empty">ไม่พบผล Final ตามตัวกรอง</div>}</div>}</section>
 {selected&&<div style={{position:'fixed',inset:0,background:'rgba(50,30,20,.25)',display:'flex',justifyContent:'flex-end',zIndex:99}} onClick={()=>setSelected(null)}><aside onClick={e=>e.stopPropagation()} style={{width:'min(480px,94vw)',height:'100%',overflow:'auto',background:'#fffaf7',padding:22}}><button onClick={()=>setSelected(null)} style={{float:'right'}}>✕</button><p className="vx-kicker">FINAL RESULT</p><h2>{selected.student_name}</h2><p>{selected.student_code} · {selected.assignment_title} · ข้อ {selected.question_number}</p><div className="vx-tags"><span>{diffLabel[selected.difficulty]||'—'}</span><span>{selected.submitted_at?new Date(selected.submitted_at).toLocaleString('th-TH'):'—'}</span></div><h1 style={{color:'#d97b45'}}>{Number(selected.score).toFixed(0)}/100</h1>{[['Volume','mm³',selected.volume,selected.reference_volume,selected.volume_error_percent,selected.volume_pass],['Surface Area','mm²',selected.surface_area,selected.reference_area,selected.area_error_percent,selected.area_pass],['Mass','g',selected.mass,selected.reference_mass,null,null]].map(x=><div key={x[0]} className="vx-card" style={{marginBottom:10}}><b>{x[0]} {x[5]===null?'':x[5]?'PASS':'FAIL'}</b><p>Student {fmt(x[2])} {x[1]}</p><p>Reference {fmt(x[3])} {x[1]}</p>{x[4]!=null&&<small>Error {Number(x[4]).toFixed(2)}%</small>}</div>)}<div className="vx-card"><b>Center of Mass</b><p>Student: {fmt(selected.com_x)}, {fmt(selected.com_y)}, {fmt(selected.com_z)}</p><p>Reference: {fmt(selected.reference_com_x)}, {fmt(selected.reference_com_y)}, {fmt(selected.reference_com_z)}</p><small>ข้อมูลประกอบ · ไม่คิดคะแนน</small></div><div className="vx-empty" style={{marginTop:14}}>ผลนี้เป็น Final และถูกล็อกแล้ว</div></aside></div>}
 </div></main>;
}
