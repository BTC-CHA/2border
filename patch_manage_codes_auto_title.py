from pathlib import Path
p=Path('app/verifyx/teacher/question-bank/page.js')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: anchor not found')
    s=s.replace(old,new,1)

rep(
"import {Plus,FileText,Image as ImageIcon,Power,Download,RefreshCw,Pencil} from 'lucide-react';",
"import {Plus,FileText,Image as ImageIcon,Power,Download,RefreshCw,Pencil,Trash2} from 'lucide-react';",
'import'
)

rep(
" const [teacherCode,setTeacherCode]=useState(''),[editCadId,setEditCadId]=useState(null),[cadCodeChoice,setCadCodeChoice]=useState('');",
" const [teacherCode,setTeacherCode]=useState(''),[editCadId,setEditCadId]=useState(null),[cadCodeChoice,setCadCodeChoice]=useState('');\n const [showCodeManager,setShowCodeManager]=useState(false),[cadAutoTitle,setCadAutoTitle]=useState('');",
'state'
)

rep(
" function lotSuffix(lot){const value=String(lot||'');const prefix=teacherCode?`${teacherCode}-`:'';if(prefix&&value.startsWith(prefix))return value.slice(prefix.length)||'001';return value.split('-').pop()||'001'}",
""" function lotSuffix(lot){const value=String(lot||'');const prefix=teacherCode?`${teacherCode}-`:'';if(prefix&&value.startsWith(prefix))return value.slice(prefix.length)||'001';return value.split('-').pop()||'001'}
 function prefixForCategory(category){return category==='assembly'?'ASM':category==='drawing'?'DRAW':category==='sheet_metal'?'SHEET':category==='surface'?'SURF':'PART'}
 function nextCadTitleForFamily(family){
  if(!family)return 'PART-001';
  const rows=items.filter(x=>x.family_id===family.id),parsed=rows.map(x=>String(x.title||'').trim().toUpperCase().match(/^([A-Z]+)-(\\d+)$/)).filter(Boolean);
  if(!parsed.length)return `${prefixForCategory(family.category)}-001`;
  const latest=parsed.reduce((best,m)=>Number(m[2])>Number(best[2])?m:best,parsed[0]);
  return `${latest[1]}-${String(Number(latest[2])+1).padStart(Math.max(3,latest[2].length),'0')}`
 }
 function chooseCadCode(value){
  setCadCodeChoice(value);
  if(value==='__new__')return setCadAutoTitle('PART-001');
  const family=families.find(f=>f.code===value);setCadAutoTitle(nextCadTitleForFamily(family));
 }""",
'helpers'
)

rep(
"   form.reset();setCadCodeChoice('');setShowCadQuestion(false);setMessage('เพิ่มโจทย์ CAD แล้ว');await load();",
"   form.reset();setCadCodeChoice('');setCadAutoTitle('');setShowCadQuestion(false);setMessage('เพิ่มโจทย์ CAD แล้ว');await load();",
'reset'
)

