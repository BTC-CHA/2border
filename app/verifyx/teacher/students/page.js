'use client';

import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

export default function StudentsPage(){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[error,setError]=useState('');
 async function load(){setLoading(true);setError('');const {data,error}=await vx.rpc('vx_teacher_students');if(error)setError(error.message);setRows(data||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return rows.filter(r=>!q||`${r.full_name} ${r.student_code}`.toLowerCase().includes(q))},[rows,search]);
 const active=rows.filter(r=>Number(r.total_submissions)>0).length;
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="students"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Students</h1><p>รายชื่อนักเรียนและภาพรวมการส่งงาน</p></div></div>
 <div className="vx-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',marginBottom:16}}><div className="vx-card"><small>Students</small><h2>{rows.length}</h2></div><div className="vx-card"><small>Active</small><h2>{active}</h2></div><div className="vx-card"><small>Submissions</small><h2>{rows.reduce((n,r)=>n+Number(r.total_submissions||0),0)}</h2></div></div>
 <section className="vx-card"><div style={{display:'flex',gap:8,marginBottom:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสนักเรียน" style={{flex:1,padding:11,borderRadius:12,border:'1px solid #ead6ca'}}/><button className="vx-link primary" onClick={load}>Refresh</button></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>{filtered.map(r=><article className="vx-card" key={r.student_id}><div style={{display:'flex',gap:10,alignItems:'center'}}><div className="vx-logo" style={{width:42,height:42,fontSize:16}}>{(r.full_name||'?')[0]}</div><div><h3 style={{margin:0}}>{r.full_name}</h3><small>{r.student_code}</small></div></div><p style={{fontSize:12}}>{r.questions_attempted} ข้อ · {r.total_submissions} submissions</p><b>Best average {Number(r.best_average||0).toFixed(0)}/100</b></article>)}</div>}</section>
 </div></main>;
}
