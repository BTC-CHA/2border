from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return out

# ---------------- Teacher Assignment ----------------
teacher_path = Path("app/verifyx/teacher/page.js")
teacher = teacher_path.read_text(encoding="utf-8")

teacher = replace_once(
    teacher,
    " const [cadCount,setCadCount]=useState(3),[mcqCount,setMcqCount]=useState(0),[cadCategory,setCadCategory]=useState('part_modeling'),[cadLot,setCadLot]=useState(''),[mcqCategory,setMcqCategory]=useState(''),[sections,setSections]=useState([]),[selectedSections,setSelectedSections]=useState([]),[assignmentSections,setAssignmentSections]=useState({}),[teacherTeam,setTeacherTeam]=useState([]);",
    " const [cadCounts,setCadCounts]=useState({part_modeling:3,assembly:0,drawing:0}),[mcqCount,setMcqCount]=useState(0),[cadLot,setCadLot]=useState(''),[mcqCategory,setMcqCategory]=useState(''),[sections,setSections]=useState([]),[selectedSections,setSelectedSections]=useState([]),[assignmentSections,setAssignmentSections]=useState({}),[teacherTeam,setTeacherTeam]=useState([]);",
    "teacher cad state",
)

teacher = replace_once(
    teacher,
    " const teacherMap=useMemo(()=>Object.fromEntries(teacherTeam.map(t=>[t.user_id,t.display_name])),[teacherTeam]);\n const draftTotal=Number(cadCount||0)+Number(mcqCount||0);\n async function getPoolInfo({difficulty,subject='SolidWorks',mcqCategory='',cadCategory='part_modeling',cadLot=''}){const {data,error}=await vx.rpc('vx_teacher_assignment_pool_info_v3',{p_difficulty:difficulty,p_subject:subject,p_mcq_category_code:mcqCategory||'',p_cad_category:cadCategory||'',p_cad_lot:cadLot||''});if(error)throw error;const x=data?.[0]||{};return {cad:Number(x.cad_family_count||0),variants:Number(x.cad_variant_count||0),mcq:Number(x.mcq_question_count||0)}}\n async function ensurePool(x){const pool=await getPoolInfo(x);if(Number(x.cadCount||0)>pool.cad)throw new Error(`CAD Bank ตามตัวกรองนี้มี Family พร้อมใช้ ${pool.cad} Family แต่ต้องการ ${x.cadCount} ข้อ`);if(Number(x.mcqCount||0)>pool.mcq)throw new Error(`MCQ Bank ตามตัวกรองนี้มี ${pool.mcq} ข้อ แต่ต้องการ ${x.mcqCount} ข้อ`);return pool}",
    " const teacherMap=useMemo(()=>Object.fromEntries(teacherTeam.map(t=>[t.user_id,t.display_name])),[teacherTeam]);\n const cadCount=Object.values(cadCounts).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);\n const draftTotal=cadCount+Number(mcqCount||0);\n function setCadCategoryCount(category,value){setCadCounts(x=>({...x,[category]:Math.max(0,Number(value)||0)}))}\n function assignmentCadCounts(a){const raw=a?.cad_category_counts&&typeof a.cad_category_counts==='object'?a.cad_category_counts:{};const clean=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Math.max(0,Number(v)||0)]).filter(([,v])=>v>0));if(Object.keys(clean).length)return clean;const n=Math.max(0,Number(a?.cad_question_count)||0);return n?{[a?.cad_category||'part_modeling']:n}:{}}\n async function getPoolInfo({difficulty,subject='CrownCAD',mcqCategory='',cadCategory='part_modeling',cadLot=''}){const {data,error}=await vx.rpc('vx_teacher_assignment_pool_info_v3',{p_difficulty:difficulty,p_subject:subject,p_mcq_category_code:mcqCategory||'',p_cad_category:cadCategory||'',p_cad_lot:cadLot||''});if(error)throw error;const x=data?.[0]||{};return {cad:Number(x.cad_family_count||0),variants:Number(x.cad_variant_count||0),mcq:Number(x.mcq_question_count||0)}}\n async function ensurePool(x){for(const [category,rawCount] of Object.entries(x.cadCounts||{})){const need=Math.max(0,Number(rawCount)||0);if(!need)continue;const pool=await getPoolInfo({...x,cadCategory:category});if(need>pool.cad)throw new Error(`CAD Bank ${cadCategoryLabel[category]||category} มีโจทย์พร้อมใช้ ${pool.cad} ข้อ แต่ต้องการ ${need} ข้อ`)}if(Number(x.mcqCount||0)>0){const pool=await getPoolInfo({...x,cadCategory:'part_modeling'});if(Number(x.mcqCount||0)>pool.mcq)throw new Error(`MCQ Bank ตามตัวกรองนี้มี ${pool.mcq} ข้อ แต่ต้องการ ${x.mcqCount} ข้อ`)}return true}",
    "teacher pool helpers",
)

