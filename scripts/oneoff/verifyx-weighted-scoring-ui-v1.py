from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT/path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT/path).write_text(text, encoding='utf-8')

def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f'MISSING ANCHOR: {label}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# Teacher Assignments: category point budgets totaling 100 + auto point/item.
# -----------------------------------------------------------------------------
p = Path('app/verifyx/teacher/page.js')
s = read(p)

s = rep(s,
"const cadCategoryLabel=Object.fromEntries(cadCategoryOptions);\n",
"const cadCategoryLabel=Object.fromEntries(cadCategoryOptions);\nconst scoreCategoryOptions=[['part_modeling','Part'],['assembly','ASSY'],['drawing','Drawing'],['mcq','MCQ']];\nfunction autoScorePoints(cadCounts,mcqCount){\n const counts={part_modeling:Math.max(0,Number(cadCounts?.part_modeling)||0),assembly:Math.max(0,Number(cadCounts?.assembly)||0),drawing:Math.max(0,Number(cadCounts?.drawing)||0),mcq:Math.max(0,Number(mcqCount)||0)};\n const active=scoreCategoryOptions.filter(([k])=>counts[k]>0),total=active.reduce((n,[k])=>n+counts[k],0),out={part_modeling:0,assembly:0,drawing:0,mcq:0};\n if(!total)return out;let used=0;active.forEach(([k],i)=>{const v=i===active.length-1?Number((100-used).toFixed(2)):Number((counts[k]*100/total).toFixed(2));out[k]=v;used=Number((used+v).toFixed(2))});return out\n}\nconst pointFmt=v=>Number(v||0).toFixed(2).replace(/\\.00$/,'');\n",
'add scoring helpers')

s = rep(s,
" const [cadCounts,setCadCounts]=useState({part_modeling:3,assembly:0,drawing:0}),[mcqCount,setMcqCount]=useState(0),[cadLot,setCadLot]=useState(''),[mcqCategory,setMcqCategory]=useState(''),[sections,setSections]=useState([]),[selectedSections,setSelectedSections]=useState([]),[assignmentSections,setAssignmentSections]=useState({}),[teacherTeam,setTeacherTeam]=useState([]);\n",
" const [cadCounts,setCadCounts]=useState({part_modeling:3,assembly:0,drawing:0}),[mcqCount,setMcqCount]=useState(0),[cadLot,setCadLot]=useState(''),[mcqCategory,setMcqCategory]=useState(''),[sections,setSections]=useState([]),[selectedSections,setSelectedSections]=useState([]),[assignmentSections,setAssignmentSections]=useState({}),[teacherTeam,setTeacherTeam]=useState([]);\n const [scorePoints,setScorePoints]=useState({part_modeling:100,assembly:0,drawing:0,mcq:0}),[scoreAuto,setScoreAuto]=useState(true);\n",
'add scoring state')

s = rep(s,
" useEffect(()=>{load()},[]);\n",
" useEffect(()=>{load()},[]);\n useEffect(()=>{if(scoreAuto)setScorePoints(autoScorePoints(cadCounts,mcqCount))},[cadCounts,mcqCount,scoreAuto]);\n",
'auto scoring effect')

