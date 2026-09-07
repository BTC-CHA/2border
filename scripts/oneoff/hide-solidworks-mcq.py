from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

old = """ const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return schoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[schoolMcq,filter,search]);\n const shownSystem=useMemo(()=>{const q=search.toLowerCase().trim();return systemMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[systemMcq,filter,search]);"""
new = """ const visibleSchoolMcq=useMemo(()=>schoolMcq.filter(x=>String(x.subject||'').trim().toLowerCase()!=='solidworks'),[schoolMcq]);\n const visibleSystemMcq=useMemo(()=>systemMcq.filter(x=>String(x.subject||'').trim().toLowerCase()!=='solidworks'),[systemMcq]);\n const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,search]);\n const shownSystem=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSystemMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSystemMcq,filter,search]);"""
if old not in text:
    raise SystemExit('MCQ filter block not found')
text = text.replace(old, new, 1)

old_tabs = """<button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} onClick={()=>setMcqTab('school')}>School Bank · {schoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} onClick={()=>setMcqTab('system')}>System Bank · {systemMcq.length}</button>"""
new_tabs = """<button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} onClick={()=>setMcqTab('school')}>School Bank · {visibleSchoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} onClick={()=>setMcqTab('system')}>System Bank · {visibleSystemMcq.length}</button>"""
if old_tabs not in text:
    raise SystemExit('MCQ tab count block not found')
text = text.replace(old_tabs, new_tabs, 1)

path.write_text(text, encoding='utf-8')
print('patched', path)
