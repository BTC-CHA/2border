from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# 1) Student Final: attach stable browser device id + user agent
student_path = Path("app/verifyx/student/assignment/[id]/page.js")
student = student_path.read_text(encoding="utf-8")

student = replace_once(
    student,
    "const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};\n",
    "const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};\nconst VX_DEVICE_KEY='verifyx_device_id_v1';\nfunction getVerifyXDeviceId(){\n try{\n  let id=localStorage.getItem(VX_DEVICE_KEY);\n  if(!id){id=`VX-${crypto.randomUUID()}`;localStorage.setItem(VX_DEVICE_KEY,id)}\n  return id;\n }catch{return `VX-${crypto.randomUUID()}`}\n}\n",
    "student device helper",
)

student = replace_once(
    student,
    "  setFinalizing(true);setError('');const {data,error}=await vx.rpc('vx_student_finalize_assignment_v3_auth',{p_assignment_id:assignmentId});setFinalizing(false);",
    "  setFinalizing(true);setError('');const deviceId=getVerifyXDeviceId();const {data,error}=await vx.rpc('vx_student_finalize_assignment_v4_auth',{p_assignment_id:assignmentId,p_device_id:deviceId,p_user_agent:navigator.userAgent||''});setFinalizing(false);",
    "student final rpc",
)
student_path.write_text(student, encoding="utf-8")

# 2) Teacher Question Bank: enable editing School Bank MCQs
bank_path = Path("app/verifyx/teacher/question-bank/page.js")
bank = bank_path.read_text(encoding="utf-8")

bank = replace_once(
    bank,
    " const [teacherCode,setTeacherCode]=useState(''),[editCadId,setEditCadId]=useState(null),[cadCodeChoice,setCadCodeChoice]=useState('');",
    " const [teacherCode,setTeacherCode]=useState(''),[editCadId,setEditCadId]=useState(null),[editMcqId,setEditMcqId]=useState(null),[cadCodeChoice,setCadCodeChoice]=useState('');",
    "mcq edit state",
)

old_add = " async function addMcq(e){e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');const form=e.currentTarget,fd=new FormData(form);try{const choices=['A','B','C','D'].map(k=>String(fd.get(`choice${k}`)||'').trim());const {error}=await vx.rpc('vx_teacher_create_mcq_question',{p_subject:String(fd.get('subject')||'SolidWorks').trim()||'SolidWorks',p_category_code:String(fd.get('categoryCode')||'').trim(),p_category_name:String(fd.get('categoryName')||'').trim(),p_difficulty:String(fd.get('difficulty')||'basic'),p_stem:String(fd.get('stem')||'').trim(),p_choices:choices,p_correct_key:String(fd.get('correct')||'A'),p_explanation:String(fd.get('explanation')||'').trim(),p_status:String(fd.get('status')||'active')});if(error)throw error;form.reset();setShowMcq(false);setMessage('เพิ่มข้อสอบปรนัยใน School Bank แล้ว');await load()}catch(err){setError(err.message)}finally{setSaving(false)}}\n"
new_add = old_add + " async function updateMcq(e,q){e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');const fd=new FormData(e.currentTarget);try{const choices=['A','B','C','D'].map(k=>String(fd.get(`choice${k}`)||'').trim());const {error}=await vx.rpc('vx_teacher_update_mcq_question',{p_question_id:q.id,p_subject:String(fd.get('subject')||'').trim(),p_category_code:String(fd.get('categoryCode')||'').trim(),p_category_name:String(fd.get('categoryName')||'').trim(),p_difficulty:String(fd.get('difficulty')||'basic'),p_stem:String(fd.get('stem')||'').trim(),p_choices:choices,p_correct_key:String(fd.get('correct')||'A'),p_explanation:String(fd.get('explanation')||'').trim(),p_status:String(fd.get('status')||'active')});if(error)throw error;setEditMcqId(null);setMessage('บันทึกการแก้ไขข้อสอบปรนัยแล้ว');await load()}catch(err){setError(err.message)}finally{setSaving(false)}}\n"
bank = replace_once(bank, old_add, new_add, "mcq update function")

