'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {vx} from '../../vxClient';

const KEY='verifyx-student';
const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(3):'—';
const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(2)}%`:'—';
export default function HistoryPage(){
 const identity=(()=>{if(typeof window==='undefined')return null;try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}})();
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{if(!identity?.studentCode){setLoading(false);return}const {data,error}=await vx.rpc('vx_student_history',{p_student_code:identity.studentCode});if(error)setError(error.message);setRows(data||[]);setLoading(false)})()},[]);
 const groups=useMemo(()=>rows.reduce((a,r)=>{const k=`${r.assignment_id}:${r.question_id}`;(a[k]||=[]).push(r);return a},{}),[rows]);
 if(!identity?.studentCode)return <main className="vx-page"><div className="vx-wrap"><section className="vx-card"><h1>ยังไม่มีข้อมูลนักเรียน</h1><Link className="vx-link primary" href="/verifyx/student">กลับหน้า Student</Link></section></div></main>;
 return <main className="vx-page"><div className="vx-wrap"><Link href="/verifyx/student" className="vx-link secondary">← Assignments</Link><div className="vx-top" style={{marginTop:18}}><div><p className="vx-kicker">SUBMISSION HISTORY</p><h1>ประวัติการส่งงาน</h1><p>{identity.fullName} · {identity.studentCode}</p></div></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:Object.keys(groups).length?Object.entries(groups).map(([k,items])=>{const f=items[0];const best=Math.max(...items.map(x=>Number(x.score||0)));return <section className="vx-card" key={k} style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><small>{f.assignment_title}</small><h2 style={{margin:'4px 0'}}>ข้อ {f.question_number} · {f.question_title||'Question'}</h2></div><strong style={{fontSize:24,color:'#d97b45'}}>Best {best}</strong></div><div style={{display:'grid',gap:8}}>{items.map(r=><article key={r.submission_id} style={{border:'1px solid #efddd2',background:'#fffaf7',borderRadius:12,padding:11}}><div style={{display:'flex',justifyContent:'space-between'}}><b>ครั้งที่ {r.attempt}</b><strong>{Number(r.score).toFixed(0)}/100</strong></div><div style={{fontSize:12,marginTop:7,fontWeight:700}}>Volume {r.volume_pass?'PASS':'FAIL'} · Error {pct(r.volume_error_percent)}</div><div style={{fontSize:12,marginTop:4,fontWeight:700}}>Area {r.area_pass?'PASS':'FAIL'} · Error {pct(r.area_error_percent)}</div><div style={{fontSize:11,color:'#927667',marginTop:7}}>ค่าที่ส่ง: V {fmt(r.volume)} · A {fmt(r.surface_area)}</div><details style={{marginTop:7}}><summary style={{cursor:'pointer',fontSize:11,fontWeight:700}}>ข้อมูลเพิ่มเติม</summary><div style={{fontSize:11,color:'#927667',marginTop:5}}>Mass {fmt(r.mass)} g · COM {fmt(r.com_x)}, {fmt(r.com_y)}, {fmt(r.com_z)} mm</div></details></article>)}</div></section>}):<section className="vx-card">ยังไม่มีประวัติการส่งงาน</section>}</div></main>;
}
