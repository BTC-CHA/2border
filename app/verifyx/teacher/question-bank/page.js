'use client';

import {useEffect,useMemo,useState} from 'react';
import {Plus,FileText,Image as ImageIcon,Power,Download,RefreshCw,Pencil,Trash2} from 'lucide-react';
import {vx,VX_BUCKET} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};
const categoryLabel={part_modeling:'Part Modeling',assembly:'Assembly',drawing:'Drawing',sheet_metal:'Sheet Metal',surface:'Surface',other:'Other'};
const categoryOptions=[['part_modeling','Part Modeling'],['assembly','Assembly'],['drawing','Drawing'],['sheet_metal','Sheet Metal'],['surface','Surface'],['other','Other']];

function CadModelPreview({path,title,onOpen}){
 const [url,setUrl]=useState('');
 useEffect(()=>{let alive=true;setUrl('');if(!path)return()=>{alive=false};(async()=>{const {data}=await vx.storage.from(VX_BUCKET).createSignedUrl(path,3600);if(alive&&data?.signedUrl)setUrl(data.signedUrl)})();return()=>{alive=false}},[path]);
 if(!path)return null;
 return <button type="button" onClick={onOpen} title="เปิด Model Image" style={{width:100,height:80,flex:'0 0 100px',padding:0,border:'1px solid #f0ddd1',borderRadius:12,background:'#fff7f1',overflow:'hidden',display:'grid',placeItems:'center',cursor:'pointer'}}>{url?<img src={url} alt={title||'Model preview'} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>:<ImageIcon size={22}/>}</button>
}

