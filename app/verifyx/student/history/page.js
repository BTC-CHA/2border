'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {vx} from '../../vxClient';

const KEY='verifyx-student';
const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(3):'—';
const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(2)}%`:'—';

export default function HistoryPage(){
 const identity=(()=>{if(typeof window==='undefined')return null;try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}})();
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[openId,setOpenId]=useState(null);
 useEffect(()=>{(async()=>{if(!identity?.studentCode||!identity?.institutionCode){setLoading(false);return}const {data,error}=await vx.rpc('vx_student_final_history',{p_institution_code:identity.institutionCode,p_student_code:identity.studentCode});if(error)setError(error.message);setRows(data||[]);setLoading(false)})()},[]);
 const groups=useMemo(()=>Object.values(rows.reduce((a,r)=>{const k=String(r.assignment_id);if(!a[k])a[k]={assignment_id:r.assignment_id,assignment_title:r.assignment_title,final_at:r.final_at,items:[]};a[k].items.push(r);return a},{})).sort((x,y)=>new Date(y.final_at||0)-new Date(x.final_at||0)),[rows]);
 const overall=groups.length?Math.round(groups.reduce((n,g)=>n+(g.items.reduce((s,x)=>s+Number(x.score||0),0)/g.items.length),0)/groups.length):0;
 if(!identity?.studentCode||!identity?.institutionCode)return <main className="vx-page"><div className="vx-wrap"><section className="vx-card"><h1>ยังไม่มีข้อมูลนักเรียน</h1><p>กรุณาเข้าสู่ Student Mode พร้อม School Code ก่อน</p><Link className="vx-link primary" href="/verifyx/student">กลับหน้า Student</Link></section></div></main>;
 return <main className="vx-page"><div className="vx-wrap"><Link href="/verifyx/student" className="vx-link secondary">← Assignments</Link><div className="vx-top" style={{marginTop:18}}><div><p className="vx-kicker">FINAL HISTORY</p><h1>ผลการส่ง Final</h1><p>School {identity.institutionCode} · {identity.fullName} · {identity.studentCode}</p></div></div>
 {error&&<div className="vx-error">{error}</div>}
 {loading?<div className="vx-empty">กำลังโหลด...</div>:<>
 <div className="vx-grid vx-history-stats" style={{marginBottom:16}}><div className="vx-card"><small>Final ทั้งหมด</small><h2>{groups.length}</h2></div><div className="vx-card"><small>ข้อที่ตรวจแล้ว</small><h2>{rows.length}</h2></div><div className="vx-card"><small>คะแนนเฉลี่ยรวม</small><h2>{overall}/100</h2></div></div>
 {groups.length?<section className="vx-list">{groups.map(g=>{const avg=Math.round(g.items.reduce((n,x)=>n+Number(x.score||0),0)/g.items.length);const passCount=g.items.filter(x=>x.volume_pass&&x.area_pass).length;const opened=openId===g.assignment_id;return <article className="vx-card vx-history-group" key={g.assignment_id}><button onClick={()=>setOpenId(opened?null:g.assignment_id)} className="vx-history-toggle"><div className="vx-history-head"><div><p className="vx-kicker">FINAL</p><h2 style={{margin:'3px 0 5px'}}>{g.assignment_title}</h2><p style={{margin:0}}>{g.final_at?new Date(g.final_at).toLocaleString('th-TH'):''}</p><div className="vx-tags"><span>{g.items.length} ข้อ</span><span>ผ่านครบ {passCount}/{g.items.length}</span><span>ล็อกแล้ว</span></div></div><div className="vx-history-score"><strong>{avg}/100</strong>{opened?<ChevronUp size={20}/>:<ChevronDown size={20}/>}</div></div></button>{opened&&<div className="vx-history-items">{g.items.map(r=><article key={r.result_id} className="vx-history-item"><div className="vx-history-item-head"><b>ข้อ {r.question_number} · {r.question_title}</b><strong>{Number(r.score).toFixed(0)}/100</strong></div><div className="vx-tags"><span>Volume {r.volume_pass?'PASS':'FAIL'} · Error {pct(r.volume_error_percent)}</span><span>Area {r.area_pass?'PASS':'FAIL'} · Error {pct(r.area_error_percent)}</span></div><div style={{fontSize:11,color:'#927667',marginTop:8}}>ค่าที่ส่ง: V {fmt(r.volume)} mm³ · A {fmt(r.surface_area)} mm²</div><details style={{marginTop:8}}><summary style={{cursor:'pointer',fontSize:11,fontWeight:800}}>Mass / Center of Mass</summary><div style={{fontSize:11,color:'#927667',marginTop:6}}>Mass {fmt(r.mass)} g<br/>COM {fmt(r.com_x)}, {fmt(r.com_y)}, {fmt(r.com_z)} mm</div></details></article>)}</div>}</article>})}</section>:<section className="vx-card">ยังไม่มีผล Final</section>}
 </>}
 </div></main>;
}
