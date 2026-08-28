'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';

export default function StudentResults(){
 const [profile,setProfile]=useState(null),[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{const {data:me,error:meErr}=await vx.rpc('vx_student_me');if(meErr||!me?.[0]){setError(meErr?.message||'กรุณา Login และผูกบัญชีนักเรียนก่อน');setLoading(false);return}setProfile(me[0]);const {data,error}=await vx.rpc('vx_student_final_history_v3_auth');if(error)setError(error.message);setRows(data||[]);setLoading(false)})()},[]);
 const groups=useMemo(()=>Object.values(rows.reduce((a,r)=>{const k=String(r.assignment_id);if(!a[k])a[k]={assignment_id:r.assignment_id,assignment_title:r.assignment_title,final_at:r.final_at,items:[]};a[k].items.push(r);return a},{})).sort((x,y)=>new Date(y.final_at||0)-new Date(x.final_at||0)),[rows]);
 const avgOf=items=>items.length?Math.round(items.reduce((n,x)=>n+Number(x.score||0),0)/items.length):0;
 return <main className="vx-page"><div className="vx-wrap">
  <nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link secondary" href="/verifyx/student">Assignments</Link><Link className="vx-link primary" href="/verifyx/student/results">Results</Link><Link className="vx-link secondary" href="/verifyx/student/profile">Profile</Link></nav>
  <div className="vx-top"><div><p className="vx-kicker">STUDENT MODE</p><h1>Results</h1><p>{profile?`${profile.institution_name} · ${profile.full_name} · ${profile.student_code}`:'ผลคะแนนของฉัน'}</p></div></div>
  {error&&<div className="vx-error">{error}</div>}
  {loading?<div className="vx-empty">กำลังโหลด...</div>:groups.length?<section className="vx-list">{groups.map(g=><article className="vx-card" key={g.assignment_id}><div className="vx-history-head"><div><p className="vx-kicker">ประกาศผลแล้ว</p><h2 style={{margin:'3px 0 5px'}}>{g.assignment_title}</h2><p style={{margin:0}}>ส่ง Final {g.final_at?new Date(g.final_at).toLocaleString('th-TH'):''}</p><div className="vx-tags"><span>{g.items.length} ข้อ</span><span>ครูปิดรับงานแล้ว</span></div></div><div className="vx-history-score"><strong>{avgOf(g.items)}/100</strong></div></div></article>)}</section>:<section className="vx-card"><h3>ยังไม่มีคะแนนที่ประกาศ</h3><p>คะแนนจะแสดงหลังจากครูปิดรับ Assignment แล้วเท่านั้น</p></section>}
 </div></main>;
}
