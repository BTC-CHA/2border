from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

old = '''  <div className="vx-toolbar" style={{marginTop:14}}><button className={`vx-btn ${mode==='cad'?'primary':'secondary'}`} onClick={()=>setMode('cad')}>CAD / Mass Properties</button><button className={`vx-btn ${mode==='mcq'?'primary':'secondary'}`} onClick={()=>{if(!confirmLeaveCadCreate())return;closeCadCreate();setMode('mcq');setEditCadId(null)}}>ปรนัย / Multiple Choice</button></div>\n  {mode==='mcq'&&<div className="vx-toolbar" style={{marginTop:8}}><button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} onClick={()=>setMcqTab('school')}>School Bank · {visibleSchoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} onClick={()=>setMcqTab('system')}>System Bank · {visibleSystemMcq.length}</button></div>}'''

new = '''  <div style={{marginTop:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div className="vx-toolbar"><button className={`vx-btn ${mode==='cad'?'primary':'secondary'}`} onClick={()=>setMode('cad')}>CAD / Mass Properties</button><button className={`vx-btn ${mode==='mcq'?'primary':'secondary'}`} onClick={()=>{if(!confirmLeaveCadCreate())return;closeCadCreate();setMode('mcq');setEditCadId(null)}}>ปรนัย / Multiple Choice</button></div>{mode==='mcq'&&<div className="vx-toolbar" style={{gap:6,marginLeft:'auto'}}><button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} style={{padding:'7px 11px',minHeight:34,fontSize:11}} onClick={()=>setMcqTab('school')}>School Bank · {visibleSchoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} style={{padding:'7px 11px',minHeight:34,fontSize:11}} onClick={()=>setMcqTab('system')}>System Bank · {visibleSystemMcq.length}</button></div>}</div>'''

if old not in text:
    raise SystemExit('bank tabs target not found')

path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('patched', path)