s = rep(s,
" const draftTotal=cadCount+Number(mcqCount||0);\n function setCadCategoryCount(category,value){setCadCounts(x=>({...x,[category]:Math.max(0,Number(value)||0)}))}\n",
" const draftTotal=cadCount+Number(mcqCount||0);\n const scoreCountMap={part_modeling:Number(cadCounts.part_modeling||0),assembly:Number(cadCounts.assembly||0),drawing:Number(cadCounts.drawing||0),mcq:Number(mcqCount||0)};\n const scoreTotal=scoreCategoryOptions.reduce((n,[k])=>n+Math.max(0,Number(scorePoints[k])||0),0),scoreRemaining=Number((100-scoreTotal).toFixed(2));\n const scoreValid=draftTotal>0&&Math.abs(scoreRemaining)<=0.01&&scoreCategoryOptions.every(([k])=>scoreCountMap[k]>0?Number(scorePoints[k]||0)>0:Number(scorePoints[k]||0)===0);\n function setCadCategoryCount(category,value){setCadCounts(x=>({...x,[category]:Math.max(0,Number(value)||0)}))}\n function setScoreCategory(category,value){setScoreAuto(false);setScorePoints(x=>({...x,[category]:Math.max(0,Number(value)||0)}))}\n function fillScoreRemaining(category){if(scoreRemaining<=0||scoreCountMap[category]<=0)return;setScoreAuto(false);setScorePoints(x=>({...x,[category]:Number(((Number(x[category])||0)+scoreRemaining).toFixed(2))}))}\n",
'scoring calculations')

s = rep(s,
"   const difficulty=String(fd.get('difficulty')||'basic'),normalizedCadCounts=Object.fromEntries(Object.entries(cadCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]).filter(([,v])=>v>0)),cad=Object.values(normalizedCadCounts).reduce((s,n)=>s+n,0),mcq=Number(mcqCount||0),total=cad+mcq,subject=String(fd.get('subject')||'CrownCAD').trim()||'CrownCAD';\n   if(total<1)throw new Error('กรุณากำหนดจำนวนข้ออย่างน้อย 1 ข้อ');if(sections.length>0&&selectedSections.length===0)throw new Error('กรุณาเลือกอย่างน้อย 1 Section ที่จะได้รับ Assignment');\n",
"   const difficulty=String(fd.get('difficulty')||'basic'),normalizedCadCounts=Object.fromEntries(Object.entries(cadCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]).filter(([,v])=>v>0)),cad=Object.values(normalizedCadCounts).reduce((s,n)=>s+n,0),mcq=Number(mcqCount||0),total=cad+mcq,subject=String(fd.get('subject')||'CrownCAD').trim()||'CrownCAD';\n   const scoring=Object.fromEntries(scoreCategoryOptions.map(([k])=>[k,Number((Math.max(0,Number(scorePoints[k])||0)).toFixed(2))]));\n   const scoringTotal=Object.values(scoring).reduce((n,v)=>n+v,0),activeCounts={...normalizedCadCounts,mcq};\n   if(total<1)throw new Error('กรุณากำหนดจำนวนข้ออย่างน้อย 1 ข้อ');\n   if(Math.abs(scoringTotal-100)>0.01)throw new Error(`คะแนนรวมหมวดต้องเท่ากับ 100 ตอนนี้ ${pointFmt(scoringTotal)}/100`);\n   for(const [k] of scoreCategoryOptions){const count=Math.max(0,Number(activeCounts[k])||0),points=Math.max(0,Number(scoring[k])||0);if(count>0&&points<=0)throw new Error(`${scoreCategoryOptions.find(x=>x[0]===k)?.[1]||k} มีโจทย์ แต่ยังไม่ได้จัดสรรคะแนน`);if(count===0&&points>0)throw new Error(`${scoreCategoryOptions.find(x=>x[0]===k)?.[1]||k} ไม่มีโจทย์ จึงต้องเป็น 0 คะแนน`)}\n   if(sections.length>0&&selectedSections.length===0)throw new Error('กรุณาเลือกอย่างน้อย 1 Section ที่จะได้รับ Assignment');\n",
'validate scoring')

s = rep(s,
"cad_category_counts:normalizedCadCounts,mcq_question_count:mcq",
"cad_category_counts:normalizedCadCounts,score_weights:scoring,mcq_question_count:mcq",
'persist scoring')

s = rep(s,
"form.reset();setCadCounts({part_modeling:3,assembly:0,drawing:0});setMcqCount(0);setCadLot('');setMcqCategory('');setSelectedSections([]);setShow(false);",
"form.reset();setCadCounts({part_modeling:3,assembly:0,drawing:0});setMcqCount(0);setScoreAuto(true);setScorePoints({part_modeling:100,assembly:0,drawing:0,mcq:0});setCadLot('');setMcqCategory('');setSelectedSections([]);setShow(false);",
'reset scoring')