anchor=" async function addMcq(e){"
if anchor not in s: raise SystemExit('functions anchor not found')
manager_funcs=r''' async function createCadCode(e){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const form=e.currentTarget,fd=new FormData(form);
  try{
   const code=String(fd.get('code')||'').trim().toUpperCase(),category=String(fd.get('category')||'part_modeling'),difficulty=String(fd.get('difficulty')||'basic'),lotCode=String(fd.get('lotCode')||'').trim();
   if(!code)throw new Error('กรุณาใส่ Code');if(!/^\d{3}$/.test(lotCode))throw new Error('Lot ใช้รหัส 3 หลัก เช่น 001');
   const lot=teacherCode?`${teacherCode}-${lotCode}`:'';if(!lot)throw new Error('ไม่พบชื่อครู');
   const {data:exists,error:checkError}=await vx.from('vx_question_families').select('id').eq('code',code).limit(1);if(checkError)throw checkError;if((exists||[]).length)throw new Error(`Code ${code} มีอยู่แล้ว`);
   const {error}=await vx.from('vx_question_families').insert({code,name:code,category,lot,difficulty,description:''});if(error)throw error;
   form.reset();setMessage(`เพิ่ม Code ${code} แล้ว`);await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 async function updateCadCode(e,f){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const fd=new FormData(e.currentTarget);
  try{
   const code=String(fd.get('code')||'').trim().toUpperCase(),category=String(fd.get('category')||f.category||'part_modeling'),difficulty=String(fd.get('difficulty')||f.difficulty||'basic'),lotCode=String(fd.get('lotCode')||'').trim();
   if(!code)throw new Error('กรุณาใส่ Code');if(!/^\d{3}$/.test(lotCode))throw new Error('Lot ใช้รหัส 3 หลัก เช่น 001');
   const {data:exists,error:checkError}=await vx.from('vx_question_families').select('id').eq('code',code).neq('id',f.id).limit(1);if(checkError)throw checkError;if((exists||[]).length)throw new Error(`Code ${code} มีอยู่แล้ว`);
   const lot=teacherCode?`${teacherCode}-${lotCode}`:f.lot;
   const {error}=await vx.from('vx_question_families').update({code,name:code,category,difficulty,lot,updated_at:new Date().toISOString()}).eq('id',f.id);if(error)throw error;
   setMessage(`แก้ไข Code ${code} แล้ว`);await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 async function deleteCadCode(f){
  const count=items.filter(q=>q.family_id===f.id).length;
  if(count)return setError(`Code ${f.code} ยังมีโจทย์ ${count} ข้อ กรุณาย้ายหรือลบโจทย์ออกก่อน`);
  if(!window.confirm(`ลบ Code ${f.code} ?`))return;
  setSaving(true);setError('');setMessage('');
  const {error}=await vx.from('vx_question_families').delete().eq('id',f.id);setSaving(false);if(error)return setError(error.message);setMessage(`ลบ Code ${f.code} แล้ว`);await load();
 }

'''
s=s.replace(anchor,manager_funcs+anchor,1)

old_header="""<header className=\"vx-top\"><div><p className=\"vx-kicker\">QUESTION BANK</p><h1>คลังโจทย์</h1><p>School Central Question Bank · CAD / Mass Properties + ปรนัย พร้อม Category และ Lot</p></div><div className=\"vx-toolbar\"><button className=\"vx-btn secondary\" onClick={load}><RefreshCw size={15}/>Refresh</button>{mode==='cad'?<button className=\"vx-btn primary\" onClick={()=>{setShowCadQuestion(v=>!v);setEditCadId(null);setCadCodeChoice('')}}><Plus size={15}/>เพิ่มโจทย์ CAD</button>:mcqTab==='school'?<button className=\"vx-btn primary\" onClick={()=>setShowMcq(v=>!v)}><Plus size={15}/>เพิ่มข้อปรนัย</button>:<button className=\"vx-btn primary\" disabled={!selectedSystem.length||saving} onClick={importSelected}><Download size={15}/>นำเข้า {selectedSystem.length} ข้อ</button>}</div></header>"""
new_header="""<header className=\"vx-top\"><div><p className=\"vx-kicker\">QUESTION BANK</p><h1>คลังโจทย์</h1><p>School Central Question Bank · CAD / Mass Properties + ปรนัย พร้อม Category และ Lot</p></div><div className=\"vx-toolbar\"><button className=\"vx-btn secondary\" onClick={load}><RefreshCw size={15}/>Refresh</button>{mode==='cad'?<><button className=\"vx-btn secondary\" onClick={()=>{setShowCodeManager(v=>!v);setShowCadQuestion(false);setEditCadId(null)}}><Pencil size={15}/>จัดการ Code</button><button className=\"vx-btn primary\" onClick={()=>{setShowCadQuestion(v=>!v);setShowCodeManager(false);setEditCadId(null);setCadCodeChoice('');setCadAutoTitle('')}}><Plus size={15}/>เพิ่มโจทย์ CAD</button></>:mcqTab==='school'?<button className=\"vx-btn primary\" onClick={()=>setShowMcq(v=>!v)}><Plus size={15}/>เพิ่มข้อปรนัย</button>:<button className=\"vx-btn primary\" disabled={!selectedSystem.length||saving} onClick={importSelected}><Download size={15}/>นำเข้า {selectedSystem.length} ข้อ</button>}</div></header>"""
rep(old_header,new_header,'header')

