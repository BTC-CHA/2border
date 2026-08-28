'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {ArrowLeft,Upload,CheckCircle2} from 'lucide-react';
import {vx,VX_BUCKET} from '../../../vxClient';
import TeacherNav from '../../TeacherNav';

const clean=s=>String(s||'CAD').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,32)||'CAD';

export default function AttachCadAssetsPage(){
 const params=useSearchParams();
 const requestedId=Number(params.get('id')||0);
 const [item,setItem]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);

 async function load(){
  setLoading(true);setError('');
  let q=null,qe=null;
  if(requestedId>0){({data:q,error:qe}=await vx.from('vx_question_bank').select('*').eq('id',requestedId).single())}
  else{
   const {data:f,error:fe}=await vx.from('vx_question_families').select('id').eq('code','VALVE-001').single();
   if(fe){setError(fe.message);setLoading(false);return}
   ;({data:q,error:qe}=await vx.from('vx_question_bank').select('*').eq('family_id',f.id).eq('variant_code','A').single())
  }
  if(qe||!q){setError(qe?.message||'ไม่พบ CAD Variant');setLoading(false);return}
  const {data:f,error:fe}=await vx.from('vx_question_families').select('id,code,name,difficulty').eq('id',q.family_id).single();
  if(fe)setError(fe.message);else setItem({...q,family:f});
  setLoading(false)
 }
 useEffect(()=>{load()},[requestedId]);

 async function upload(file,folder){
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const family=clean(item?.family?.code),variant=clean(item?.variant_code),difficulty=clean(item?.family?.difficulty||'basic');
  const base=`VX-CAD-${difficulty}-${family}-${variant}${folder==='model'?'-MODEL':''}.${ext}`;
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
   const patch={drawing_path:d.path,drawing_name:d.name,is_active:true,updated_at:new Date().toISOString()};
   if(m){patch.model_image_path=m.path;patch.model_image_name=m.name;patch.show_model_preview=true}
   const {error}=await vx.from('vx_question_bank').update(patch).eq('id',item.id);
   if(error)throw error;
   setDone(true);e.currentTarget.reset();await load();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }

 const label=item?`${item.family.code} · Variant ${item.variant_code}`:'CAD Variant';
 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="bank"/>
  <header className="vx-top"><div><Link className="vx-file" href="/verifyx/teacher/question-bank"><ArrowLeft size={15}/>Question Bank</Link><p className="vx-kicker" style={{marginTop:14}}>ATTACH CAD ASSETS</p><h1>{label}</h1><p>แนบ Drawing PDF และ Model Reference ให้ CAD Variant ที่มีค่า Mass Properties เตรียมไว้แล้ว</p></div></header>
  {error&&<div className="vx-error">{error}</div>}{done&&<div className="vx-success"><CheckCircle2 size={16}/> แนบไฟล์และเปิดใช้โจทย์เรียบร้อย</div>}
  {loading?<div className="vx-empty">กำลังโหลด...</div>:item?<section className="vx-card"><div className="vx-tags" style={{marginBottom:14}}><span>{item.family.name}</span><span>{item.family.difficulty}</span><span>Volume {Number(item.reference_volume).toFixed(3)} mm³</span><span>Area {Number(item.reference_area).toFixed(3)} mm²</span><span>Mass {Number(item.reference_mass).toFixed(3)} g</span><span>COM {Number(item.reference_com_x).toFixed(3)}, {Number(item.reference_com_y).toFixed(3)}, {Number(item.reference_com_z).toFixed(3)}</span><span>Tolerance V {Number(item.volume_tolerance_percent).toFixed(2)}%</span><span>Tolerance A {Number(item.area_tolerance_percent).toFixed(2)}%</span></div>{item.drawing_path&&<div className="vx-success" style={{marginBottom:12}}>มี Drawing แล้ว: {item.drawing_name}</div>}<form className="vx-form" onSubmit={submit}><label>Drawing PDF<input name="drawing" type="file" accept="application/pdf,.pdf" required/></label><label>Model Reference Image (ไม่บังคับ)<input name="model" type="file" accept="image/png,image/jpeg,image/webp"/></label><button className="vx-btn primary" disabled={saving}><Upload size={16}/>{saving?'กำลังอัปโหลด...':`แนบไฟล์และเปิดใช้ ${item.family.code} / ${item.variant_code}`}</button></form></section>:<div className="vx-empty">ไม่พบ CAD Variant</div>}
 </div></main>;
}