score_card = """   <div className=\"vx-card\" style={{padding:14}}><div className=\"vx-top\" style={{alignItems:'center',gap:10}}><div><p className=\"vx-kicker\">SCORING · 100 POINTS</p><b>กำหนดคะแนนรวมของแต่ละหมวด</b><p style={{margin:'4px 0 0',fontSize:12}}>ระบบหารคะแนนต่อข้อให้อัตโนมัติ ไม่ว่าระบบจะสุ่มโจทย์ข้อไหนในหมวดนั้น</p></div><button type=\"button\" className=\"vx-link secondary\" style={{width:'auto'}} onClick={()=>setScoreAuto(true)}>แบ่ง 100 ตามจำนวนข้อ</button></div><div style={{display:'grid',gap:8,marginTop:10}}>{scoreCategoryOptions.map(([k,label])=>{const count=scoreCountMap[k]||0,points=Number(scorePoints[k]||0),per=count>0?points/count:0;return <div key={k} style={{display:'grid',gridTemplateColumns:'minmax(76px,1fr) minmax(92px,1fr) minmax(92px,1fr) auto',gap:8,alignItems:'end'}}><label>{label}<input value={count} readOnly type=\"number\"/></label><label>คะแนนรวมหมวด<input value={points} onChange={e=>setScoreCategory(k,e.target.value)} type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" disabled={count===0}/></label><label>คะแนน / ข้อ<input value={count>0?per.toFixed(2):'0.00'} readOnly/></label><button type=\"button\" className=\"vx-link secondary\" style={{width:'auto',minHeight:42,padding:'8px 10px'}} disabled={count===0||scoreRemaining<=0} onClick={()=>fillScoreRemaining(k)}>เติมที่เหลือ</button></div>})}</div><div className={scoreValid?'vx-success':'vx-error'} style={{marginTop:10}}>{Math.abs(scoreRemaining)<=0.01?`จัดสรรแล้ว ${pointFmt(scoreTotal)}/100 คะแนน`:scoreRemaining>0?`จัดสรรแล้ว ${pointFmt(scoreTotal)}/100 · เหลืออีก ${pointFmt(scoreRemaining)} คะแนน`:`จัดสรรแล้ว ${pointFmt(scoreTotal)}/100 · เกิน ${pointFmt(Math.abs(scoreRemaining))} คะแนน`}</div></div>\n"""
anchor = "   {sections.length>0?<div><p className=\"vx-kicker\">TARGET SECTION</p>"
s = rep(s, anchor, score_card + anchor, 'insert scoring card')

s = rep(s,
"disabled={saving||draftTotal<1||(sections.length>0&&selectedSections.length===0)}",
"disabled={saving||draftTotal<1||!scoreValid||(sections.length>0&&selectedSections.length===0)}",
'disable create until 100')

write(p, s)

# -----------------------------------------------------------------------------
# Teacher Results: weighted overall, category earned/max breakdown, item points.
# -----------------------------------------------------------------------------
p = Path('app/verifyx/teacher/results/page.js')
s = read(p)
s = rep(s, "vx.rpc('vx_teacher_final_results_v3')", "vx.rpc('vx_teacher_final_results_v4')", 'teacher results rpc v4')
s = rep(s,
"for(const [key,rs] of fullGroups){const first=rs[0],overall=avgRows(rs);if(!byAssignment.has(String(first.assignment_id)))byAssignment.set(String(first.assignment_id),[]);byAssignment.get(String(first.assignment_id)).push({key,overall})}",
"for(const [key,rs] of fullGroups){const first=rs[0],overall=Number(first?.assignment_total_score??avgRows(rs));if(!byAssignment.has(String(first.assignment_id)))byAssignment.set(String(first.assignment_id),[]);byAssignment.get(String(first.assignment_id)).push({key,overall})}",
'weighted rank')