mcq_tabs="""  {mode==='mcq'&&<div className=\"vx-toolbar\" style={{marginTop:8}}><button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} onClick={()=>setMcqTab('school')}>School Bank · {schoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} onClick={()=>setMcqTab('system')}>System Bank · {systemMcq.length}</button></div>}"""
manager_ui=r'''  {mode==='cad'&&showCodeManager&&<section className="vx-card" style={{marginTop:10}}><p className="vx-kicker">CAD CODE MANAGER</p><h3>จัดการ Code</h3><p>Code ใช้เป็นกลุ่มโจทย์ · แก้ชื่อ / Category / ระดับ / Lot ได้ และลบได้เมื่อไม่มีโจทย์อยู่ใน Code</p><form className="vx-form" onSubmit={createCadCode} style={{marginTop:12}}><div className="vx-form-row"><label>Code ใหม่<input name="code" placeholder="เช่น 3D-EXERCISES" required/></label><label>Category<select name="category" defaultValue="part_modeling">{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><div className="vx-form-row"><label>ระดับ<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>Lot<div style={{display:'grid',gridTemplateColumns:'minmax(90px,1fr) auto 90px',gap:8,alignItems:'center'}}><input value={teacherCode||'กำลังโหลด...'} readOnly/><b>-</b><input name="lotCode" defaultValue="001" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} required/></div></label></div><button className="vx-btn primary" disabled={saving||!teacherCode}><Plus size={15}/>เพิ่ม Code</button></form><div className="vx-list" style={{marginTop:16}}>{families.map(f=>{const count=items.filter(q=>q.family_id===f.id).length;return <form key={f.id} className="vx-item" onSubmit={e=>updateCadCode(e,f)} style={{display:'block'}}><div className="vx-form-row"><label>Code<input name="code" defaultValue={f.code} required/></label><label>Category<select name="category" defaultValue={f.category||'part_modeling'}>{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><div className="vx-form-row"><label>ระดับ<select name="difficulty" defaultValue={f.difficulty||'basic'}><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>Lot<div style={{display:'grid',gridTemplateColumns:'minmax(90px,1fr) auto 90px',gap:8,alignItems:'center'}}><input value={teacherCode||'กำลังโหลด...'} readOnly/><b>-</b><input name="lotCode" defaultValue={lotSuffix(f.lot)} inputMode="numeric" pattern="[0-9]{3}" maxLength={3} required/></div></label></div><div className="vx-toolbar" style={{marginTop:8}}><span className="vx-progress muted">{count} ข้อ</span><button className="vx-btn secondary" disabled={saving}>บันทึก Code</button><button type="button" className="vx-btn secondary" disabled={saving||count>0} title={count>0?'ต้องย้ายหรือลบโจทย์ออกจาก Code ก่อน':''} onClick={()=>deleteCadCode(f)}><Trash2 size={14}/>ลบ</button></div></form>})}</div></section>}'''
if mcq_tabs not in s: raise SystemExit('manager UI anchor not found')
s=s.replace(mcq_tabs,mcq_tabs+'\n'+manager_ui,1)

rep(
"<label>Code<select name=\"codeChoice\" value={cadCodeChoice} onChange={e=>setCadCodeChoice(e.target.value)} required><option value=\"\" disabled>เลือก Code</option>{families.map(f=><option key={f.id} value={f.code}>{f.code}</option>)}<option value=\"__new__\">+ สร้าง Code ใหม่</option></select></label><label>ชื่อโจทย์<input name=\"title\" placeholder=\"เช่น PART-003\" required/></label>",
"<label>Code<select name=\"codeChoice\" value={cadCodeChoice} onChange={e=>chooseCadCode(e.target.value)} required><option value=\"\" disabled>เลือก Code</option>{families.map(f=><option key={f.id} value={f.code}>{f.code}</option>)}<option value=\"__new__\">+ สร้าง Code ใหม่</option></select></label><label>ชื่อโจทย์<input name=\"title\" value={cadAutoTitle} readOnly placeholder=\"เลือก Code เพื่อสร้างชื่ออัตโนมัติ\" required/></label>",
'add form code/title'
)

rep(
"<label>Category<select name=\"category\" defaultValue=\"part_modeling\">{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>ระดับ",
"<label>Category<select name=\"category\" defaultValue=\"part_modeling\" onChange={e=>setCadAutoTitle(`${prefixForCategory(e.target.value)}-001`)}>{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>ระดับ",
'new code category'
)

p.write_text(s,encoding='utf-8')
print('patched',p)
