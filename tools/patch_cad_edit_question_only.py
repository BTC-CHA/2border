from pathlib import Path
import re

p = Path('app/verifyx/teacher/question-bank/page.js')
s = p.read_text(encoding='utf-8')

new_update = r'''async function updateCadQuestion(e,q,f){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const fd=new FormData(e.currentTarget);
  try{
   const title=String(fd.get('title')||'').trim();
   if(!title)throw new Error('กรุณาใส่ชื่อโจทย์');

   const drawing=fd.get('drawing'),image=fd.get('modelImage');
   const drawingPath=drawing?.name?await upload(drawing,'drawing'):q.drawing_path;
   const drawingName=drawing?.name||q.drawing_name;
   const imagePath=image?.name?await upload(image,'model'):q.model_image_path;
   const imageName=image?.name||q.model_image_name;

   const {error:questionError}=await vx.from('vx_question_bank').update({
    title,drawing_path:drawingPath,drawing_name:drawingName,model_image_path:imagePath,model_image_name:imageName,
    show_model_preview:Boolean(imagePath)&&fd.get('preview')==='on',reference_volume:Number(fd.get('volume')).toFixed(3),
    reference_area:Number(fd.get('area')).toFixed(3),reference_mass:Number(fd.get('mass')).toFixed(3),updated_at:new Date().toISOString()
   }).eq('id',q.id);
   if(questionError)throw questionError;

   setEditCadId(null);setMessage('บันทึกการแก้ไขโจทย์ CAD แล้ว');await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }'''

s, n = re.subn(r"async function updateCadQuestion\(e,q,f\)\{.*?\n \}\n\n async function addMcq", new_update + "\n\n async function addMcq", s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'update function replacement count={n}')

old_form_pattern = r"\{editCadId===q\.id&&<form className=\"vx-form\" onSubmit=\{e=>updateCadQuestion\(e,q,f\)\}.*?</form>\}"
new_form = r'''{editCadId===q.id&&<form className="vx-form" onSubmit={e=>updateCadQuestion(e,q,f)} style={{marginTop:14,paddingTop:14,borderTop:'1px solid #f0ddd1'}}><p className="vx-kicker">EDIT CAD QUESTION</p><div className="vx-result"><b>Code {f?.code||'CAD'}</b> · {categoryLabel[f?.category]||f?.category||'Part Modeling'} · {diffLabel[f?.difficulty]||''} · Lot {f?.lot||'General'}<br/><small>Code / Category / ระดับ / Lot เป็นข้อมูลของกลุ่ม จึงไม่เปลี่ยนจากการแก้โจทย์ข้อนี้</small></div><label>ชื่อโจทย์<input name="title" defaultValue={q.title||''} required/></label><div className="vx-mass-grid"><label>Volume mm³<input name="volume" type="number" step="0.001" defaultValue={q.reference_volume} required/></label><label>Surface Area mm²<input name="area" type="number" step="0.001" defaultValue={q.reference_area} required/></label><label>Mass g<input name="mass" type="number" step="0.001" defaultValue={q.reference_mass} required/></label></div><label>เปลี่ยน Drawing PDF (ไม่เลือก = ใช้ไฟล์เดิม)<input name="drawing" type="file" accept="application/pdf,.pdf"/></label><label>เปลี่ยน Model Image (ไม่เลือก = ใช้รูปเดิม)<input name="modelImage" type="file" accept="image/png,image/jpeg,image/webp"/></label><label><span><input name="preview" type="checkbox" defaultChecked={Boolean(q.show_model_preview)}/> ให้นักเรียนเห็น Model Image</span></label><div className="vx-toolbar"><button className="vx-btn primary" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึกการแก้ไข'}</button><button type="button" className="vx-btn secondary" onClick={()=>setEditCadId(null)} disabled={saving}>ยกเลิก</button></div></form>}'''

s, n = re.subn(old_form_pattern, new_form, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'edit form replacement count={n}')

p.write_text(s, encoding='utf-8')
