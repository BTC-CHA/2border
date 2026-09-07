from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

# Add explicit close/leave helpers and browser refresh protection.
needle = " useEffect(()=>{load();loadTeacherCode()},[]);\n"
insert = """ useEffect(()=>{load();loadTeacherCode()},[]);\n useEffect(()=>{\n  if(!showCadQuestion)return;\n  const warn=e=>{e.preventDefault();e.returnValue=''};\n  window.addEventListener('beforeunload',warn);\n  return()=>window.removeEventListener('beforeunload',warn);\n },[showCadQuestion]);\n function closeCadCreate(){setShowCadQuestion(false);setCadCodeChoice('');setCadAutoTitle('')}\n function confirmLeaveCadCreate(){return !showCadQuestion||window.confirm('กำลังสร้างโจทย์ CAD อยู่ ข้อมูลที่กรอกจะหาย ต้องการออกจากฟอร์มหรือไม่?')}\n"""
if needle not in text:
    raise SystemExit('useEffect target not found')
text = text.replace(needle, insert, 1)

old = "<button className=\"vx-btn secondary\" onClick={()=>{setShowCodeManager(v=>!v);setShowCadQuestion(false);setEditCadId(null)}}><Pencil size={15}/>จัดการ Code</button><button className=\"vx-btn primary\" onClick={()=>{setShowCadQuestion(v=>!v);setShowCodeManager(false);setEditCadId(null);setCadCodeChoice('');setCadAutoTitle('')}}><Plus size={15}/>เพิ่มโจทย์ CAD</button>"
new = "<button className=\"vx-btn secondary\" onClick={()=>{if(!confirmLeaveCadCreate())return;closeCadCreate();setShowCodeManager(v=>!v);setEditCadId(null)}}><Pencil size={15}/>จัดการ Code</button><button className=\"vx-btn primary\" onClick={()=>{setShowCadQuestion(true);setShowCodeManager(false);setEditCadId(null)}}><Plus size={15}/>เพิ่มโจทย์ CAD</button>"
if old not in text:
    raise SystemExit('CAD header button target not found')
text = text.replace(old, new, 1)

old = "<button className={`vx-btn ${mode==='mcq'?'primary':'secondary'}`} onClick={()=>{setMode('mcq');setShowCadQuestion(false);setEditCadId(null)}}>ปรนัย / Multiple Choice</button>"
new = "<button className={`vx-btn ${mode==='mcq'?'primary':'secondary'}`} onClick={()=>{if(!confirmLeaveCadCreate())return;closeCadCreate();setMode('mcq');setEditCadId(null)}}>ปรนัย / Multiple Choice</button>"
if old not in text:
    raise SystemExit('MCQ mode button target not found')
text = text.replace(old, new, 1)

old = "<button className=\"vx-btn primary\" disabled={saving||!cadCodeChoice||(cadCodeChoice==='__new__'&&!teacherCode)}>{saving?'กำลังบันทึก...':'บันทึกโจทย์ CAD'}</button></form></section>}"
new = "<div className=\"vx-toolbar\"><button className=\"vx-btn primary\" disabled={saving||!cadCodeChoice||(cadCodeChoice==='__new__'&&!teacherCode)}>{saving?'กำลังบันทึก...':'บันทึกโจทย์ CAD'}</button><button type=\"button\" className=\"vx-btn secondary\" disabled={saving} onClick={()=>{if(window.confirm('ยกเลิกการสร้างโจทย์นี้? ข้อมูลที่กรอกจะถูกล้าง'))closeCadCreate()}}>ยกเลิก</button></div></form></section>}"
if old not in text:
    raise SystemExit('CAD form submit target not found')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('patched', path)
