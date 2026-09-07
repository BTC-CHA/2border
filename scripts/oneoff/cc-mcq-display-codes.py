from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

anchor = "const categoryOptions=[['part_modeling','Part Modeling'],['assembly','Assembly'],['drawing','Drawing'],['sheet_metal','Sheet Metal'],['surface','Surface'],['other','Other']];\n"
helper = """const categoryOptions=[['part_modeling','Part Modeling'],['assembly','Assembly'],['drawing','Drawing'],['sheet_metal','Sheet Metal'],['surface','Surface'],['other','Other']];
function ccCategoryToken(q){const raw=`${q?.category_code||''} ${q?.category_name||''}`.toUpperCase();if(raw.includes('ASSEMB')||raw.includes('ASSY'))return 'ASSY';if(raw.includes('DRAW'))return 'DRAW';return 'PART'}
function ccDifficultyToken(d){return d==='basic'?'A':d==='pro'?'B':d==='advanced'?'C':'X'}
function ccMcqCode(q,list){if(String(q?.subject||'').trim().toLowerCase()!=='crowncad')return '';const category=ccCategoryToken(q),difficulty=String(q?.difficulty||'');const peers=(list||[]).filter(x=>String(x?.subject||'').trim().toLowerCase()==='crowncad'&&ccCategoryToken(x)===category&&String(x?.difficulty||'')===difficulty).sort((a,b)=>Number(a.id)-Number(b.id));const index=peers.findIndex(x=>Number(x.id)===Number(q.id));return index<0?'':`CC-${category}-${ccDifficultyToken(difficulty)}-${String(index+1).padStart(3,'0')}`}
"""
if anchor not in text:
    raise SystemExit('constants anchor not found')
text = text.replace(anchor, helper, 1)

old_school = "const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,search]);"
new_school = "const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${ccMcqCode(x,visibleSchoolMcq)} ${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,search]);"
if old_school not in text:
    raise SystemExit('school filter anchor not found')
text = text.replace(old_school, new_school, 1)

old_system = "const shownSystem=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSystemMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSystemMcq,filter,search]);"
new_system = "const shownSystem=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSystemMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${ccMcqCode(x,visibleSystemMcq)} ${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSystemMcq,filter,search]);"
if old_system not in text:
    raise SystemExit('system filter anchor not found')
text = text.replace(old_system, new_system, 1)

old_placeholder = "placeholder={mode==='cad'?'ชื่อโจทย์ / Code / Category / Lot':'คำถาม / Subject / Category'}"
new_placeholder = "placeholder={mode==='cad'?'ชื่อโจทย์ / Code / Category / Lot':'คำถาม / Code / Subject / Category'}"
if old_placeholder not in text:
    raise SystemExit('search placeholder anchor not found')
text = text.replace(old_placeholder, new_placeholder, 1)

old_school_kicker = '<p className="vx-kicker">MCQ · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:\'\'}</p>'
new_school_kicker = '<p className="vx-kicker">{ccMcqCode(q,visibleSchoolMcq)||\'MCQ\'} · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:\'\'}</p>'
if old_school_kicker not in text:
    raise SystemExit('school kicker anchor not found')
text = text.replace(old_school_kicker, new_school_kicker, 1)

old_system_kicker = '<p className="vx-kicker">SYSTEM MCQ · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:\'\'}</p>'
new_system_kicker = '<p className="vx-kicker">{ccMcqCode(q,visibleSystemMcq)||\'SYSTEM MCQ\'} · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:\'\'}</p>'
if old_system_kicker not in text:
    raise SystemExit('system kicker anchor not found')
text = text.replace(old_system_kicker, new_system_kicker, 1)

path.write_text(text, encoding='utf-8')
print('patched', path)
