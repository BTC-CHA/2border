'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Upload,CheckCircle2} from 'lucide-react';
import {vx,VX_BUCKET} from '../../../vxClient';
import TeacherNav from '../../TeacherNav';

const TARGET_CODE='VALVE-001';
const TARGET_VARIANT='A';

export default function AttachCadAssetsPage(){
 const [item,setItem]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 async function load(){
  setLoading(true);setError('');
  const {data:f,error:fe}=await vx.from('vx_question_families').select('id,code,name').eq('code',TARGET_CODE).single();
  if(fe){setError(fe.message);setLoading(false);return}
  const {data:q,error:qe}=await vx.from('vx_question_bank').select('*').eq('family_id',f.id).eq('variant_code',TARGET_VARIANT).single();
  if(qe)setError(qe.message);else setItem({...q,family:f});
  setLoading(false)
 }
 useEffect(()=>{load()},[]);
 async function upload(file,folder){
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const base=`VX-CAD-BASIC-VALVE001-A${folder==='model'?'-MODEL':''}.${ext}`;
  const path=`question-bank/${folder}/${crypto.randomUUID()}-${base}`;
  const {error}=await vx.storage.from(VX_BUCKET).upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(error)throw error;
  return {path,name:base};
 }
 async function submit(e){
  e.preventDefault();if(saving||!item)return;setSaving(true);setError('');setDone(false);
  const fd=new FormData(e.currentTarget),drawing=fd.get('drawing'),model=fd.get('model');
  try{
   if(!drawing?.name)throw new Error('กรุณาเลือก Drawing PDF');
   const d=await upload(drawing,'drawing');
   const m=model?.name?await upload(model,'model'):null;
   const {error}=await vx.from('vx_question_bank').update({drawing_path:d.path,drawing_name:d.name,model_image_path:m?.path||null,model_image_name:m?.name||null,show_model_preview:Boolean(m),is_active:true,updated_at:new Date().toISOString()}).eq('id',item.id);
   if(error)throw error;
   setDone(true);await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="bank"/>
  <header className="vx-top"><div><Link className="vx-file" href="/verifyx/teacher/question-bank"><ArrowLeft size={15}/>Question Bank</Link><p className="vx-kicker" style={{marginTop:14}}>ATTACH CAD ASSETS</p><h1>VALVE-001 · Variant A</h1><p>ค่า Mass Properties ถูกบันทึกไว้แล้ว เหลือเพียงแนบ Drawing และ Model Reference</p></div></header>
  {error&&<div className="vx-error">{error}</div>}{done&&<div className="vx-success"><CheckCircle2 size={16}/> แนบไฟล์และเปิดใช้โจทย์เรียบร้อย</div>}
  {loading?<div className="vx-empty">กำลังโหลด...</div>:item?<section className="vx-card"><div className="vx-tags" style={{marginBottom:14}}><span>Volume {Number(item.reference_volume).toFixed(3)} mm³</span><span>Area {Number(item.reference_area).toFixed(3)} mm²</span><span>Mass {Number(item.reference_mass).toFixed(3)} g</span><span>COM {Number(item.reference_com_x).toFixed(3)}, {Number(item.reference_com_y).toFixed(3)}, {Number(item.reference_com_z).toFixed(3)}</span><span>Tolerance V {Number(item.volume_tolerance_percent).toFixed(2)}%</span><span>Tolerance A {Number(item.area_tolerance_percent).toFixed(2)}%</span></div><form className="vx-form" onSubmit={submit}><label>Drawing PDF<input name="drawing" type="file" accept="application/pdf,.pdf" required/></label><label>Model Reference Image<input name="model" type="file" accept="image/png,image/jpeg,image/webp"/></label><button className="vx-btn primary" disabled={saving}><Upload size={16}/>{saving?'กำลังอัปโหลด...':'แนบไฟล์และเปิดใช้ VALVE-001'}</button></form></section>:<div className="vx-empty">ไม่พบ VALVE-001 / A</div>}
 </div></main>;
}
