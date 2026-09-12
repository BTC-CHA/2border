'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,PlayCircle,CheckCircle2,Circle,LogOut} from 'lucide-react';
import {vx} from '../vxClient';

const statusLabel={not_started:'ยังไม่เริ่ม',in_progress:'กำลังทำ',final:'Final แล้ว'};
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const assignmentTypeLabel={cad:'CAD / Mass Properties',mcq:'Multiple Choice',mixed:'CAD + Multiple Choice'};
const TRAINING_AUTO_JOIN=true;
function StatusIcon({status}){if(status==='final')return <CheckCircle2 size={15}/>;if(status==='in_progress')return <PlayCircle size={15}/>;return <Circle size={15}/>}

export default function StudentPage(){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[items,setItems]=useState([]),[loading,setLoading]=useState(true),[mode,setMode]=useState('login'),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function refresh(nextSession){
  setLoading(true);setError('');
  const s=nextSession??(await vx.auth.getSession()).data.session;setSession(s||null);
  if(!s){setProfile(null);setItems([]);setLoading(false);return}
  let {data:me,error:meErr}=await vx.rpc('vx_student_me');
  if(meErr){setError(meErr.message);setLoading(false);return}
  let p=me?.[0]||null;
  if(!p&&TRAINING_AUTO_JOIN){
   const {error:autoErr}=await vx.rpc('vx_training_auto_register_student_auth');
   if(autoErr){setError(autoErr.message);setProfile(null);setItems([]);setLoading(false);return}
   const again=await vx.rpc('vx_student_me');
   if(again.error){setError(again.error.message);setLoading(false);return}
   p=again.data?.[0]||null;
  }
  setProfile(p);
  if(p){const {data,error}=await vx.rpc('vx_student_assignments_v2_auth');if(error)setError(error.message);setItems(data||[])}else setItems([]);
  setLoading(false)
 }
 useEffect(()=>{refresh();const {data:{subscription}}=vx.auth.onAuthStateChange((_e,s)=>refresh(s));return()=>subscription.unsubscribe()},[]);
 async function signIn(e){e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const {error}=await vx.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});if(error)setError(error.message)}
 async function signUp(e){
  e.preventDefault();setError('');setMessage('');
  const fd=new FormData(e.currentTarget),email=String(fd.get('email')).trim(),password=String(fd.get('password'));
  const {data,error}=await vx.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/verifyx/student`,data:{vx_training_student:'true'}}});
  if(error){setError(error.message);return}
  let s=data.session||null;
  if(!s){
   const login=await vx.auth.signInWithPassword({email,password});
   if(login.error){setError('สมัครบัญชีแล้ว แต่ Login อัตโนมัติไม่สำเร็จ: '+login.error.message);return}
   s=login.data.session||null;
  }
  if(!s){setError('สมัครบัญชีแล้ว แต่ยังเปิด Session ไม่สำเร็จ');return}
  const {data:created,error:profileErr}=await vx.rpc('vx_training_auto_register_student_auth');
  if(profileErr){setError(profileErr.message);return}
  setMessage(`สมัครเรียบร้อย · รหัส ${created?.[0]?.student_code||'MONKEY-AUTO'}`);
  await refresh(s)
 }
 async function claim(e){e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const {data,error}=await vx.rpc('vx_student_claim_profile',{p_institution_code:String(fd.get('school')).trim().toUpperCase(),p_student_code:String(fd.get('code')).trim()});if(error){setError(error.message);return}if(data?.length){setMessage('ผูกบัญชีนักเรียนเรียบร้อย');await refresh(session)}}
 async function signOut(){await vx.auth.signOut()}
 const counts=useMemo(()=>({not_started:items.filter(x=>x.progress_status==='not_started').length,in_progress:items.filter(x=>x.progress_status==='in_progress').length,final:items.filter(x=>x.progress_status==='final').length}),[items]);
 if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังตรวจสอบบัญชีนักเรียน...</div></div></main>;
 if(!session)return <main className="vx-page"><div className="vx-wrap"><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><section className="vx-card vx-login"><div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>STUDENT ACCESS</p><h2>{mode==='signup'?'สมัครบัญชีนักเรียน':'Student Login'}</h2><p>ช่วงอบรม: สมัครด้วย Email ได้ทันที ไม่ต้องยืนยัน Email ระบบจะสร้างรหัส MONKEY-xxx ให้อัตโนมัติ</p>{message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}{mode==='login'?<form className="vx-form" onSubmit={signIn}><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required/></label><button className="vx-btn primary">Login</button></form>:<form className="vx-form" onSubmit={signUp}><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength="8" required/></label><button className="vx-btn primary">สมัครและเข้าใช้งาน</button></form>}<div className="vx-toolbar" style={{marginTop:12}}>{mode==='login'?<button className="vx-btn secondary" onClick={()=>setMode('signup')}>สมัครบัญชี</button>:<button className="vx-btn secondary" onClick={()=>setMode('login')}>กลับไป Login</button>}</div></section></div></main>;
 if(!profile)return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login"><p className="vx-kicker">TRAINING MODE</p><h2>กำลังสร้างรหัสผู้เรียนอัตโนมัติ</h2><p>บัญชี: <b>{session.user.email}</b></p>{error&&<div className="vx-error">{error}</div>}<button className="vx-btn primary" style={{width:'100%'}} onClick={()=>refresh(session)}>ลองอีกครั้ง</button><button className="vx-btn secondary" style={{width:'100%',marginTop:10}} onClick={signOut}><LogOut size={15}/>Logout</button></section></div></main>;
 return <main className="vx-page"><div className="vx-wrap"><nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link primary" href="/verifyx/student">Assignments</Link><Link className="vx-link secondary" href="/verifyx/student/results">Results</Link><Link className="vx-link secondary" href="/verifyx/student/profile">Profile</Link></nav><header className="vx-top"><div><Link className="vx-file" href="/verifyx"><ArrowLeft size={15}/>VerifyX</Link><p className="vx-kicker" style={{marginTop:14}}>STUDENT MODE</p><h1>การบ้านของฉัน</h1><div style={{display:'grid',gap:3,marginTop:6,fontSize:13,color:'#705b50'}}><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap'}}><b>School Code :</b><span>{profile.institution_code}</span></div><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap'}}><b>ชื่อ :</b><span>{profile.full_name}</span></div><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap',fontSize:12.5}}><b>รหัสนักศึกษา :</b><span>{profile.student_code}</span></div></div></div><button className="vx-btn secondary" onClick={signOut}><LogOut size={15}/>Logout</button></header>
 <div className="vx-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',marginBottom:16}}><div className="vx-card"><small>ยังไม่เริ่ม</small><h2>{counts.not_started}</h2></div><div className="vx-card"><small>กำลังทำ</small><h2>{counts.in_progress}</h2></div><div className="vx-card"><small>Final แล้ว</small><h2>{counts.final}</h2></div></div>
 {error&&<div className="vx-error">{error}</div>}<section className="vx-list">{items.length?items.map(a=>{const status=a.progress_status||'not_started';const cta=status==='final'?'ดูผล Final':status==='in_progress'?'ทำต่อ':'เริ่มทำ';return <Link className="vx-item" style={{textDecoration:'none',color:'inherit'}} key={a.id} href={`/verifyx/student/assignment/${a.id}`}><div><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><h3 style={{margin:0}}>{a.title}</h3><span className={`vx-progress ${status==='final'?'final':status==='in_progress'?'working':'muted'}`}><StatusIcon status={status}/>{statusLabel[status]||status}</span></div><p>{a.course||'ไม่ระบุวิชา'}</p><div className="vx-tags"><span>{assignmentTypeLabel[a.assignment_type]||a.assignment_type}</span><span>{diffLabel[a.difficulty]||a.difficulty}</span>{Number(a.cad_question_count||0)>0&&<span>CAD {a.cad_question_count}</span>}{Number(a.mcq_question_count||0)>0&&<span>ปรนัย {a.mcq_question_count}</span>}<span>รวม {a.question_count||0} ข้อ</span><span>Final ครั้งเดียว</span></div></div><span className="vx-link secondary" style={{pointerEvents:'none',whiteSpace:'nowrap'}}>{cta}</span></Link>}):<div className="vx-empty">ยังไม่มี Assignment ที่เปิดรับ</div>}</section></div></main>;
}
