'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
import {vx} from '../../vxClient';

const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(3):'—';
const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(2)}%`:'—';
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};
const typeLabel={cad:'CAD',mcq:'ปรนัย',short_answer:'เติมคำ'};

export default function StudentResults(){
 const [profile,setProfile]=useState(null),[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[openId,setOpenId]=useState(null);
 useEffect(()=>{(async()=>{
  const {data:me,error:meErr}=await vx.rpc('vx_student_me');
  if(meErr||!me?.[0]){setError(meErr?.message||'กรุณา Login และผูกบัญชีนักเรียนก่อน');setLoading(false);return}
  setProfile(me[0]);
  const {data,error}=await vx.rpc('vx_student_final_history_v2_auth');
  if(error)setError(error.message);setRows(data||[]);setLoading(false)
 })()},[]);
 const groups=useMemo(()=>Object.values(rows.reduce((a,r)=>{const k=String(r.assignment_id);if(!a[k])a[k]={assignment_id:r.assignment_id,assignment_title:r.assignment_title,final_at:r.final_at,items:[]};a[k].items.push(r);return a},{})).sort((x,y)=>new Date(y.final_at||0)-new Date(x.final_at||0)),[rows]);
 const avgOf=(items,type)=>{const xs=type?items.filter(x=>x.question_type===type):items;return xs.length?Math.round(xs.reduce((n,x)=>n+Number(x.score||0),0)/xs.length):null};
 const overall=groups.length?Math.round(groups.reduce((n,g)=>n+(avgOf(g.items)||0),0)/groups.length):0;
 const allCad=rows.filter(x=>x.question_type==='cad'),allMcq=rows.filter(x=>x.question_type==='mcq'),allShort=rows.filter(x=>x.question_type==='short_answer');
 const globalAvg=xs=>xs.length?Math.round(xs.reduce((n,x)=>n+Number(x.score||0),0)/xs.length):null;
 return <main className="vx-page"><div className="vx-wrap">
  <nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link secondary" href="/verifyx/student">Assignments</Link><Link className="vx-link primary" href="/verifyx/student/results">Results</Link><Link className="vx-link secondary" href="/verifyx/student/profile">Profile</Link></nav>
  <div className="vx-top"><div><p className="vx-kicker">STUDENT MODE</p><h1>Results</h1><p>{profile?`${profile.institution_name} · ${profile.full_name} · ${profile.student_code}`:'ผล Final ของฉัน'}</p></div></div>
  {error&&<div className="vx-error">{error}</div>}
  {loading?<div className="vx-empty">กำลังโหลด...</div>:<>
   <div className="vx-grid vx-history-stats" style={{marginBottom:16}}>
    <div className="vx-card"><small>Final ทั้งหมด</small><h2>{groups.length}</h2></div>
    <div className="vx-card"><small>คะแนนเฉลี่ยรวม</small><h2>{overall}/100</h2></div>
    <div className="vx-card"><small>CAD</small><h2>{globalAvg(allCad)??'—'}</h2></div>
    <div className="vx-card"><small>ปรนัย</small><h2>{globalAvg(allMcq)??'—'}</h2></div>
    <div className="vx-card"><small>เติมคำ</small><h2>{globalAvg(allShort)??'—'}</h2></div>
   </div>
   {groups.length?<section className="vx-list">{groups.map(g=>{const avg=avgOf(g.items);const cad=avgOf(g.items,'cad'),mcq=avgOf(g.items,'mcq'),short=avgOf(g.items,'short_answer');const opened=openId===g.assignment_id;return <article className="vx-card vx-history-group" key={g.assignment_id}>
    <button onClick={()=>setOpenId(opened?null:g.assignment_id)} className="vx-history-toggle"><div className="vx-history-head"><div><p className="vx-kicker">FINAL</p><h2 style={{margin:'3px 0 5px'}}>{g.assignment_title}</h2><p style={{margin:0}}>{g.final_at?new Date(g.final_at).toLocaleString('th-TH'):''}</p><div className="vx-tags"><span>{g.items.length} ข้อ</span>{cad!==null&&<span>CAD {cad}/100</span>}{mcq!==null&&<span>ปรนัย {mcq}/100</span>}{short!==null&&<span>เติมคำ {short}/100</span>}<span>ล็อกแล้ว</span></div></div><div className="vx-history-score"><strong>{avg}/100</strong>{opened?<ChevronUp size={20}/>:<ChevronDown size={20}/>}</div></div></button>
    {opened&&<div className="vx-history-items">{g.items.map(r=><article key={r.result_id} className="vx-history-item"><div className="vx-history-item-head"><b>ข้อ {r.question_number} · {r.question_title}</b><strong>{Number(r.score).toFixed(0)}/100</strong></div><div className="vx-tags"><span>{typeLabel[r.question_type]||r.question_type}</span>{r.question_type==='cad'&&<><span>Volume {r.volume_pass?'PASS':'FAIL'} · Error {pct(r.volume_error_percent)}</span><span>Area {r.area_pass?'PASS':'FAIL'} · Error {pct(r.area_error_percent)}</span></>}{r.question_type==='mcq'&&<span>{r.mcq_correct?'ตอบถูก':'ตอบผิด'}</span>}{r.question_type==='short_answer'&&<span>{r.short_answer_correct?'ตอบถูก':'ตอบผิด'}</span>}</div>{r.question_type==='cad'&&<div style={{fontSize:11,color:'#927667',marginTop:8}}>ค่าที่ส่ง: V {fmt(r.volume)} mm³ · A {fmt(r.surface_area)} mm² · M {fmt(r.mass)} g · COM {fmt(r.com_x)}, {fmt(r.com_y)}, {fmt(r.com_z)}</div>}{r.question_type==='mcq'&&<div style={{fontSize:11,color:'#927667',marginTop:8}}>คำตอบที่เลือก: {thaiKey[r.selected_choice_key]||r.selected_choice_key||'—'}</div>}{r.question_type==='short_answer'&&<div style={{fontSize:11,color:'#927667',marginTop:8}}>คำตอบที่ส่ง: {r.short_answer_text||'—'}</div>}</article>)}</div>}
   </article>})}</section>:<section className="vx-card">ยังไม่มีผล Final</section>}
   <div className="vx-empty" style={{marginTop:14}}>Student Results แสดงเฉพาะคะแนน ผลถูก/ผิด Error % และคำตอบของคุณเอง · ไม่เปิด Reference Value หรือเฉลยจริง</div>
  </>}
 </div></main>;
}
