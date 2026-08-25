'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, LogOut, ShieldCheck, School, Users } from 'lucide-react';
import { vx } from '../vxClient';

const PENDING_KEY='vx-pending-school-onboarding';

export default function TeacherLayout({ children }) {
  const [loading,setLoading]=useState(true),[session,setSession]=useState(null),[isTeacher,setIsTeacher]=useState(false),[mode,setMode]=useState('login'),[message,setMessage]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(null);

  async function refresh(nextSession){
    setLoading(true);setError('');
    const s=nextSession ?? (await vx.auth.getSession()).data.session;setSession(s||null);
    let teacher=false;
    if(s){
      const first=await vx.rpc('vx_me_is_teacher');
      if(first.error)setError(first.error.message); else teacher=Boolean(first.data);
      if(!teacher){
        const displayName=s.user?.user_metadata?.display_name||s.user?.user_metadata?.full_name||'';
        const joined=await vx.rpc('vx_accept_teacher_invite',{p_display_name:displayName});
        if(!joined.error&&joined.data){const again=await vx.rpc('vx_me_is_teacher');teacher=Boolean(again.data)}
      }
    }
    setIsTeacher(teacher);
    try{setPending(JSON.parse(localStorage.getItem(PENDING_KEY)||'null'))}catch{setPending(null)}
    setLoading(false);
  }
  useEffect(()=>{refresh();const {data:{subscription}}=vx.auth.onAuthStateChange((_e,s)=>refresh(s));return()=>subscription.unsubscribe()},[]);

  async function signIn(e){e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const {error}=await vx.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});if(error)setError(error.message)}

  async function createSchoolTeacher(data,s){const {data:ok,error}=await vx.rpc('vx_create_school_teacher',{p_display_name:data.displayName,p_institution_name:data.schoolName,p_institution_code:data.schoolCode});if(error){setError(error.message);return false}if(ok){localStorage.removeItem(PENDING_KEY);setPending(null);setMessage('สร้างโรงเรียนและบัญชีครูเรียบร้อย');await refresh(s||session);return true}return false}

  async function signUpSchool(e){
    e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);
    const form={displayName:String(fd.get('displayName')||'').trim(),schoolName:String(fd.get('schoolName')||'').trim(),schoolCode:String(fd.get('schoolCode')||'').trim().toUpperCase()};
    const email=String(fd.get('email')).trim(),password=String(fd.get('password'));
    if(!/^[A-Z0-9_-]{3,24}$/.test(form.schoolCode)){setError('School Code ใช้ A-Z, 0-9, _ หรือ - ความยาว 3-24 ตัว');return}
    const {data,error}=await vx.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/verifyx/teacher`,data:{display_name:form.displayName}}});if(error){setError(error.message);return}
    localStorage.setItem(PENDING_KEY,JSON.stringify(form));setPending(form);
    if(data.session)await createSchoolTeacher(form,data.session);else setMessage('สร้างบัญชีแล้ว กรุณายืนยันอีเมล แล้วกลับมาหน้านี้เพื่อสร้างโรงเรียนให้เสร็จ');
  }

  async function signUpInvited(e){
    e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const displayName=String(fd.get('displayName')).trim(),email=String(fd.get('email')).trim(),password=String(fd.get('password'));
    const {data,error}=await vx.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/verifyx/teacher`,data:{display_name:displayName}}});if(error){setError(error.message);return}
    if(data.session){const joined=await vx.rpc('vx_accept_teacher_invite',{p_display_name:displayName});if(joined.error)setError(joined.error.message);else if(!joined.data)setError('ไม่พบคำเชิญที่ยังใช้งานสำหรับ Email นี้');else await refresh(data.session)}
    else setMessage('สมัครแล้ว กรุณายืนยันอีเมล ระบบจะเข้าร่วมโรงเรียนที่เชิญไว้อัตโนมัติ');
  }

  async function finishOnboarding(e){e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const form={displayName:String(fd.get('displayName')).trim(),schoolName:String(fd.get('schoolName')).trim(),schoolCode:String(fd.get('schoolCode')).trim().toUpperCase()};if(!/^[A-Z0-9_-]{3,24}$/.test(form.schoolCode)){setError('School Code ใช้ A-Z, 0-9, _ หรือ - ความยาว 3-24 ตัว');return}await createSchoolTeacher(form,session)}
  async function signOut(){await vx.auth.signOut()}

  if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังตรวจสอบสิทธิ์ครู...</div></div></main>;

  if(!session){
    return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login"><div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>TEACHER ACCESS</p><h2>{mode==='school'?'Create School Account':mode==='join'?'Join Invited School':'Teacher Login'}</h2>
      {mode==='login'&&<form className="vx-form" onSubmit={signIn}><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required/></label><button className="vx-btn primary"><LockKeyhole size={16}/>Login</button></form>}
      {mode==='school'&&<form className="vx-form" onSubmit={signUpSchool}><label>ชื่อครู<input name="displayName" required/></label><label>ชื่อโรงเรียน / สถาบัน<input name="schoolName" required/></label><label>School Code<input name="schoolCode" maxLength={24} required style={{textTransform:'uppercase'}}/></label><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength="8" required/></label><button className="vx-btn primary"><School size={16}/>สร้างโรงเรียนและบัญชีครู</button></form>}
      {mode==='join'&&<form className="vx-form" onSubmit={signUpInvited}><p>ใช้อีเมลเดียวกับที่ Owner ของโรงเรียนเชิญไว้</p><label>ชื่อครู<input name="displayName" required/></label><label>Email ที่ได้รับเชิญ<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength="8" required/></label><button className="vx-btn primary"><Users size={16}/>สมัครและเข้าร่วมโรงเรียน</button></form>}
      <div className="vx-toolbar" style={{marginTop:12}}><button className="vx-btn secondary" onClick={()=>setMode('login')}>Login</button><button className="vx-btn secondary" onClick={()=>setMode('school')}>โรงเรียนใหม่</button><button className="vx-btn secondary" onClick={()=>setMode('join')}>ได้รับคำเชิญ</button></div>
      {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}<Link className="vx-file" href="/verifyx">กลับหน้า VerifyX</Link></section></div></main>;
  }

  if(!isTeacher){const p=pending||{displayName:'',schoolName:'',schoolCode:''};return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login"><ShieldCheck size={30}/><p className="vx-kicker" style={{marginTop:14}}>FINISH SETUP</p><h2>{pending?'ตั้งค่าโรงเรียนให้เสร็จ':'ยังไม่มีสิทธิ์ Teacher'}</h2>{pending?<><p>บัญชียืนยันแล้ว เหลือสร้างพื้นที่โรงเรียนของคุณ</p><form className="vx-form" onSubmit={finishOnboarding}><label>ชื่อครู<input name="displayName" defaultValue={p.displayName} required/></label><label>ชื่อโรงเรียน / สถาบัน<input name="schoolName" defaultValue={p.schoolName} required/></label><label>School Code<input name="schoolCode" defaultValue={p.schoolCode} maxLength={24} required/></label><button className="vx-btn primary"><School size={16}/>สร้างโรงเรียนและเข้า Teacher Mode</button></form></>:<p>ไม่พบคำเชิญสำหรับอีเมลนี้ หากเป็นครูในโรงเรียนเดิมให้ Owner เชิญอีเมลนี้ก่อน</p>}{error&&<div className="vx-error">{error}</div>}<button className="vx-btn secondary" style={{marginTop:10,width:'100%'}} onClick={signOut}>ออกจากระบบ</button></section></div></main>}

  return <><div className="vx-teacherbar"><div className="vx-teacherbar-inner"><nav><Link href="/verifyx/teacher">Assignments</Link><Link href="/verifyx/teacher/question-bank">Question Bank</Link><Link href="/verifyx/teacher/students">Students</Link><Link href="/verifyx/teacher/results">Results</Link><Link href="/verifyx/teacher/settings">Settings</Link></nav><button onClick={signOut}><LogOut size={14}/>Logout</button></div></div>{children}</>;
}
