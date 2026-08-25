'use client';

import Link from 'next/link';

export default function TeacherNav({active}){
  const items=[['assignments','/verifyx/teacher','Assignments'],['bank','/verifyx/teacher/question-bank','Question Bank'],['students','/verifyx/teacher/students','Students'],['results','/verifyx/teacher/results','Results'],['school','/verifyx/teacher/school-profile','School Profile'],['settings','/verifyx/teacher/settings','Settings'],['profile','/verifyx/teacher/profile','Profile']];
  return <nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>{items.map(([id,href,label])=><Link key={id} href={href} style={{textDecoration:'none',padding:'9px 12px',borderRadius:12,border:'1px solid #efd9cc',background:active===id?'#f39a62':'#fffaf6',color:active===id?'white':'#8a604b',fontWeight:800,fontSize:13}}>{label}</Link>)}</nav>;
}
