import Link from 'next/link';
import { GraduationCap, School } from 'lucide-react';

export default function VerifyXHome(){
  return <main className="vx-page"><div className="vx-wrap">
    <header className="vx-top"><div className="vx-brand"><div className="vx-logo">VX</div><div><h1>VerifyX</h1><p>Automated Engineering Assignment Verification</p></div></div></header>
    <section className="vx-grid">
      <article className="vx-card"><School size={28}/><p className="vx-kicker">TEACHER MODE</p><h2>สำหรับครู</h2><p>สร้าง Assignment, เพิ่มโจทย์, ตั้งค่า Reference Mass Properties และดูผลการส่งงาน</p><Link className="vx-link primary" href="/verifyx/teacher">เข้าสู่ Teacher</Link></article>
      <article className="vx-card"><GraduationCap size={28}/><p className="vx-kicker">STUDENT MODE</p><h2>สำหรับนักเรียน</h2><p>เปิด Drawing, กรอกค่า Mass Properties และส่งเพื่อตรวจคะแนนอัตโนมัติ</p><Link className="vx-link secondary" href="/verifyx/student">เข้าสู่ Student</Link></article>
    </section>
  </div></main>;
}