old = """   const cad=fullRows.filter(x=>x.question_type==='cad'),mcq=fullRows.filter(x=>x.question_type==='mcq');
   const overall=avgRows(fullRows),passScore=Number(metaMap[String(first.assignment_id)]?.pass_score??60);
   const device=String(first.final_device_id||'').trim();
   return {key,student_id:first.student_id,student_code:first.student_code,student_name:first.student_name,assignment_id:first.assignment_id,assignment_title:first.assignment_title,submitted_at:first.submitted_at,rows:shownRows,fullRows,total:fullRows.length,overall,cad:avgRows(cad),mcq:avgRows(mcq),cadCount:cad.length,mcqCount:mcq.length,passScore,passed:Number(overall||0)>=passScore,rank:rankMap.get(key)||null,duplicateDeviceCount:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.count||0):0,duplicateDeviceLabel:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.label||''):''}
"""
new = """   const cad=fullRows.filter(x=>x.question_type==='cad'),mcq=fullRows.filter(x=>x.question_type==='mcq');
   const earned=xs=>xs.reduce((n,x)=>n+Number(x.item_points||0),0),max=xs=>xs.reduce((n,x)=>n+Number(x.item_max_points||0),0),cadMax=max(cad),mcqMax=max(mcq);
   const overall=Number(first.assignment_total_score??avgRows(fullRows)),passScore=Number(first.pass_score??metaMap[String(first.assignment_id)]?.pass_score??60);
   const categoryBreakdown=[['part_modeling','Part'],['assembly','ASSY'],['drawing','Drawing'],['mcq','MCQ']].map(([code,label])=>{const xs=fullRows.filter(x=>x.score_category===code),mx=max(xs);return {code,label,earned:earned(xs),max:mx}}).filter(x=>x.max>0);
   const device=String(first.final_device_id||'').trim();
   return {key,student_id:first.student_id,student_code:first.student_code,student_name:first.student_name,assignment_id:first.assignment_id,assignment_title:first.assignment_title,submitted_at:first.submitted_at,rows:shownRows,fullRows,total:fullRows.length,overall,cad:cadMax?earned(cad)*100/cadMax:null,mcq:mcqMax?earned(mcq)*100/mcqMax:null,cadCount:cad.length,mcqCount:mcq.length,categoryBreakdown,passScore,passed:Number(overall||0)>=passScore,rank:rankMap.get(key)||null,duplicateDeviceCount:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.count||0):0,duplicateDeviceLabel:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.label||''):''}
"""
s = rep(s, old, new, 'weighted candidate groups')

s = rep(s,
" const scoreText=v=>v==null?'—':`${Number(v).toFixed(0)}/100`;\n",
" const scoreText=v=>v==null?'—':`${Number(v).toFixed(0)}/100`;\n const pointText=(earned,max)=>`${Number(earned||0).toFixed(Number(earned||0)%1?2:0)}/${Number(max||0).toFixed(Number(max||0)%1?2:0)}`;\n",
'point text helper')

s = rep(s,
"<div className=\"vx-tags\">{g.cadCount>0&&<span>CAD {scoreText(g.cad)}</span>}{g.mcqCount>0&&<span>ปรนัย {scoreText(g.mcq)}</span>}<span>Final {g.submitted_at?new Date(g.submitted_at).toLocaleString('th-TH'):'—'}</span></div>",
"<div className=\"vx-tags\">{g.categoryBreakdown.map(x=><span key={x.code}>{x.label} {pointText(x.earned,x.max)}</span>)}<span>Final {g.submitted_at?new Date(g.submitted_at).toLocaleString('th-TH'):'—'}</span></div>",
'category breakdown tags')

# Per-item list score and detail modal score.
s = s.replace("{scoreText(r.score)}</strong>", "{pointText(r.item_points,r.item_max_points)}</strong>")
s = s.replace("{scoreText(selected.score)}", "{pointText(selected.item_points,selected.item_max_points)}")