teacher = replace_once(
    teacher,
    "   const difficulty=String(fd.get('difficulty')||'basic'),cad=Number(cadCount||0),mcq=Number(mcqCount||0),total=cad+mcq,subject=String(fd.get('subject')||'SolidWorks').trim()||'SolidWorks';\n   if(total<1)throw new Error('กรุณากำหนดจำนวนข้ออย่างน้อย 1 ข้อ');if(sections.length>0&&selectedSections.length===0)throw new Error('กรุณาเลือกอย่างน้อย 1 Section ที่จะได้รับ Assignment');\n   await ensurePool({difficulty,cadCount:cad,mcqCount:mcq,subject,mcqCategory,cadCategory,cadLot});const type=deriveType(cad,mcq);\n   const {data:created,error}=await vx.from('vx_assignments').insert({title:String(fd.get('title')||'').trim(),course:String(fd.get('course')||'').trim(),description:String(fd.get('description')||'').trim(),status:fd.get('status')||'draft',max_attempts:1,question_category:type==='mcq'?'mcq':cadCategory||'part_modeling',difficulty,question_count:total,randomize_questions:fd.get('randomize')==='on',assignment_type:type,cad_question_count:cad,mcq_question_count:mcq,mcq_subject:subject,mcq_category_code:mcqCategory.trim(),cad_category:cadCategory,cad_lot:cadLot.trim()}).select('id').single();if(error)throw error;",
    "   const difficulty=String(fd.get('difficulty')||'basic'),normalizedCadCounts=Object.fromEntries(Object.entries(cadCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]).filter(([,v])=>v>0)),cad=Object.values(normalizedCadCounts).reduce((s,n)=>s+n,0),mcq=Number(mcqCount||0),total=cad+mcq,subject=String(fd.get('subject')||'CrownCAD').trim()||'CrownCAD';\n   if(total<1)throw new Error('กรุณากำหนดจำนวนข้ออย่างน้อย 1 ข้อ');if(sections.length>0&&selectedSections.length===0)throw new Error('กรุณาเลือกอย่างน้อย 1 Section ที่จะได้รับ Assignment');\n   await ensurePool({difficulty,cadCounts:normalizedCadCounts,mcqCount:mcq,subject,mcqCategory,cadLot});const type=deriveType(cad,mcq),cadCats=Object.keys(normalizedCadCounts),primaryCadCategory=cadCats.length===1?cadCats[0]:'';\n   const {data:created,error}=await vx.from('vx_assignments').insert({title:String(fd.get('title')||'').trim(),course:String(fd.get('course')||'').trim(),description:String(fd.get('description')||'').trim(),status:fd.get('status')||'draft',max_attempts:1,question_category:type==='mcq'?'mcq':primaryCadCategory||'mixed_cad',difficulty,question_count:total,randomize_questions:fd.get('randomize')==='on',assignment_type:type,cad_question_count:cad,cad_category_counts:normalizedCadCounts,mcq_question_count:mcq,mcq_subject:subject,mcq_category_code:mcqCategory.trim(),cad_category:primaryCadCategory,cad_lot:cadLot.trim()}).select('id').single();if(error)throw error;",
    "teacher create logic",
)

teacher = replace_once(
    teacher,
    "   form.reset();setCadCount(3);setMcqCount(0);setCadCategory('part_modeling');setCadLot('');setMcqCategory('');setSelectedSections([]);setShow(false);setMessage(`สร้าง Assignment ${typeLabel[type]||type} รวม ${total} ข้อเรียบร้อยแล้ว`);await load();window.scrollTo({top:0,behavior:'smooth'})",
    "   form.reset();setCadCounts({part_modeling:3,assembly:0,drawing:0});setMcqCount(0);setCadLot('');setMcqCategory('');setSelectedSections([]);setShow(false);setMessage(`สร้าง Assignment ${typeLabel[type]||type} รวม ${total} ข้อเรียบร้อยแล้ว`);await load();window.scrollTo({top:0,behavior:'smooth'})",
    "teacher reset",
)

