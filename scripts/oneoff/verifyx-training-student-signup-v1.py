from pathlib import Path
import re

p=Path('app/verifyx/student/page.js')
s=p.read_text(encoding='utf-8')

if "const TRAINING_AUTO_JOIN=true;" not in s:
    anchor="const assignmentTypeLabel={cad:'CAD / Mass Properties',mcq:'Multiple Choice',mixed:'CAD + Multiple Choice'};\n"
    if anchor not in s: raise SystemExit('missing assignmentTypeLabel anchor')
    s=s.replace(anchor,anchor+"const TRAINING_AUTO_JOIN=true;\n",1)

refresh_new=""" async function refresh(nextSession){
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
"""
s,n=re.subn(r" async function refresh\(nextSession\)\{.*?\}\n useEffect",refresh_new+" useEffect",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'refresh replacement count {n}')

signup_new=""" async function signUp(e){
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
"""
s,n=re.subn(r" async function signUp\(e\)\{.*?\}\n async function claim",signup_new+" async function claim",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'signUp replacement count {n}')

old_intro="<p>นักเรียนต้องใช้ Email ที่ยืนยันแล้ว และ Email ต้องตรงกับรายชื่อที่อาจารย์ลงทะเบียนไว้</p>"
new_intro="<p>ช่วงอบรม: สมัครด้วย Email ได้ทันที ไม่ต้องยืนยัน Email ระบบจะสร้างรหัส MONKEY-xxx ให้อัตโนมัติ</p>"
if old_intro not in s: raise SystemExit('signup intro anchor missing')
s=s.replace(old_intro,new_intro,1)

old_btn='<button className="vx-btn primary">สมัครและส่ง Email ยืนยัน</button>'
new_btn='<button className="vx-btn primary">สมัครและเข้าใช้งาน</button>'
if old_btn not in s: raise SystemExit('signup button anchor missing')
s=s.replace(old_btn,new_btn,1)

fallback=""" if(!profile)return <main className=\"vx-page\"><div className=\"vx-wrap\"><section className=\"vx-card vx-login\"><p className=\"vx-kicker\">TRAINING MODE</p><h2>กำลังสร้างรหัสผู้เรียนอัตโนมัติ</h2><p>บัญชี: <b>{session.user.email}</b></p>{error&&<div className=\"vx-error\">{error}</div>}<button className=\"vx-btn primary\" style={{width:'100%'}} onClick={()=>refresh(session)}>ลองอีกครั้ง</button><button className=\"vx-btn secondary\" style={{width:'100%',marginTop:10}} onClick={signOut}><LogOut size={15}/>Logout</button></section></div></main>;
"""
s,n=re.subn(r" if\(!profile\)return <main.*?;</main>;\n return <main className=\"vx-page\">",fallback+" return <main className=\"vx-page\">",s,count=1,flags=re.S)
if n!=1:
    # JSX has nested tags, match the exact profile block up to the normal page return instead.
    start=s.find(' if(!profile)return <main className="vx-page">')
    end=s.find('\n return <main className="vx-page">',start)
    if start<0 or end<0: raise SystemExit('profile fallback anchors missing')
    s=s[:start]+fallback+s[end+1:]

p.write_text(s,encoding='utf-8')
print('VERIFYX_TRAINING_STUDENT_SIGNUP_V1_OK')
