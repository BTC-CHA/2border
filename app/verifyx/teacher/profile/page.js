'use client';

import {useEffect,useState} from 'react';
import TeacherNav from '../TeacherNav';
import {vx} from '../../vxClient';
export default function TeacherProfile(){
 const [user,setUser]=useState(null),[me,setMe]=useState(null),[school,setSchool]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{const [{data:u,error:ue},{data:t,error:te},{data:i,error:ie}]=await Promise.all([vx.auth.getUser(),vx.rpc('vx_teacher_team'),vx.rpc('vx_teacher_institution')]);const err=ue||te||ie;if(err)setError(err.message);const uid=u?.user?.id;setUser(u?.user||null);setMe((t||[]).find(x=>x.user_id===uid)||null);setSchool(i?.[0]||null);setLoading(false)})()},[]);
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="profile"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Profile</h1><p>ข้อมูลบัญชีครูของฉัน</p></div></div>{error&&<div className="vx-error">{error}</div>}{loading?<div className="vx-empty">กำลังโหลด...</div>:<section className="vx-card"><div className="vx-list"><div className="vx-item"><div><small>ชื่อครู</small><h3>{me?.display_name||user?.user_metadata?.display_name||'Teacher'}</h3></div></div><div className="vx-item"><div><small>Email</small><h3>{user?.email||'—'}</h3></div><span className="vx-progress final">Verified Account</span></div><div className="vx-item"><div><small>Role</small><h3>{me?.role==='owner'?'Owner':'Teacher'}</h3></div></div><div className="vx-item"><div><small>โรงเรียน / สถาบัน</small><h3>{school?.name||'—'}</h3><p>School Code: {school?.code||'—'}</p></div></div></div></section>}</div></main>;
}