teacher = replace_once(
    teacher,
    " async function setStatus(a,status){setBusyId(a.id);setError('');setMessage('');try{if(status==='open')await ensurePool({difficulty:a.difficulty||'basic',cadCount:Number(a.cad_question_count||0),mcqCount:Number(a.mcq_question_count||0),subject:a.mcq_subject||'SolidWorks',mcqCategory:a.mcq_category_code||'',cadCategory:a.cad_category||'part_modeling',cadLot:a.cad_lot||''});const {error}=await vx.from('vx_assignments').update({status,updated_at:new Date().toISOString()}).eq('id',a.id);if(error)throw error;setMessage(`เปลี่ยน “${a.title}” เป็น ${statusLabel[status]} แล้ว`);await load()}catch(err){setError(err.message)}finally{setBusyId(null)}}",
    " async function setStatus(a,status){setBusyId(a.id);setError('');setMessage('');try{if(status==='open')await ensurePool({difficulty:a.difficulty||'basic',cadCounts:assignmentCadCounts(a),mcqCount:Number(a.mcq_question_count||0),subject:a.mcq_subject||'CrownCAD',mcqCategory:a.mcq_category_code||'',cadLot:a.cad_lot||''});const {error}=await vx.from('vx_assignments').update({status,updated_at:new Date().toISOString()}).eq('id',a.id);if(error)throw error;setMessage(`เปลี่ยน “${a.title}” เป็น ${statusLabel[status]} แล้ว`);await load()}catch(err){setError(err.message)}finally{setBusyId(null)}}",
    "teacher open validation",
)

teacher = replace_once(
    teacher,
    "<label>Subject สำหรับปรนัย<input name=\"subject\" defaultValue=\"SolidWorks\"/></label>",
    "<label>Subject สำหรับปรนัย<input name=\"subject\" defaultValue=\"CrownCAD\"/></label>",
    "teacher subject default",
)

teacher = replace_once(
    teacher,
    "   <div className=\"vx-form-row\"><label>CAD / Mass Properties<input value={cadCount} onChange={e=>setCadCount(Math.max(0,Number(e.target.value)||0))} type=\"number\" min=\"0\"/></label><label>ปรนัย Multiple Choice<input value={mcqCount} onChange={e=>setMcqCount(Math.max(0,Number(e.target.value)||0))} type=\"number\" min=\"0\"/></label></div>\n   <div className=\"vx-card\" style={{padding:14}}><p className=\"vx-kicker\">QUESTION SOURCE</p><div className=\"vx-form-row\"><label>CAD Category<select value={cadCategory} onChange={e=>setCadCategory(e.target.value)}>{cadCategoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>CAD Lot<input value={cadLot} onChange={e=>setCadLot(e.target.value)} placeholder=\"ว่าง = ทุก Lot\"/></label></div><label>MCQ Category Code<input value={mcqCategory} onChange={e=>setMcqCategory(e.target.value.toUpperCase())} placeholder=\"ว่าง = ทุก Category\"/></label><div className=\"vx-tags\"><span>CAD {cadCount}</span><span>ปรนัย {mcqCount}</span><span><b>รวม {draftTotal} ข้อ</b></span></div></div>",
    "   <div className=\"vx-form-row\"><label>CAD / Mass Properties<input value={cadCount} readOnly type=\"number\" min=\"0\"/></label><label>ปรนัย Multiple Choice<input value={mcqCount} onChange={e=>setMcqCount(Math.max(0,Number(e.target.value)||0))} type=\"number\" min=\"0\"/></label></div>\n   <div className=\"vx-card\" style={{padding:14}}><p className=\"vx-kicker\">QUESTION SOURCE · CAD MIX</p><div className=\"vx-form-row\"><label>Part Modeling<input value={cadCounts.part_modeling||0} onChange={e=>setCadCategoryCount('part_modeling',e.target.value)} type=\"number\" min=\"0\"/></label><label>Assembly<input value={cadCounts.assembly||0} onChange={e=>setCadCategoryCount('assembly',e.target.value)} type=\"number\" min=\"0\"/></label></div><div className=\"vx-form-row\"><label>Drawing<input value={cadCounts.drawing||0} onChange={e=>setCadCategoryCount('drawing',e.target.value)} type=\"number\" min=\"0\"/></label><label>CAD Lot<input value={cadLot} onChange={e=>setCadLot(e.target.value)} placeholder=\"ว่าง = ทุก Lot\"/></label></div><label>MCQ Category Code<input value={mcqCategory} onChange={e=>setMcqCategory(e.target.value.toUpperCase())} placeholder=\"ว่าง = ทุก Category\"/></label><div className=\"vx-tags\"><span>Part {cadCounts.part_modeling||0}</span><span>ASSY {cadCounts.assembly||0}</span><span>Drawing {cadCounts.drawing||0}</span><span>CAD {cadCount}</span><span>ปรนัย {mcqCount}</span><span><b>รวม {draftTotal} ข้อ</b></span></div></div>",
    "teacher cad mix form",
)

teacher = replace_once(
    teacher,
    "<span>สุ่ม Family/Variant/ข้อปรนัย และสลับตัวเลือกปรนัย</span>",
    "<span>สุ่มโจทย์ CAD/ข้อปรนัย และสลับตัวเลือกปรนัย</span>",
    "teacher randomize wording",
)

