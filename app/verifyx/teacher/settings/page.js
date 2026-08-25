'use client';

import {useEffect,useState} from 'react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

function QuestionSetting({q,onReload}){
 const [v,setV]=useState(Number(q.volume_tolerance_percent||1));
 const [a,setA]=useState(Number(q.area_tolerance_percent||1));
 async function save(){const {error}=await vx.from('vx_questions').update({volume_tolerance_percent:Number(v).toFixed(3),area_tolerance_percent:Number(a).toFixed(3),updated_at:new Date().toISOString()}).eq('id',q.id);if(error)return alert(error.message);onReload()}
 return <div style={{display:'grid',gridTemplateColumns:'1fr 110px 110px auto',gap:8,alignItems:'end',padding:10,border:'1px solid #efddd2',borderRadius:12}}><div><b>ข้อ {q.question_number} · {q.title||'Question'}</b><div style={{fontSize:11,color:'#927667'}}>V {Number(q.reference_volume).toFixed(3)} · A {Number(q.reference_area).toFixed(3)}</div></div><label style={{fontSize:11}}>Vol Tol %<input value={v} type="number" step="0.001" min="0" onChange={e=>setV(e.target.value)} style={{width:'100%',padding:8,borderRadius:9,border:'1px solid #ead6ca'}}/></label><label style={{fontSize:11}}>Area Tol %<input value={a} type="number" step="0.001" min="0" onChange={e=>setA(e.target.value)} style={{width:'100%',padding:8,borderRadius:9,border:'1px solid #ead6ca'}}/></label><button className="vx-link secondary" onClick={save}>Save</button></div>
}

function AssignmentSetting({item,onReload}){
 const [status,setStatus]=useState(item.status);
 async function save(){const {error}=await vx.from('vx_assignments').update({status,max_attempts:1,updated_at:new Date().toISOString()}).eq('id',item.id);if(error)return alert(error.message);onReload()}
 return <article className="vx-card" style={{marginBottom:12}}><h2 style={{marginTop:0}}>{item.title}</h2><p style={{color:'#927667'}}>{item.course||'ไม่ระบุวิชา'}</p><div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'end',marginBottom:12}}><label>สถานะ<select value={status} onChange={e=>setStatus(e.target.value)} style={{display:'block',padding:9,borderRadius:10,border:'1px solid #ead6ca'}}><option value="draft">ฉบับร่าง</option><option value="open">เปิดรับงาน</option><option value="closed">ปิดรับงาน</option></select></label><div className="vx-status">Final Submit ครั้งเดียว</div><button className="vx-link primary" onClick={save}>บันทึก Assignment</button></div><div style={{display:'grid',gap:8}}>{(item.vx_questions||[]).sort((x,y)=>x.question_number-y.question_number).map(q=><QuestionSetting key={q.id} q={q} onReload={onReload}/>)}</div></article>
}

export default function SettingsPage(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 async function load(){setLoading(true);setError('');const {data,error}=await vx.from('vx_assignments').select('*, vx_questions(*)').order('created_at',{ascending:false});if(error)setError(error.message);setItems(data||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="settings"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Settings</h1><p>ตั้งค่าสถานะ Assignment และ Tolerance</p></div></div>{error&&<p style={{color:'#b85d58'}}>{error}</p>}{loading?<p>กำลังโหลด...</p>:items.map(i=><AssignmentSetting key={i.id} item={i} onReload={load}/>)}</div></main>;
}