old_toolbar = "<div className=\"vx-toolbar\" style={{marginTop:10}}><button className=\"vx-file\" style={{width:'100%',background:q.status==='active'?'#eaf8ef':'#fff0ef',borderColor:q.status==='active'?'#bfe8cb':'#f2b9b4',color:q.status==='active'?'#2e7d4f':'#b6463a',fontWeight:700}} onClick={()=>toggleMcq(q)}><Power size={14}/>{q.status==='active'?'ปิดใช้':'เปิดใช้'}</button></div>"
new_toolbar = "<div className=\"vx-toolbar\" style={{marginTop:10,display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}><button className=\"vx-file\" style={{width:'100%'}} onClick={()=>setEditMcqId(editMcqId===q.id?null:q.id)}><Pencil size={14}/>{editMcqId===q.id?'ยกเลิกแก้ไข':'แก้ไข'}</button><button className=\"vx-file\" style={{width:'100%',background:q.status==='active'?'#eaf8ef':'#fff0ef',borderColor:q.status==='active'?'#bfe8cb':'#f2b9b4',color:q.status==='active'?'#2e7d4f':'#b6463a',fontWeight:700}} onClick={()=>toggleMcq(q)}><Power size={14}/>{q.status==='active'?'ปิดใช้':'เปิดใช้'}</button></div>{editMcqId===q.id&&<form className=\"vx-form\" onSubmit={e=>updateMcq(e,q)} style={{marginTop:14,paddingTop:14,borderTop:'1px solid #f0ddd1'}}><p className=\"vx-kicker\">EDIT MCQ</p><div className=\"vx-form-row\"><label>Subject<input name=\"subject\" defaultValue={q.subject||''} required/></label><label>Difficulty<select name=\"difficulty\" defaultValue={q.difficulty||'basic'}><option value=\"basic\">Basic</option><option value=\"pro\">Pro</option><option value=\"advanced\">Advanced</option></select></label></div><div className=\"vx-form-row\"><label>Category Code<input name=\"categoryCode\" defaultValue={q.category_code||''}/></label><label>Category Name<input name=\"categoryName\" defaultValue={q.category_name||''}/></label></div><label>คำถาม<textarea name=\"stem\" rows=\"3\" defaultValue={q.stem||''} required/></label>{['A','B','C','D'].map(k=><label key={k}>ตัวเลือก {thaiKey[k]} ({k})<input name={`choice${k}`} defaultValue={(q.choices||[]).find(c=>c.key===k)?.text||''} required/></label>)}<div className=\"vx-form-row\"><label>เฉลย<select name=\"correct\" defaultValue={(q.choices||[]).find(c=>c.is_correct)?.key||'A'}><option value=\"A\">ก (A)</option><option value=\"B\">ข (B)</option><option value=\"C\">ค (C)</option><option value=\"D\">ง (D)</option></select></label><label>สถานะ<select name=\"status\" defaultValue={q.status||'active'}><option value=\"active\">พร้อมใช้</option><option value=\"draft\">Draft</option><option value=\"archived\">ปิดใช้</option></select></label></div><label>คำอธิบายเฉลย<textarea name=\"explanation\" rows=\"2\" defaultValue={q.explanation||''}/></label><div className=\"vx-toolbar\"><button className=\"vx-btn primary\" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึกการแก้ไข'}</button><button type=\"button\" className=\"vx-btn secondary\" disabled={saving} onClick={()=>setEditMcqId(null)}>ยกเลิก</button></div></form>}"
bank = replace_once(bank, old_toolbar, new_toolbar, "mcq edit toolbar/form")

bank_path.write_text(bank, encoding="utf-8")
print("VerifyX patch applied")
