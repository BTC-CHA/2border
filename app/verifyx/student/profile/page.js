'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {LogOut,Pencil,Save,X} from 'lucide-react';
import {vx} from '../../vxClient';

export default function StudentProfile(){
 const [profile,setProfile]=useState(null),[session,setSession]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [editingName,setEditingName]=useState(false),[nameDraft,setNameDraft]=useState(''),[savingName,setSavingName]=useState(false);
 useEffect(()=>{(async()=>{const s=(await vx.auth.getSession()).data.session;setSession(s||null);const {data,error}=await vx.rpc('vx_student_me');if(error)setError(error.message);const p=data?.[0]||null;setProfile(p);setNameDraft(p?.full_name||'');setLoading(false)})()},[]);
 async function signOut(){await vx.auth.signOut();window.location.href='/verifyx/student'}
 async function saveName(){
  const next=nameDraft.trim();setError('');setMessage('');
  if(!next){setError('กรุณากรอกชื่อ - นามสกุล');return}
  setSavingName(true);
  const {data,error}=await vx.rpc('vx_student_update_own_name',{p_full_name:next});
  setSavingName(false);
  if(error){setError(error.message);return}
  const saved=data?.[0]?.full_name||next;
  setProfile(p=>({...p,full_name:saved}));setNameDraft(saved);setEditingName(false);setMessage('บันทึกชื่อเรียบร้อยแล้ว');
 }
 function cancelName(){setNameDraft(profile?.full_name||'');setEditingName(false);setError('')}
 return <main className="vx-page"><div className="vx-wrap"><nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link secondary" href="/verifyx/student">Assignments</Link><Link className="vx-link secondary" href="/verifyx/student/results">Results</Link><Link className="vx-link primary" href="/verifyx/student/profile">Profile</Link></nav><div className="vx-top"><div><p className="vx-kicker">STUDENT MODE</p><h1>Profile</h1><p>ข้อมูลประจำตัวที่ผูกกับบัญชี VerifyX</p></div></div>{message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}{loading?<div className="vx-empty">กำลังโหลด...</div>:profile?<section className="vx-card"><div className="vx-list"><div className="vx-item" style={{alignItems:'center'}}><div style={{minWidth:0,flex:1}}><small>ชื่อ - นามสกุล</small>{editingName?<input value={nameDraft} onChange={e=>setNameDraft(e.target.value)} maxLength={120} autoFocus style={{display:'block',width:'min(420px,100%)',marginTop:6,border:'1px solid #ead4c7',background:'#fffaf7',borderRadius:11,padding:'10px 11px',fontSize:15,color:'#4b382e',boxSizing:'border-box'}}/>:<h3>{profile.full_name}</h3>}</div>{editingName?<div className="vx-toolbar" style={{width:'auto',flexWrap:'nowrap'}}><button className="vx-btn primary" style={{width:'auto'}} disabled={savingName} onClick={saveName}><Save size={15}/>{savingName?'กำลังบันทึก...':'บันทึก'}</button><button className="vx-btn secondary" style={{width:'auto'}} disabled={savingName} onClick={cancelName}><X size={15}/>ยกเลิก</button></div>:<button className="vx-btn secondary" style={{width:'auto'}} onClick={()=>{setNameDraft(profile.full_name||'');setEditingName(true);setMessage('')}}><Pencil size={15}/>แก้ไขชื่อ</button>}</div><div className="vx-item"><div><small>รหัสนักเรียน</small><h3>{profile.student_code}</h3></div></div><div className="vx-item"><div><small>โรงเรียน / สถาบัน</small><h3>{profile.institution_name}</h3><p>School Code: {profile.institution_code}</p></div></div><div className="vx-item"><div><small>Email ที่ยืนยันแล้ว</small><h3>{profile.email||session?.user?.email||'—'}</h3></div><span className="vx-progress final">Verified</span></div></div><div className="vx-empty" style={{marginTop:14}}>ชื่อ - นามสกุลแก้ไขได้จากหน้านี้ ส่วน School Code และ Student Code ถูกล็อกหลังผูกบัญชี</div><button className="vx-btn secondary" style={{marginTop:14}} onClick={signOut}><LogOut size={15}/>Logout</button></section>:<section className="vx-card"><h2>ยังไม่ได้ผูกบัญชีนักเรียน</h2><Link className="vx-link primary" href="/verifyx/student">กลับไปผูกบัญชี</Link></section>}</div></main>;
}
