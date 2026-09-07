from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')
old = """<div className=\"vx-toolbar\" style={{marginTop:10}}><button className=\"vx-file\" onClick={()=>toggleMcq(q)}><Power size={14}/>{q.status==='active'?'ปิดใช้':'เปิดใช้'}</button></div>"""
new = """<div className=\"vx-toolbar\" style={{marginTop:10}}><button className=\"vx-file\" style={{width:'100%',background:q.status==='active'?'#eaf8ef':'#fff0ef',borderColor:q.status==='active'?'#bfe8cb':'#f2b9b4',color:q.status==='active'?'#2e7d4f':'#b6463a',fontWeight:700}} onClick={()=>toggleMcq(q)}><Power size={14}/>{q.status==='active'?'ปิดใช้':'เปิดใช้'}</button></div>"""
if old not in text:
    raise SystemExit('target MCQ status button not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patched', path)