teacher = replace_once(
    teacher,
    "<span>CAD {a.cad_question_count}</span><span>{cadCategoryLabel[a.cad_category]||a.cad_category||'ทุก CAD Category'}</span>",
    "<span>CAD {a.cad_question_count}</span><span>{Object.entries(assignmentCadCounts(a)).map(([k,v])=>`${cadCategoryLabel[k]||k} ${v}`).join(' · ')||'ทุก CAD Category'}</span>",
    "teacher assignment cad summary",
)

teacher_path.write_text(teacher, encoding="utf-8")

# ---------------- Student Assignment ----------------
student_path = Path("app/verifyx/student/assignment/[id]/page.js")
student = student_path.read_text(encoding="utf-8")

student = replace_once(
    student,
    "const blankCad={volume:'',surface_area:'',mass:'',com_x:'',com_y:'',com_z:'',saved:false,dirty:false};",
    "const blankCad={volume:'',surface_area:'',mass:'',saved:false,dirty:false};",
    "student blank cad",
)

student = replace_once(
    student,
    " const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({});",
    " const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({}),[finalSummary,setFinalSummary]=useState(null);",
    "student final summary state",
)

student = replace_once(
    student,
    ":[x.item_id,{volume:x.volume??'',surface_area:x.surface_area??'',mass:x.mass??'',com_x:x.com_x??'',com_y:x.com_y??'',com_z:x.com_z??'',saved:[x.volume,x.surface_area,x.mass,x.com_x,x.com_y,x.com_z].every(v=>v!==null&&v!==undefined),dirty:false}]",
    ":[x.item_id,{volume:x.volume??'',surface_area:x.surface_area??'',mass:x.mass??'',saved:[x.volume,x.surface_area,x.mass].every(v=>v!==null&&v!==undefined),dirty:false}]",
    "student loaded cad answers",
)

student = replace_once(
    student,
    "  ));\n  setLoading(false)\n }",
    "  ));\n  if(xs[0]?.progress_status==='final'){const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null)}else setFinalSummary(null);\n  setLoading(false)\n }",
    "student load final summary",
)

student = replace_once(
    student,
    "  if(savingId)return;const a=answers[item.item_id]||{};const vals=[a.volume,a.surface_area,a.mass,a.com_x,a.com_y,a.com_z];",
    "  if(savingId)return;const a=answers[item.item_id]||{};const vals=[a.volume,a.surface_area,a.mass];",
    "student cad validation",
)

student = replace_once(
    student,
    "  const {error}=await vx.rpc('vx_student_save_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_volume:Number(a.volume).toFixed(3),p_surface_area:Number(a.surface_area).toFixed(3),p_mass:Number(a.mass).toFixed(3),p_com_x:Number(a.com_x).toFixed(3),p_com_y:Number(a.com_y).toFixed(3),p_com_z:Number(a.com_z).toFixed(3),p_is_flagged:item.is_flagged});",
    "  const {error}=await vx.rpc('vx_student_save_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_volume:Number(a.volume).toFixed(3),p_surface_area:Number(a.surface_area).toFixed(3),p_mass:Number(a.mass).toFixed(3),p_com_x:null,p_com_y:null,p_com_z:null,p_is_flagged:item.is_flagged});",
    "student cad save rpc",
)

student = replace_once(
    student,
    "  const result=data||[];setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')",
    "  const result=data||[];const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null);setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')",
    "student final summary fetch",
)

student = replace_once(
    student,
    "<div className=\"vx-mass-grid\"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>COM X<input value={a.com_x??''} onChange={e=>changeCad(current.item_id,'com_x',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>COM Y<input value={a.com_y??''} onChange={e=>changeCad(current.item_id,'com_y',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>COM Z<input value={a.com_z??''} onChange={e=>changeCad(current.item_id,'com_z',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label></div>",
    "<div className=\"vx-mass-grid\"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type=\"number\" step=\"0.001\" disabled={status==='final'}/></label></div>",
    "student remove COM inputs",
)

student = replace_once(
    student,
    "<p><b>คะแนนจะเปิดให้นักเรียนเห็นหลังครูปิดรับงานเท่านั้น</b></p>",
    "{finalSummary?<div className=\"vx-overview-strip\" style={{margin:'16px 0'}}><div><small>คะแนนรวม</small><strong>{Number(finalSummary.total_score||0).toFixed(2)}</strong></div><div><small>เกณฑ์ผ่าน</small><strong>{Number(finalSummary.pass_score||60).toFixed(0)}</strong></div><div><small>ผล</small><strong>{finalSummary.passed?'ผ่าน':'ไม่ผ่าน'}</strong></div></div>:<p>กำลังสรุปคะแนน...</p>}<p><b>เฉลยและรายละเอียดรายข้อจะเปิดหลังครูปิดรับงาน</b></p>",
    "student final summary UI",
)

student_path.write_text(student, encoding="utf-8")
print("VerifyX CAD mix + final score frontend patch applied")
