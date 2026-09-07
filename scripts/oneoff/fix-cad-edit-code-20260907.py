from pathlib import Path
import re

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')

new_update = r'''async function updateCadQuestion(e,q,f){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const fd=new FormData(e.currentTarget);
  try{
   const codeChoice=String(fd.get('codeChoice')||'').trim();
   const title=String(fd.get('title')||'').trim();
   if(!codeChoice)throw new Error('กรุณาเลือก Code');
   if(!title)throw new Error('กรุณาใส่ชื่อโจทย์');

   const {data:targetFamily,error:familyError}=await vx.from('vx_question_families').select('id,code').eq('code',codeChoice).single();
   if(familyError)throw familyError;
   if(!targetFamily?.id)throw new Error('ไม่พบ Code ที่เลือก');

   const drawing=fd.get('drawing'),image=fd.get('modelImage');
   const drawingPath=drawing?.name?await upload(drawing,'drawing'):q.drawing_path;
   const drawingName=drawing?.name||q.drawing_name;
   const imagePath=image?.name?await upload(image,'model'):q.model_image_path;
   const imageName=image?.name||q.model_image_name;

   const {error:questionError}=await vx.from('vx_question_bank').update({
    family_id:targetFamily.id,title,drawing_path:drawingPath,drawing_name:drawingName,model_image_path:imagePath,model_image_name:imageName,
    show_model_preview:Boolean(imagePath)&&fd.get('preview')==='on',reference_volume:Number(fd.get('volume')).toFixed(3),
    reference_area:Number(fd.get('area')).toFixed(3),reference_mass:Number(fd.get('mass')).toFixed(3),updated_at:new Date().toISOString()
   }).eq('id',q.id);
   if(questionError)throw questionError;

   setEditCadId(null);setMessage('บันทึกการแก้ไขโจทย์ CAD แล้ว');await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }'''

text, count = re.subn(r"async function updateCadQuestion\(e,q,f\)\{.*?\n \}\n\n async function addMcq", new_update + "\n\n async function addMcq", text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'updateCadQuestion replacement count={count}')

old = '''<div className="vx-result"><b>Code {f?.code||'CAD'}</b> · {categoryLabel[f?.category]||f?.category||'Part Modeling'} · {diffLabel[f?.difficulty]||''} · Lot {f?.lot||'General'}<br/><small>Code / Category / ระดับ / Lot เป็นข้อมูลของกลุ่ม จึงไม่เปลี่ยนจากการแก้โจทย์ข้อนี้</small></div><label>ชื่อโจทย์<input name="title" defaultValue={q.title||''} required/></label>'''
new = '''<label>Code<select name="codeChoice" defaultValue={f?.code||''} required>{families.map(group=><option key={group.id} value={group.code}>{group.code}</option>)}</select><small>เปลี่ยน Code = ย้ายโจทย์ข้อนี้ไปอยู่กลุ่ม Code ที่เลือก</small></label><label>ชื่อโจทย์<input name="title" defaultValue={q.title||''} required/></label>'''
if old not in text:
    raise SystemExit('edit Code UI anchor not found')
text = text.replace(old,new,1)

path.write_text(text,encoding='utf-8')
print('patched', path)
