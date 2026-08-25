'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {LogOut} from 'lucide-react';
import {vx} from '../../vxClient';
export default function StudentProfile(){
 const [profile,setProfile]=useState(null),[session,setSession]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{const s=(await vx.auth.getSession()).data.session;setSession(s||null);const {data,error}=await vx.rpc('vx_student_me');if(error)setError(error.message);setProfile(data?.[0]||null);setLoading(false)})()},[]);
 async function signOut(){await vx.auth.signOut();window.location.href='/verifyx/student'}
 return <main className="vx-page"><div className="vx-wrap"><nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link secondary" href="/verifyx/student">Assignments</Link><Link className="vx-link secondary" href="/verifyx/student/results">Results</Link><Link className="vx-link primary" href="/verifyx/student/profile">Profile</Link></nav><div className="vx-top"><div><p className="vx-kicker">STUDENT MODE</p><h1>Profile</h1><p>ข้อมูลประจำตัวที่ผูกกับบัญชี VerifyX</p></div></div>{error&&<div className="vx-error">{error}</div>}{loading?<div className="vx-empty">กำลังโหลด...</div>:profile?<section className="vx-card"><div className="vx-list"><div className="vx-item"><div><small>ชื่อ - นามสกุล</small><h3>{profile.full_name}</h3></div></div><div className="vx-item"><div><small>รหัสนักเรียน</small><h3>{profile.student_code}</h3></div></div><div className="vx-item"><div><small>โรงเรียน / สถาบัน</small><h3>{profile.institution_name}</h3><p>School Code: {profile.institution_code}</p></div></div><div className="vx-item"><div><small>Email ที่ยืนยันแล้ว</small><h3>{profile.email||session?.user?.email||'—'}</h3></div><span className="vx-progress final">Verified</span></div></div><div className="vx-empty" style={{marginTop:14}}>School Code และ Student Code ถูกล็อกหลังผูกบัญชี หากข้อมูลผิดให้ติดต่ออาจารย์</div><button className="vx-btn secondary" style={{marginTop:14}} onClick={signOut}><LogOut size={15}/>Logout</button></section>:<section className="vx-card"><h2>ยังไม่ได้ผูกบัญชีนักเรียน</h2><Link className="vx-link primary" href="/verifyx/student">กลับไปผูกบัญชี</Link></section>}</div></main>;
}
