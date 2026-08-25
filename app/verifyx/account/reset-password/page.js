'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {vx} from '../../vxClient';

export default function ResetPasswordPage(){
 const [session,setSession]=useState(null),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{(async()=>{const s=(await vx.auth.getSession()).data.session;setSession(s||null);setLoading(false)})();const {data:{subscription}}=vx.auth.onAuthStateChange((_e,s)=>setSession(s||null));return()=>subscription.unsubscribe()},[]);
 async function updatePassword(e){e.preventDefault();setError('');setMessage('');const fd=new FormData(e.currentTarget);const p=String(fd.get('password')||''),c=String(fd.get('confirm')||'');if(p.length<8){setError('Password ต้องอย่างน้อย 8 ตัวอักษร');return}if(p!==c){setError('Password สองช่องไม่ตรงกัน');return}const {error}=await vx.auth.updateUser({password:p});if(error){setError(error.message);return}setMessage('ตั้ง Password ใหม่เรียบร้อยแล้ว')}
 if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังตรวจสอบลิงก์...</div></div></main>;
 return <main className="vx-page"><div className="vx-wrap"><section className="vx-card vx-login"><div className="vx-logo">VX</div><p className="vx-kicker" style={{marginTop:14}}>ACCOUNT RECOVERY</p><h2>ตั้ง Password ใหม่</h2>{message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}{session?<form className="vx-form" onSubmit={updatePassword}><label>Password ใหม่<input name="password" type="password" minLength="8" required/></label><label>ยืนยัน Password ใหม่<input name="confirm" type="password" minLength="8" required/></label><button className="vx-btn primary">บันทึก Password ใหม่</button></form>:<div className="vx-empty">ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่จากหน้า Login</div>}<div className="vx-toolbar" style={{marginTop:12}}><Link className="vx-btn secondary" href="/verifyx/student">Student Login</Link><Link className="vx-btn secondary" href="/verifyx/teacher">Teacher Login</Link></div></section></div></main>;
}
