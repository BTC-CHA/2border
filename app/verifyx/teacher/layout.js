'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { vx } from '../vxClient';

export default function TeacherLayout({ children }) {
  const [loading,setLoading]=useState(true);
  const [session,setSession]=useState(null);
  const [isTeacher,setIsTeacher]=useState(false);
  const [setupNeeded,setSetupNeeded]=useState(false);
  const [mode,setMode]=useState('signup');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function refresh(nextSession){
    setLoading(true); setError('');
    const s=nextSession ?? (await vx.auth.getSession()).data.session;
    setSession(s||null);
    const {data:need}=await vx.rpc('vx_teacher_setup_needed');
    setSetupNeeded(Boolean(need));
    if(s){
      const {data,error}=await vx.rpc('vx_me_is_teacher');
      if(error)setError(error.message);
      setIsTeacher(Boolean(data));
    } else setIsTeacher(false);
    setLoading(false);
  }

  useEffect(()=>{
    refresh();
    const {data:{subscription}}=vx.auth.onAuthStateChange((_event,s)=>refresh(s));
    return ()=>subscription.unsubscribe();
  },[]);

  async function signIn(e){
    e.preventDefault(); setError(''); setMessage('');
    const fd=new FormData(e.currentTarget);
    const {error}=await vx.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});
    if(error)setError(error.message);
  }

  async function signUp(e){
    e.preventDefault(); setError(''); setMessage('');
    const fd=new FormData(e.currentTarget);
    const email=String(fd.get('email')).trim();
    const password=String(fd.get('password'));
    const displayName=String(fd.get('displayName')||'Teacher').trim();
    const emailRedirectTo=`${window.location.origin}/verifyx/teacher`;
    const {data,error}=await vx.auth.signUp({email,password,options:{emailRedirectTo}});
    if(error){setError(error.message);return;}
    if(data.session){
      const {data:claimed,error:claimError}=await vx.rpc('vx_bootstrap_teacher',{p_display_name:displayName});
      if(claimError)setError(claimError.message);
      else if(claimed){setMessage('สร้างบัญชีครูเรียบร้อย');await refresh(data.session);}
    } else {
      localStorage.setItem('vx-pending-teacher-name',displayName);
      setMessage('สร้างบัญชีแล้ว กรุณายืนยันอีเมล จากนั้นระบบจะพากลับมาที่หน้า Teacher โดยอัตโนมัติ');
    }
  }

  async function claimFirstTeacher(){
    setError('');
    const name=localStorage.getItem('vx-pending-teacher-name')||'Teacher';
    const {data,error}=await vx.rpc('vx_bootstrap_teacher',{p_display_name:name});
    if(error)setError(error.message);
    else if(data){localStorage.removeItem('vx-pending-teacher-name');await refresh(session);}
  }

  async function signOut(){await vx.auth.signOut();}

  if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังตรวจสอบสิทธิ์ครู...</div></div></main>;

  if(!session){
    const showSignup=setupNeeded && mode==='signup';
    return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login">
      <div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>TEACHER ACCESS</p><h2>{showSignup?'ตั้งค่าครูคนแรก':'Teacher Login'}</h2>
      <p>{showSignup?'ยังไม่มีบัญชีครูใน VerifyX สร้างบัญชีแรกได้จากหน้านี้':'เข้าสู่ระบบด้วยบัญชีครู VerifyX'}</p>
      {showSignup ? <form className="vx-form" onSubmit={signUp}><label>ชื่อครู<input name="displayName" placeholder="Teacher" required/></label><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength="8" required/></label><button className="vx-btn primary"><ShieldCheck size={16}/>สร้างบัญชีครูคนแรก</button></form>
      : <form className="vx-form" onSubmit={signIn}><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required/></label><button className="vx-btn primary"><LockKeyhole size={16}/>Login</button></form>}
      {setupNeeded&&<button className="vx-btn secondary" style={{marginTop:12,width:'100%'}} onClick={()=>{setMode(showSignup?'login':'signup');setError('');setMessage('')}}>{showSignup?'มีบัญชีที่ยืนยันแล้ว → Login':'กลับไปสร้างบัญชีครูคนแรก'}</button>}
      {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}
      <Link className="vx-file" href="/verifyx">กลับหน้า VerifyX</Link>
    </section></div></main>;
  }

  if(!isTeacher){
    return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login"><LockKeyhole size={30}/><h2>บัญชีนี้ยังไม่มีสิทธิ์ครู</h2>
      {setupNeeded?<><p>ยังไม่มีครูในระบบ สามารถตั้งบัญชีที่ Login อยู่เป็นครูคนแรกได้</p><button className="vx-btn primary" onClick={claimFirstTeacher}>ตั้งบัญชีนี้เป็นครูคนแรก</button></>:<p>บัญชีนี้ไม่อยู่ในรายชื่อครู VerifyX</p>}
      {error&&<div className="vx-error">{error}</div>}<button className="vx-btn secondary" onClick={signOut}>ออกจากระบบ</button></section></div></main>;
  }

  return <><div className="vx-teacherbar"><div className="vx-teacherbar-inner"><nav><Link href="/verifyx/teacher">Assignments</Link><Link href="/verifyx/teacher/question-bank">Question Bank</Link><Link href="/verifyx/teacher/students">Students</Link><Link href="/verifyx/teacher/results">Results</Link><Link href="/verifyx/teacher/settings">Settings</Link></nav><button onClick={signOut}><LogOut size={14}/>Logout</button></div></div>{children}</>;
}