export default function QuestionBankPage(){
 const [families,setFamilies]=useState([]),[items,setItems]=useState([]),[schoolMcq,setSchoolMcq]=useState([]),[systemMcq,setSystemMcq]=useState([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[saving,setSaving]=useState(false);
 const [mode,setMode]=useState('cad'),[mcqTab,setMcqTab]=useState('school'),[filter,setFilter]=useState('all'),[search,setSearch]=useState('');
 const [cadCategory,setCadCategory]=useState('all'),[cadLot,setCadLot]=useState('all');
 const [showCadQuestion,setShowCadQuestion]=useState(false),[showMcq,setShowMcq]=useState(false),[selectedSystem,setSelectedSystem]=useState([]);
 const [teacherCode,setTeacherCode]=useState(''),[editCadId,setEditCadId]=useState(null),[cadCodeChoice,setCadCodeChoice]=useState('');
 const [showCodeManager,setShowCodeManager]=useState(false),[cadAutoTitle,setCadAutoTitle]=useState('');

 async function load(){
  setLoading(true);setError('');
  const [{data:f,error:fe},{data:q,error:qe},{data:m,error:me},{data:s,error:se}]=await Promise.all([
   vx.from('vx_question_families').select('*').order('difficulty').order('category').order('lot').order('code'),
   vx.from('vx_question_bank').select('*').order('id'),
   vx.rpc('vx_teacher_school_mcq_list'),
   vx.rpc('vx_teacher_system_mcq_list')
  ]);
  const err=fe||qe||me||se;if(err)setError(err.message);
  setFamilies(f||[]);setItems(q||[]);setSchoolMcq(m||[]);setSystemMcq(s||[]);setLoading(false)
 }
 async function loadTeacherCode(){
  const [{data:u,error:ue},{data:t,error:te}]=await Promise.all([vx.auth.getUser(),vx.rpc('vx_teacher_team')]);
  const err=ue||te;if(err)return setError(err.message);
  const uid=u?.user?.id,me=(t||[]).find(x=>x.user_id===uid);
  const code=String(me?.display_name||u?.user?.user_metadata?.display_name||'').trim();
  setTeacherCode(code);
 }
 useEffect(()=>{load();loadTeacherCode()},[]);

 const familyMap=useMemo(()=>Object.fromEntries(families.map(f=>[f.id,f])),[families]);
 const cadCategories=useMemo(()=>Array.from(new Set(families.map(f=>f.category).filter(Boolean))).sort(),[families]);
 const cadLots=useMemo(()=>Array.from(new Set(families.filter(f=>cadCategory==='all'||f.category===cadCategory).map(f=>f.lot||'General').filter(Boolean))).sort(),[families,cadCategory]);
 const shownCad=useMemo(()=>{const q=search.toLowerCase().trim();return items.filter(x=>{const f=familyMap[x.family_id];return (filter==='all'||f?.difficulty===filter)&&(cadCategory==='all'||f?.category===cadCategory)&&(cadLot==='all'||(f?.lot||'General')===cadLot)&&(!q||`${x.title} ${f?.code||''} ${f?.category||''} ${f?.lot||''}`.toLowerCase().includes(q))})},[items,familyMap,filter,search,cadCategory,cadLot]);
 const visibleSchoolMcq=useMemo(()=>schoolMcq.filter(x=>String(x.subject||'').trim().toLowerCase()!=='solidworks'),[schoolMcq]);
 const visibleSystemMcq=useMemo(()=>systemMcq.filter(x=>String(x.subject||'').trim().toLowerCase()!=='solidworks'),[systemMcq]);
 const shownSchool=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSchoolMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSchoolMcq,filter,search]);
 const shownSystem=useMemo(()=>{const q=search.toLowerCase().trim();return visibleSystemMcq.filter(x=>(filter==='all'||x.difficulty===filter)&&(!q||`${x.stem} ${x.subject} ${x.category_name} ${x.category_code}`.toLowerCase().includes(q)))},[visibleSystemMcq,filter,search]);

 async function upload(file,folder){if(!file?.name)return null;const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`question-bank/${folder}/${crypto.randomUUID()}-${safe}`;const {error}=await vx.storage.from(VX_BUCKET).upload(path,file,{upsert:false});if(error)throw error;return path}
 function lotSuffix(lot){const value=String(lot||'');const prefix=teacherCode?`${teacherCode}-`:'';if(prefix&&value.startsWith(prefix))return value.slice(prefix.length)||'001';return value.split('-').pop()||'001'}
 function prefixForCategory(category){return category==='assembly'?'ASM':category==='drawing'?'DRAW':category==='sheet_metal'?'SHEET':category==='surface'?'SURF':'PART'}
 function nextCadTitleForFamily(family){
  if(!family)return 'PART-001';
  const rows=items.filter(x=>x.family_id===family.id),parsed=rows.map(x=>String(x.title||'').trim().toUpperCase().match(/^([A-Z]+)-(\d+)$/)).filter(Boolean);
  if(!parsed.length)return `${prefixForCategory(family.category)}-001`;
  const latest=parsed.reduce((best,m)=>Number(m[2])>Number(best[2])?m:best,parsed[0]);
  return `${latest[1]}-${String(Number(latest[2])+1).padStart(Math.max(3,latest[2].length),'0')}`
 }
 function chooseCadCode(value){
  setCadCodeChoice(value);
  if(value==='__new__')return setCadAutoTitle('PART-001');
  const family=families.find(f=>f.code===value);setCadAutoTitle(nextCadTitleForFamily(family));
 }

 async function addCadQuestion(e){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const form=e.currentTarget,fd=new FormData(form);
  let familyId=null,createdFamily=false;
  try{
   const codeChoice=String(fd.get('codeChoice')||'').trim();
   if(!codeChoice)throw new Error('กรุณาเลือก Code');
   const title=String(fd.get('title')||'').trim();
   if(!title)throw new Error('กรุณาใส่ชื่อโจทย์');

   if(codeChoice==='__new__'){
    const code=String(fd.get('newCode')||'').trim().toUpperCase();
    const category=String(fd.get('category')||'part_modeling');
    const difficulty=String(fd.get('difficulty')||'basic');
    const lotCode=String(fd.get('lotCode')||'').trim();
    const lot=teacherCode&&lotCode?`${teacherCode}-${lotCode}`:'';
    if(!code)throw new Error('กรุณาใส่ Code ใหม่');
    if(!lot)throw new Error('ไม่พบชื่อครูหรือรหัส Lot');
    const {data:exists,error:checkError}=await vx.from('vx_question_families').select('id').eq('code',code).limit(1);
    if(checkError)throw checkError;
    if((exists||[]).length)throw new Error(`Code ${code} มีอยู่แล้ว กรุณาเลือกจาก Dropdown`);
    const {data:family,error:familyError}=await vx.from('vx_question_families').insert({code,name:code,category,lot,difficulty,description:''}).select('id').single();
    if(familyError)throw familyError;
    familyId=family?.id;createdFamily=true;
   }else{
    const {data:family,error:familyError}=await vx.from('vx_question_families').select('id').eq('code',codeChoice).single();
    if(familyError)throw familyError;
    familyId=family?.id;
   }
   if(!familyId)throw new Error('ไม่พบกลุ่ม Code ที่เลือก');

   const drawing=fd.get('drawing'),image=fd.get('modelImage');
   const drawingPath=await upload(drawing,'drawing');
   const imagePath=image?.name?await upload(image,'model'):null;
   const variantCode=`Q-${crypto.randomUUID().slice(0,8).toUpperCase()}`;

   const {error:questionError}=await vx.from('vx_question_bank').insert({
    family_id:familyId,variant_code:variantCode,title,drawing_path:drawingPath,drawing_name:drawing?.name||null,
    model_image_path:imagePath,model_image_name:image?.name||null,show_model_preview:Boolean(imagePath)&&fd.get('preview')==='on',
    reference_volume:Number(fd.get('volume')).toFixed(3),reference_area:Number(fd.get('area')).toFixed(3),reference_mass:Number(fd.get('mass')).toFixed(3),
    reference_com_x:0,reference_com_y:0,reference_com_z:0
   });
   if(questionError)throw questionError;

   form.reset();setCadCodeChoice('');setCadAutoTitle('');setShowCadQuestion(false);setMessage('เพิ่มโจทย์ CAD แล้ว');await load();
  }catch(err){
   if(createdFamily&&familyId)await vx.from('vx_question_families').delete().eq('id',familyId);
   setError(err.message);
  }finally{setSaving(false)}
 }

 async function updateCadQuestion(e,q,f){
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
 }

 async function createCadCode(e){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const form=e.currentTarget,fd=new FormData(form);
  try{
   const code=String(fd.get('code')||'').trim().toUpperCase(),category=String(fd.get('category')||'part_modeling'),difficulty=String(fd.get('difficulty')||'basic'),lotCode=String(fd.get('lotCode')||'').trim();
   if(!code)throw new Error('กรุณาใส่ Code');if(!/^\d{3}$/.test(lotCode))throw new Error('Lot ใช้รหัส 3 หลัก เช่น 001');
   const lot=teacherCode?`${teacherCode}-${lotCode}`:'';if(!lot)throw new Error('ไม่พบชื่อครู');
   const {data:exists,error:checkError}=await vx.from('vx_question_families').select('id').eq('code',code).limit(1);if(checkError)throw checkError;if((exists||[]).length)throw new Error(`Code ${code} มีอยู่แล้ว`);
   const {error}=await vx.from('vx_question_families').insert({code,name:code,category,lot,difficulty,description:''});if(error)throw error;
   form.reset();setMessage(`เพิ่ม Code ${code} แล้ว`);await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 async function updateCadCode(e,f){
  e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  const fd=new FormData(e.currentTarget);
  try{
   const code=String(fd.get('code')||'').trim().toUpperCase(),category=String(fd.get('category')||f.category||'part_modeling'),difficulty=String(fd.get('difficulty')||f.difficulty||'basic'),lotCode=String(fd.get('lotCode')||'').trim();
   if(!code)throw new Error('กรุณาใส่ Code');if(!/^\d{3}$/.test(lotCode))throw new Error('Lot ใช้รหัส 3 หลัก เช่น 001');
   const {data:exists,error:checkError}=await vx.from('vx_question_families').select('id').eq('code',code).neq('id',f.id).limit(1);if(checkError)throw checkError;if((exists||[]).length)throw new Error(`Code ${code} มีอยู่แล้ว`);
   const lot=teacherCode?`${teacherCode}-${lotCode}`:f.lot;
   const {error}=await vx.from('vx_question_families').update({code,name:code,category,difficulty,lot,updated_at:new Date().toISOString()}).eq('id',f.id);if(error)throw error;
   setMessage(`แก้ไข Code ${code} แล้ว`);await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 async function deleteCadCode(f){
  const count=items.filter(q=>q.family_id===f.id).length;
  if(count)return setError(`Code ${f.code} ยังมีโจทย์ ${count} ข้อ กรุณาย้ายหรือลบโจทย์ออกก่อน`);
  if(!window.confirm(`ลบ Code ${f.code} ?`))return;
  setSaving(true);setError('');setMessage('');
  const {error}=await vx.from('vx_question_families').delete().eq('id',f.id);setSaving(false);if(error)return setError(error.message);setMessage(`ลบ Code ${f.code} แล้ว`);await load();
 }

 async function addMcq(e){e.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');const form=e.currentTarget,fd=new FormData(form);try{const choices=['A','B','C','D'].map(k=>String(fd.get(`choice${k}`)||'').trim());const {error}=await vx.rpc('vx_teacher_create_mcq_question',{p_subject:String(fd.get('subject')||'SolidWorks').trim()||'SolidWorks',p_category_code:String(fd.get('categoryCode')||'').trim(),p_category_name:String(fd.get('categoryName')||'').trim(),p_difficulty:String(fd.get('difficulty')||'basic'),p_stem:String(fd.get('stem')||'').trim(),p_choices:choices,p_correct_key:String(fd.get('correct')||'A'),p_explanation:String(fd.get('explanation')||'').trim(),p_status:String(fd.get('status')||'active')});if(error)throw error;form.reset();setShowMcq(false);setMessage('เพิ่มข้อสอบปรนัยใน School Bank แล้ว');await load()}catch(err){setError(err.message)}finally{setSaving(false)}}
 async function toggleCad(q){const value=!q.is_active;const {error}=await vx.from('vx_question_bank').update({is_active:value,updated_at:new Date().toISOString()}).eq('id',q.id);if(error)return setError(error.message);setMessage(value?'เปิดใช้โจทย์ CAD แล้ว':'ปิดใช้โจทย์ CAD แล้ว');load()}
 async function toggleMcq(q){const next=q.status==='active'?'archived':'active';const {error}=await vx.rpc('vx_teacher_set_mcq_status',{p_question_id:q.id,p_status:next});if(error)return setError(error.message);setMessage(next==='active'?'เปิดใช้ข้อสอบแล้ว':'ปิดใช้ข้อสอบแล้ว');load()}
 async function importSelected(){if(!selectedSystem.length||saving)return;setSaving(true);setError('');const {data,error}=await vx.rpc('vx_teacher_import_system_mcq_selected',{p_question_ids:selectedSystem});setSaving(false);if(error)return setError(error.message);setSelectedSystem([]);setMessage(`นำเข้า ${Number(data||0)} ข้อจาก System Bank แล้ว`);load()}
 function toggleSystem(id){setSelectedSystem(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id])}
 async function openFile(path){if(!path)return;const {data,error}=await vx.storage.from(VX_BUCKET).createSignedUrl(path,300);if(error)return setError(error.message);window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 function changeCategory(value){setCadCategory(value);setCadLot('all')}

 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="bank"/>
  <header className="vx-top"><div><p className="vx-kicker">QUESTION BANK</p><h1>คลังโจทย์</h1><p>School Central Question Bank · CAD / Mass Properties + ปรนัย พร้อม Category และ Lot</p></div><div className="vx-toolbar"><button className="vx-btn secondary" onClick={load}><RefreshCw size={15}/>Refresh</button>{mode==='cad'?<><button className="vx-btn secondary" onClick={()=>{setShowCodeManager(v=>!v);setShowCadQuestion(false);setEditCadId(null)}}><Pencil size={15}/>จัดการ Code</button><button className="vx-btn primary" onClick={()=>{setShowCadQuestion(v=>!v);setShowCodeManager(false);setEditCadId(null);setCadCodeChoice('');setCadAutoTitle('')}}><Plus size={15}/>เพิ่มโจทย์ CAD</button></>:mcqTab==='school'?<button className="vx-btn primary" onClick={()=>setShowMcq(v=>!v)}><Plus size={15}/>เพิ่มข้อปรนัย</button>:<button className="vx-btn primary" disabled={!selectedSystem.length||saving} onClick={importSelected}><Download size={15}/>นำเข้า {selectedSystem.length} ข้อ</button>}</div></header>
  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}

  <div className="vx-toolbar" style={{marginTop:14}}><button className={`vx-btn ${mode==='cad'?'primary':'secondary'}`} onClick={()=>setMode('cad')}>CAD / Mass Properties</button><button className={`vx-btn ${mode==='mcq'?'primary':'secondary'}`} onClick={()=>{setMode('mcq');setShowCadQuestion(false);setEditCadId(null)}}>ปรนัย / Multiple Choice</button></div>
  {mode==='mcq'&&<div className="vx-toolbar" style={{marginTop:8}}><button className={`vx-btn ${mcqTab==='school'?'primary':'secondary'}`} onClick={()=>setMcqTab('school')}>School Bank · {visibleSchoolMcq.length}</button><button className={`vx-btn ${mcqTab==='system'?'primary':'secondary'}`} onClick={()=>setMcqTab('system')}>System Bank · {visibleSystemMcq.length}</button></div>}
  {mode==='cad'&&showCodeManager&&<section className="vx-card" style={{marginTop:10}}><p className="vx-kicker">CAD CODE MANAGER</p><h3>จัดการ Code</h3><p>Code ใช้เป็นกลุ่มโจทย์ · แก้ชื่อ / Category / ระดับ / Lot ได้ และลบได้เมื่อไม่มีโจทย์อยู่ใน Code</p><form className="vx-form" onSubmit={createCadCode} style={{marginTop:12}}><div className="vx-form-row"><label>Code ใหม่<input name="code" placeholder="เช่น 3D-EXERCISES" required/></label><label>Category<select name="category" defaultValue="part_modeling">{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><div className="vx-form-row"><label>ระดับ<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>Lot<div style={{display:'grid',gridTemplateColumns:'minmax(90px,1fr) auto 90px',gap:8,alignItems:'center'}}><input value={teacherCode||'กำลังโหลด...'} readOnly/><b>-</b><input name="lotCode" defaultValue="001" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} required/></div></label></div><button className="vx-btn primary" disabled={saving||!teacherCode}><Plus size={15}/>เพิ่ม Code</button></form><div className="vx-list" style={{marginTop:16}}>{families.map(f=>{const count=items.filter(q=>q.family_id===f.id).length;return <form key={f.id} className="vx-item" onSubmit={e=>updateCadCode(e,f)} style={{display:'block'}}><div className="vx-form-row"><label>Code<input name="code" defaultValue={f.code} required/></label><label>Category<select name="category" defaultValue={f.category||'part_modeling'}>{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><div className="vx-form-row"><label>ระดับ<select name="difficulty" defaultValue={f.difficulty||'basic'}><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>Lot<div style={{display:'grid',gridTemplateColumns:'minmax(90px,1fr) auto 90px',gap:8,alignItems:'center'}}><input value={teacherCode||'กำลังโหลด...'} readOnly/><b>-</b><input name="lotCode" defaultValue={lotSuffix(f.lot)} inputMode="numeric" pattern="[0-9]{3}" maxLength={3} required/></div></label></div><div className="vx-toolbar" style={{marginTop:8}}><span className="vx-progress muted">{count} ข้อ</span><button className="vx-btn secondary" disabled={saving}>บันทึก Code</button><button type="button" className="vx-btn secondary" disabled={saving||count>0} title={count>0?'ต้องย้ายหรือลบโจทย์ออกจาก Code ก่อน':''} onClick={()=>deleteCadCode(f)}><Trash2 size={14}/>ลบ</button></div></form>})}</div></section>}

  <section className="vx-card" style={{marginTop:10,padding:12}}>
   <div className="vx-form-row"><label>ค้นหา<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={mode==='cad'?'ชื่อโจทย์ / Code / Category / Lot':'คำถาม / Subject / Category'}/></label><label>Difficulty<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label></div>
   {mode==='cad'&&<div className="vx-form-row" style={{marginTop:10}}><label>Category<select value={cadCategory} onChange={e=>changeCategory(e.target.value)}><option value="all">ทุก Category</option>{cadCategories.map(c=><option key={c} value={c}>{categoryLabel[c]||c}</option>)}</select></label><label>Lot<select value={cadLot} onChange={e=>setCadLot(e.target.value)}><option value="all">ทุก Lot</option>{cadLots.map(l=><option key={l} value={l}>{l}</option>)}</select></label></div>}
  </section>

  {mode==='cad'&&showCadQuestion&&<section className="vx-card"><p className="vx-kicker">NEW CAD QUESTION</p><h3>เพิ่มโจทย์ CAD</h3><form className="vx-form" onSubmit={addCadQuestion}><div className="vx-form-row"><label>Code<select name="codeChoice" value={cadCodeChoice} onChange={e=>chooseCadCode(e.target.value)} required><option value="" disabled>เลือก Code</option>{families.map(f=><option key={f.id} value={f.code}>{f.code}</option>)}<option value="__new__">+ สร้าง Code ใหม่</option></select></label><label>ชื่อโจทย์<input name="title" value={cadAutoTitle} readOnly placeholder="เลือก Code เพื่อสร้างชื่ออัตโนมัติ" required/></label></div>{cadCodeChoice==='__new__'?<><label>Code ใหม่<input name="newCode" placeholder="เช่น 3D-EXERCISES" required/></label><div className="vx-form-row"><label>Category<select name="category" defaultValue="part_modeling" onChange={e=>setCadAutoTitle(`${prefixForCategory(e.target.value)}-001`)}>{categoryOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>ระดับ<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label></div><label>Lot<div style={{display:'grid',gridTemplateColumns:'minmax(100px,1fr) auto minmax(86px,110px)',gap:8,alignItems:'center'}}><input value={teacherCode||'กำลังโหลด...'} readOnly aria-label="Teacher Lot Prefix"/><b>-</b><input name="lotCode" defaultValue="001" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} placeholder="001" required/></div></label></>:cadCodeChoice?<div className="vx-result">ใช้ Category · ระดับ · Lot ของ Code <b>{cadCodeChoice}</b> อัตโนมัติ</div>:null}<label>Drawing PDF<input name="drawing" type="file" accept="application/pdf,.pdf" required/></label><div className="vx-mass-grid"><label>Volume mm³<input name="volume" type="number" step="0.001" required/></label><label>Surface Area mm²<input name="area" type="number" step="0.001" required/></label><label>Mass g<input name="mass" type="number" step="0.001" required/></label></div><label>Model Reference Image<input name="modelImage" type="file" accept="image/png,image/jpeg,image/webp"/></label><label><span><input name="preview" type="checkbox"/> ให้นักเรียนเห็น Model Image</span></label><button className="vx-btn primary" disabled={saving||!cadCodeChoice||(cadCodeChoice==='__new__'&&!teacherCode)}>{saving?'กำลังบันทึก...':'บันทึกโจทย์ CAD'}</button></form></section>}

  {mode==='mcq'&&mcqTab==='school'&&showMcq&&<section className="vx-card"><p className="vx-kicker">NEW MCQ</p><h3>เพิ่มข้อสอบปรนัย</h3><form className="vx-form" onSubmit={addMcq}><div className="vx-form-row"><label>Subject<input name="subject" defaultValue="SolidWorks" required/></label><label>Difficulty<select name="difficulty" defaultValue="basic"><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label></div><div className="vx-form-row"><label>Category Code<input name="categoryCode" placeholder="เช่น SKETCH"/></label><label>Category Name<input name="categoryName" placeholder="เช่น Sketch Tools"/></label></div><label>คำถาม<textarea name="stem" rows="3" required/></label>{['A','B','C','D'].map(k=><label key={k}>ตัวเลือก {thaiKey[k]} ({k})<input name={`choice${k}`} required/></label>)}<div className="vx-form-row"><label>เฉลย<select name="correct" defaultValue="A"><option value="A">ก (A)</option><option value="B">ข (B)</option><option value="C">ค (C)</option><option value="D">ง (D)</option></select></label><label>สถานะ<select name="status" defaultValue="active"><option value="active">พร้อมใช้</option><option value="draft">Draft</option></select></label></div><label>คำอธิบายเฉลย<textarea name="explanation" rows="2"/></label><button className="vx-btn primary" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึกข้อสอบ'}</button></form></section>}

  {loading?<div className="vx-empty">กำลังโหลดคลังโจทย์...</div>:mode==='cad'?<section className="vx-list">{shownCad.length?shownCad.map(q=>{const f=familyMap[q.family_id];return <article className="vx-card" key={q.id}><div className="vx-top"><div><p className="vx-kicker">{f?.code||'CAD'} · {diffLabel[f?.difficulty]||''}</p><h3>{q.title}</h3><p>{categoryLabel[f?.category]||f?.category||'Part Modeling'} · Lot {f?.lot||'General'}</p></div><CadModelPreview path={q.model_image_path} title={q.title} onOpen={()=>openFile(q.model_image_path)}/><span className={`vx-progress ${q.is_active?'final':'muted'}`}>{q.is_active?'พร้อมใช้':'ปิดใช้'}</span></div><div className="vx-toolbar" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:12}}><button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} disabled={!q.drawing_path} onClick={()=>openFile(q.drawing_path)}><FileText size={14}/>Drawing</button>{q.model_image_path?<button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>openFile(q.model_image_path)}><ImageIcon size={14}/>Model</button>:<span/>}<button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>setEditCadId(editCadId===q.id?null:q.id)}><Pencil size={14}/>{editCadId===q.id?'ยกเลิกแก้ไข':'แก้ไข'}</button><button className="vx-file" style={{width:'100%',minHeight:40,padding:'9px 12px',justifyContent:'flex-start'}} onClick={()=>toggleCad(q)}><Power size={14}/>{q.is_active?'ปิดใช้':'เปิดใช้'}</button></div><div className="vx-tags"><span>{categoryLabel[f?.category]||f?.category}</span><span>Lot {f?.lot||'General'}</span><span>Volume {Number(q.reference_volume).toFixed(3)}</span><span>Area {Number(q.reference_area).toFixed(3)}</span><span>Mass {Number(q.reference_mass).toFixed(3)}</span><span>Tol V {Number(q.volume_tolerance_percent||0).toFixed(2)}%</span><span>Tol A {Number(q.area_tolerance_percent||0).toFixed(2)}%</span></div>{editCadId===q.id&&<form className="vx-form" onSubmit={e=>updateCadQuestion(e,q,f)} style={{marginTop:14,paddingTop:14,borderTop:'1px solid #f0ddd1'}}><p className="vx-kicker">EDIT CAD QUESTION</p><label>Code<select name="codeChoice" defaultValue={f?.code||''} required>{families.map(group=><option key={group.id} value={group.code}>{group.code}</option>)}</select><small>เปลี่ยน Code = ย้ายโจทย์ข้อนี้ไปอยู่กลุ่ม Code ที่เลือก</small></label><label>ชื่อโจทย์<input name="title" defaultValue={q.title||''} required/></label><div className="vx-mass-grid"><label>Volume mm³<input name="volume" type="number" step="0.001" defaultValue={q.reference_volume} required/></label><label>Surface Area mm²<input name="area" type="number" step="0.001" defaultValue={q.reference_area} required/></label><label>Mass g<input name="mass" type="number" step="0.001" defaultValue={q.reference_mass} required/></label></div><label>เปลี่ยน Drawing PDF (ไม่เลือก = ใช้ไฟล์เดิม)<input name="drawing" type="file" accept="application/pdf,.pdf"/></label><label>เปลี่ยน Model Image (ไม่เลือก = ใช้รูปเดิม)<input name="modelImage" type="file" accept="image/png,image/jpeg,image/webp"/></label><label><span><input name="preview" type="checkbox" defaultChecked={Boolean(q.show_model_preview)}/> ให้นักเรียนเห็น Model Image</span></label><div className="vx-toolbar"><button className="vx-btn primary" disabled={saving}>{saving?'กำลังบันทึก...':'บันทึกการแก้ไข'}</button><button type="button" className="vx-btn secondary" onClick={()=>setEditCadId(null)} disabled={saving}>ยกเลิก</button></div></form>}</article>}):<div className="vx-empty">ไม่พบโจทย์ CAD ตาม Category / Lot / Difficulty ที่เลือก</div>}</section>
  :mcqTab==='school'?<section className="vx-list">{shownSchool.length?shownSchool.map(q=><article className="vx-card" key={q.id}><div className="vx-top"><div><p className="vx-kicker">MCQ · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:''}</p><h3>{q.stem}</h3><p>{q.subject}{q.category_code?` · ${q.category_code}`:''} · {q.source||'School Bank'}</p></div><span className={`vx-progress ${q.status==='active'?'final':'muted'}`}>{q.status==='active'?'พร้อมใช้':q.status}</span></div><div className="vx-list" style={{marginTop:10}}>{(q.choices||[]).map(c=><div key={c.key} className="vx-item" style={{padding:'9px 12px'}}><span><b>{thaiKey[c.key]||c.key}.</b> {c.text}</span>{c.is_correct&&<span className="vx-progress final">✓ เฉลย</span>}</div>)}</div>{q.explanation&&<p style={{marginTop:10}}>คำอธิบาย: {q.explanation}</p>}<div className="vx-toolbar" style={{marginTop:10}}><button className="vx-file" style={{width:'100%',background:q.status==='active'?'#eaf8ef':'#fff0ef',borderColor:q.status==='active'?'#bfe8cb':'#f2b9b4',color:q.status==='active'?'#2e7d4f':'#b6463a',fontWeight:700}} onClick={()=>toggleMcq(q)}><Power size={14}/>{q.status==='active'?'ปิดใช้':'เปิดใช้'}</button></div></article>):<div className="vx-empty">ไม่พบข้อสอบปรนัยใน School Bank</div>}</section>
  :<section className="vx-list">{shownSystem.length?shownSystem.map(q=><label className="vx-card" key={q.id} style={{display:'block',cursor:q.imported?'default':'pointer'}}><div className="vx-top"><div><p className="vx-kicker">SYSTEM MCQ · {diffLabel[q.difficulty]}{q.category_name?` · ${q.category_name}`:''}</p><h3>{q.stem}</h3><p>{q.subject}{q.category_code?` · ${q.category_code}`:''}</p></div>{q.imported?<span className="vx-progress final">มีใน School Bank แล้ว</span>:<input type="checkbox" checked={selectedSystem.includes(q.id)} onChange={()=>toggleSystem(q.id)}/>}</div><div className="vx-list" style={{marginTop:10}}>{(q.choices||[]).map(c=><div key={c.key} className="vx-item" style={{padding:'8px 11px'}}><span><b>{thaiKey[c.key]||c.key}.</b> {c.text}</span>{c.is_correct&&<span>✓</span>}</div>)}</div></label>):<div className="vx-empty">ไม่พบข้อใน System Bank ตามตัวกรอง</div>}</section>}
 </div></main>;
}