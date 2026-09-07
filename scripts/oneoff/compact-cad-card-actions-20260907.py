from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

old = '''<div className="vx-toolbar"><button className="vx-file" disabled={!q.drawing_path} onClick={()=>openFile(q.drawing_path)}><FileText size={14}/>Drawing</button>{q.model_image_path&&<button className="vx-file" onClick={()=>openFile(q.model_image_path)}><ImageIcon size={14}/>Model</button>}<button className="vx-file" onClick={()=>setEditCadId(editCadId===q.id?null:q.id)}><Pencil size={14}/>{editCadId===q.id?'ยกเลิกแก้ไข':'แก้ไข'}</button><button className="vx-file" onClick={()=>toggleCad(q)}><Power size={14}/>{q.is_active?'ปิดใช้':'เปิดใช้'}</button></div>'''

new = '''<div className="vx-toolbar" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:12}}><button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} disabled={!q.drawing_path} onClick={()=>openFile(q.drawing_path)}><FileText size={14}/>Drawing</button>{q.model_image_path?<button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>openFile(q.model_image_path)}><ImageIcon size={14}/>Model</button>:<span/>}<button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>setEditCadId(editCadId===q.id?null:q.id)}><Pencil size={14}/>{editCadId===q.id?'ยกเลิกแก้ไข':'แก้ไข'}</button><button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>toggleCad(q)}><Power size={14}/>{q.is_active?'ปิดใช้':'เปิดใช้'}</button></div>'''

if old not in text:
    raise SystemExit('CAD toolbar target not found')

text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patched', path)
