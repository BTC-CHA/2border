from pathlib import Path


def rep(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# Student assignment / exam layout
page = Path('app/verifyx/student/assignment/[id]/page.js')
s = page.read_text(encoding='utf-8')

s = rep(
    s,
    " const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[showFinalDetails,setShowFinalDetails]=useState(false);",
    " const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[showFinalDetails,setShowFinalDetails]=useState(false);\n const [drawingPreviewUrl,setDrawingPreviewUrl]=useState('');",
    'preview state'
)

s = rep(
    s,
    " useEffect(()=>{const warn=e=>{if(!hasDirty||status==='final')return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[hasDirty,status]);",
    " useEffect(()=>{const warn=e=>{if(!hasDirty||status==='final')return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[hasDirty,status]);\n useEffect(()=>{let alive=true;setDrawingPreviewUrl('');if(!current?.drawing_path||current?.question_type==='mcq')return()=>{alive=false};(async()=>{const {data}=await vx.storage.from(VX_BUCKET).createSignedUrl(current.drawing_path,300);if(alive)setDrawingPreviewUrl(data?.signedUrl||'')})();return()=>{alive=false}},[current?.item_id,current?.drawing_path,current?.question_type]);",
    'preview effect'
)

s = rep(
    s,
    "   <section className={`vx-card vx-exam-question ${current.is_flagged?'vx-flagged-card':''}`}>",
    "   <section className={`vx-card vx-exam-question ${!isMcq?'vx-cad-question':''} ${current.is_flagged?'vx-flagged-card':''}`}>",
    'cad question class'
)

old_tools = "    <div className=\"vx-toolbar vx-exam-tools\">{!isMcq&&<button className=\"vx-file\" disabled={!current.drawing_path} onClick={()=>openFile(current.drawing_path)}><FileText size={15}/>{current.drawing_path?'Drawing PDF':'ยังไม่มี PDF'}</button>}<button className={`vx-file ${current.is_flagged?'vx-flag-active':''}`} onClick={()=>toggleFlag(current)}><Flag size={15}/>{current.is_flagged?'ติดธงแล้ว':'มาร์กไม่แน่ใจ'}</button></div>"
new_tools = "    {!isMcq&&<div className=\"vx-toolbar vx-exam-tools\"><button className=\"vx-file\" disabled={!current.drawing_path} onClick={()=>openFile(current.drawing_path)}><FileText size={15}/>{current.drawing_path?'Drawing PDF':'ยังไม่มี PDF'}</button></div>}"
s = rep(s, old_tools, new_tools, 'move flag from top tools')

old_cad = "    :<div className=\"vx-form\"><div className=\"vx-empty\" style={{marginTop:0}}>เขียนชิ้นงานตาม Drawing แล้วนำค่าจาก Mass Properties มากรอกด้านล่าง</div><div className=\"vx-mass-grid\"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label></div>{status!=='final'&&<button className=\"vx-btn primary\" disabled={savingId!==null} onClick={()=>saveCad(current)}><Save size={15}/>{savingId===current.item_id?'กำลังบันทึก...':'บันทึกค่า CAD'}</button>}</div>}"
new_cad = "    :<div className=\"vx-form vx-cad-form\"><div className=\"vx-cad-instruction\">เขียนชิ้นงานตาม Drawing แล้วนำค่าจาก Mass Properties มากรอกด้านล่าง</div><div className=\"vx-cad-preview\">{drawingPreviewUrl?<iframe title={`Drawing ${current.title}`} src={`${drawingPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`} />:<div className=\"vx-empty\">{current.drawing_path?'กำลังเตรียม Drawing Preview...':'ยังไม่มี Drawing Preview'}</div>}</div><div className=\"vx-mass-grid vx-cad-answer-grid\"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label></div>{status!=='final'&&<button className=\"vx-btn primary vx-cad-save-btn\" disabled={savingId!==null} onClick={()=>saveCad(current)}><Save size={14}/>{savingId===current.item_id?'กำลังบันทึก...':'บันทึกค่า CAD'}</button>}</div>}"
s = rep(s, old_cad, new_cad, 'cad workspace')

old_footer = "   <div className=\"vx-exam-footer\"><button className=\"vx-exam-arrow\" disabled={currentIndex===0} onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))}><ArrowLeft size={28}/></button><button className=\"vx-btn secondary vx-exam-summary-btn\" onClick={()=>setStage('summary')}><ListChecks size={17}/>Summary</button><button className=\"vx-exam-arrow\" disabled={currentIndex===items.length-1} onClick={()=>setCurrentIndex(i=>Math.min(items.length-1,i+1))}><ArrowRight size={28}/></button></div>"
new_footer = "   <div className=\"vx-exam-footer\"><div className=\"vx-exam-navcluster\"><button className=\"vx-exam-arrow\" disabled={currentIndex===0} onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))}><ArrowLeft size={20}/></button><button className=\"vx-btn secondary vx-exam-summary-btn\" onClick={()=>setStage('summary')}><ListChecks size={15}/>Summary</button><button className=\"vx-exam-arrow\" disabled={currentIndex===items.length-1} onClick={()=>setCurrentIndex(i=>Math.min(items.length-1,i+1))}><ArrowRight size={20}/></button></div>{status!=='final'&&<button className={`vx-file vx-exam-flag-btn ${current.is_flagged?'vx-flag-active':''}`} onClick={()=>toggleFlag(current)}><Flag size={14}/>{current.is_flagged?'ติดธงแล้ว':'มาร์กไม่แน่ใจ'}</button>}</div>"
s = rep(s, old_footer, new_footer, 'compact footer and flag')

page.write_text(s, encoding='utf-8')

# Student Results compact desktop/notebook layout
results = Path('app/verifyx/student/results/page.js')
r = results.read_text(encoding='utf-8')
r = rep(r, '<section className="vx-list">{groups.map', '<section className="vx-list vx-student-results-list">{groups.map', 'results list class')
r = rep(r, '<article className="vx-card" key={g.assignment_id}', '<article className="vx-card vx-student-result-card" key={g.assignment_id}', 'results card class')
r = rep(r, "{isOpen&&<div style={{display:'grid',gap:9,marginTop:14,paddingTop:14,borderTop:'1px solid #efddd2'}}>", "{isOpen&&<div className=\"vx-student-result-details\">", 'results detail class')
results.write_text(r, encoding='utf-8')

# CSS overrides
css = Path('app/verifyx/verifyx-round2.css')
c = css.read_text(encoding='utf-8')
marker = 'VERIFYX_STUDENT_EXAM_COMPACT_DESKTOP_V1'
if marker not in c:
    c += r'''

/* VERIFYX_STUDENT_EXAM_COMPACT_DESKTOP_V1 */
.vx-cad-question .vx-exam-question-head h2{font-size:24px;}
.vx-cad-instruction{margin:0 0 12px;padding:10px 12px;border:1px dashed #ead6c8;border-radius:12px;background:#fffaf7;color:#5a4438;font-size:15px;font-weight:750;line-height:1.5;text-align:center;}
.vx-cad-preview{width:min(760px,100%);min-height:300px;margin:0 auto 14px;border:1px solid #eee0d8;border-radius:14px;background:#fff;display:grid;place-items:center;overflow:hidden;}
.vx-cad-preview iframe{display:block;width:100%;height:340px;border:0;background:#fff;}
.vx-cad-answer-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;align-items:end;}
.vx-cad-answer-grid label{font-size:12px!important;font-weight:850!important;}
.vx-cad-answer-grid input{min-height:44px;}
.vx-cad-save-btn{width:auto!important;min-width:170px!important;min-height:40px!important;padding:8px 18px!important;margin:10px 0 0 auto!important;display:flex!important;}
.vx-exam-footer{display:flex!important;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;}
.vx-exam-navcluster{display:grid;grid-template-columns:44px minmax(150px,210px) 44px;gap:8px;align-items:center;}
.vx-exam-arrow{width:44px;height:40px;border-radius:11px;}
.vx-exam-summary-btn{min-height:40px!important;font-size:14px!important;padding:8px 13px!important;}
.vx-exam-flag-btn{width:auto!important;min-height:40px;padding:8px 12px!important;margin-left:auto;white-space:nowrap;}

.vx-student-results-list{display:grid!important;grid-template-columns:1fr!important;max-width:1080px;margin-inline:auto;gap:12px!important;}
.vx-student-result-card{padding:16px 18px!important;min-width:0;}
.vx-student-result-card .vx-history-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:20px;}
.vx-student-result-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #efddd2;}

@media(max-width:900px){
 .vx-student-result-details{grid-template-columns:1fr;}
}
@media(max-width:700px){
 .vx-cad-question .vx-exam-question-head h2{font-size:20px;}
 .vx-cad-instruction{font-size:13px;text-align:left;}
 .vx-cad-preview{min-height:220px;}
 .vx-cad-preview iframe{height:250px;}
 .vx-cad-answer-grid{grid-template-columns:1fr!important;gap:8px!important;}
 .vx-cad-save-btn{width:100%!important;margin-top:8px!important;}
 .vx-exam-footer{flex-wrap:wrap;align-items:stretch;}
 .vx-exam-navcluster{width:100%;grid-template-columns:42px 1fr 42px;}
 .vx-exam-arrow{width:42px;height:40px;}
 .vx-exam-flag-btn{width:100%!important;margin-left:0;justify-content:center;}
 .vx-student-result-card .vx-history-head{grid-template-columns:1fr;gap:10px;}
}
'''
    css.write_text(c, encoding='utf-8')

print('VERIFYX_STUDENT_EXAM_RESULTS_LAYOUT_V1_OK')