s = rep(s,
"const h=['student_code','student_name','assignment','difficulty','question_number','question_type','question_title','score','selected_choice'",
"const h=['student_code','student_name','assignment','difficulty','question_number','question_type','question_title','score_percent','score_category','item_points','item_max_points','assignment_total_score','selected_choice'",
'csv headers')
s = rep(s,
"r.question_number,r.question_type,r.question_title,r.score,r.selected_choice_key",
"r.question_number,r.question_type,r.question_title,r.score,r.score_category,r.item_points,r.item_max_points,r.assignment_total_score,r.selected_choice_key",
'csv values')
write(p, s)

# -----------------------------------------------------------------------------
# Student Results: use closed-history v6 and weighted points.
# -----------------------------------------------------------------------------
p = Path('app/verifyx/student/results/page.js')
s = read(p)
s = rep(s,
"const scoreOf=items=>items.length?items.reduce((n,x)=>n+Number(x.score||0),0)/items.length:0;",
"const scoreOf=items=>items.length?Number(items[0]?.assignment_total_score??items.reduce((n,x)=>n+Number(x.item_points||0),0)):0;\nconst pointText=(earned,max)=>`${Number(earned||0).toFixed(Number(earned||0)%1?2:0)}/${Number(max||0).toFixed(Number(max||0)%1?2:0)}`;\nconst categorySummary=items=>[['part_modeling','Part'],['assembly','ASSY'],['drawing','Drawing'],['mcq','MCQ']].map(([code,label])=>{const xs=items.filter(x=>x.score_category===code),max=xs.reduce((n,x)=>n+Number(x.item_max_points||0),0),earned=xs.reduce((n,x)=>n+Number(x.item_points||0),0);return {code,label,max,earned}}).filter(x=>x.max>0);",
'student weighted helpers')
s = rep(s, "vx.rpc('vx_student_final_history_v5_auth')", "vx.rpc('vx_student_final_history_v6_auth')", 'student history v6')
s = rep(s,
"<div className=\"vx-tags\"><span>{g.items.length} ข้อ</span><span>ครูปิดรับงานแล้ว</span><span style={{color:statusColor,fontWeight:800}}>{passed?'ผ่าน':'ไม่ผ่าน'}</span></div>",
"<div className=\"vx-tags\"><span>{g.items.length} ข้อ</span>{categorySummary(g.items).map(x=><span key={x.code}>{x.label} {pointText(x.earned,x.max)}</span>)}<span>ครูปิดรับงานแล้ว</span><span style={{color:statusColor,fontWeight:800}}>{passed?'ผ่าน':'ไม่ผ่าน'}</span></div>",
'student category summary')
s = rep(s,
"{Math.round(Number(item.score||0))}/100</strong>",
"{pointText(item.item_points,item.item_max_points)}</strong>",
'student item points')
write(p, s)

# -----------------------------------------------------------------------------
# Student Assignment summary after Final: same closed details use v6 + item pts.
# -----------------------------------------------------------------------------
p = Path('app/verifyx/student/assignment/[id]/page.js')
s = read(p)
s = rep(s, "vx.rpc('vx_student_final_history_v5_auth')", "vx.rpc('vx_student_final_history_v6_auth')", 'assignment history v6')
# The final-detail card mirrors Student Results; update if present.
if "{Math.round(Number(r.score||0))}/100</strong>" in s:
    s = s.replace("{Math.round(Number(r.score||0))}/100</strong>", "{Number(r.item_points||0).toFixed(Number(r.item_points||0)%1?2:0)}/{Number(r.item_max_points||0).toFixed(Number(r.item_max_points||0)%1?2:0)}</strong>", 1)
else:
    print('NOTE: final detail score anchor not present; RPC still upgraded')
write(p, s)

print('VERIFYX_WEIGHTED_SCORING_UI_V1_OK')
