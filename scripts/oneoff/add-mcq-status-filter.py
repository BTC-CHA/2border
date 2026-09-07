from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

old = "const [mode,setMode]=useState('cad'),[mcqTab,setMcqTab]=useState('school'),[filter,setFilter]=useState('all'),[search,setSearch]=useState('');"
new = "const [mode,setMode]=useState('cad'),[mcqTab,setMcqTab]=useState('school'),[filter,setFilter]=useState('all'),[mcqStatus,setMcqStatus]=useState('all'),[search,setSearch]=useState('');"
if old not in text:
    raise SystemExit('state target not found')
text = text.replace(old, new, 1)

old = "const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${ccMcqCode(x,visibleSchoolMcq)} ${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,search]);"
new = "const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(mcqStatus==='all'||(mcqStatus==='active'?x.status==='active':x.status!=='active'))&&(!q||`${ccMcqCode(x,visibleSchoolMcq)} ${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,mcqStatus,search]);"
if old not in text:
    raise SystemExit('shownSchool target not found')
text = text.replace(old, new, 1)

old = "<div className=\"vx-form-row\"><label>ค้นหา<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={mode==='cad'?'ชื่อโจทย์ / Code / Category / Lot':'คำถาม / Subject / Category'}/></label><label>Difficulty<select value={filter} onChange={e=>setFilter(e.target.value)}><option value=\"all\">ทั้งหมด</option><option value=\"basic\">Basic</option><option value=\"pro\">Pro</option><option value=\"advanced\">Advanced</option></select></label></div>"
new = "<div className=\"vx-form-row\"><label>ค้นหา<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={mode==='cad'?'ชื่อโจทย์ / Code / Category / Lot':'คำถาม / Subject / Category'}/></label><label>Difficulty<select value={filter} onChange={e=>setFilter(e.target.value)}><option value=\"all\">ทั้งหมด</option><option value=\"basic\">Basic</option><option value=\"pro\">Pro</option><option value=\"advanced\">Advanced</option></select></label>{mode==='mcq'&&mcqTab==='school'&&<label>สถานะ<select value={mcqStatus} onChange={e=>setMcqStatus(e.target.value)}><option value=\"all\">ทั้งหมด</option><option value=\"active\">เปิดใช้</option><option value=\"inactive\">ปิดใช้</option></select></label>}</div>"
if old not in text:
    raise SystemExit('filter row target not found')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('patched', path)
