'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Eye,FileText,Flag,Save,Send,ListChecks} from 'lucide-react';
import {vx,VX_BUCKET} from '../../../vxClient';

const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(2)}%`:'—';
const blankCad={volume:'',surface_area:'',mass:'',com_x:'',com_y:'',com_z:'',saved:false,dirty:false};
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};

export default function StudentAssignment(){
 const {id}=useParams();const assignmentId=Number(id);
 const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({}),[stage,setStage]=useState('work'),[status,setStatus]=useState('in_progress'),[finalAt,setFinalAt]=useState(null),[savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 const hasDirty=useMemo(()=>Object.values(answers).some(a=>a?.dirty),[answers]);
 useEffect(()=>{if(assignmentId)load()},[assignmentId]);
 useEffect(()=>{const warn=e=>{if(!hasDirty||status==='final')return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[hasDirty,status]);

 async function load(){
  setLoading(true);setError('');
  const {data:me,error:meErr}=await vx.rpc('vx_student_me');
  if(meErr||!me?.[0]){setError(meErr?.message||'กรุณา Login และผูกบัญชีนักเรียนก่อน');setLoading(false);return}
  const p=me[0];setProfile(p);
  const [{data:list,error:le},{data:rows,error:re}]=await Promise.all([
   vx.rpc('vx_student_assignments_v2_auth'),
   vx.rpc('vx_student_start_assignment_v2_auth',{p_assignment_id:assignmentId})
  ]);
  if(le||re){setError((le||re).message);setLoading(false);return}
  setAssignment((list||[]).find(x=>Number(x.id)===assignmentId)||null);
  const xs=rows||[];setItems(xs);
  if(xs[0]){setStatus(xs[0].progress_status);setFinalAt(xs[0].final_at||null)}
  setAnswers(Object.fromEntries(xs.map(x=>{
   if(x.question_type==='mcq')return [x.item_id,{choice:x.selected_choice_key||'',saved:!!x.selected_choice_key,dirty:false}];
   return [x.item_id,{volume:x.volume??'',surface_area:x.surface_area??'',mass:x.mass??'',com_x:x.com_x??'',com_y:x.com_y??'',com_z:x.com_z??'',saved:[x.volume,x.surface_area,x.mass,x.com_x,x.com_y,x.com_z].every(v=>v!==null&&v!==undefined),dirty:false}]
  })));
  setLoading(false)
 }
 function changeCad(itemId,key,value){setAnswers(a=>({...a,[itemId]:{...(a[itemId]||blankCad),[key]:value,saved:false,dirty:true}}))}
 function changeChoice(itemId,value){setAnswers(a=>({...a,[itemId]:{...(a[itemId]||{}),choice:value,saved:false,dirty:true}}))}
 async function openFile(path){if(!path)return;const {data,error}=await vx.storage.from(VX_BUCKET).createSignedUrl(path,300);if(error)return setError(error.message);window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 async function toggleFlag(item){if(status==='final')return;const next=!item.is_flagged;setItems(xs=>xs.map(x=>x.item_id===item.item_id?{...x,is_flagged:next}:x));const {error}=await vx.rpc('vx_student_set_flag_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_is_flagged:next});if(error){setError(error.message);load()}}
 async function saveOne(item){
  if(savingId)return;const a=answers[item.item_id]||{};setSavingId(item.item_id);setError('');setMessage('');let error;
  if(item.question_type==='mcq'){
   if(!a.choice){setSavingId(null);setError(`ข้อ ${item.slot_no} ยังไม่ได้เลือกคำตอบ`);return}
   ({error}=await vx.rpc('vx_student_save_mcq_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_choice_key:a.choice,p_is_flagged:item.is_flagged}));
  }else{
   const vals=[a.volume,a.surface_area,a.mass,a.com_x,a.com_y,a.com_z];
   if(vals.some(v=>v===''||v===null||v===undefined||!Number.isFinite(Number(v)))){setSavingId(null);setError(`ข้อ ${item.slot_no} ยังกรอกข้อมูลไม่ครบหรือมีค่าที่ไม่ถูกต้อง`);return}
   ({error}=await vx.rpc('vx_student_save_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_volume:Number(a.volume).toFixed(3),p_surface_area:Number(a.surface_area).toFixed(3),p_mass:Number(a.mass).toFixed(3),p_com_x:Number(a.com_x).toFixed(3),p_com_y:Number(a.com_y).toFixed(3),p_com_z:Number(a.com_z).toFixed(3),p_is_flagged:item.is_flagged}));
  }
  setSavingId(null);if(error){setError(error.message);return}
  setAnswers(x=>({...x,[item.item_id]:{...a,saved:true,dirty:false}}));setMessage(`บันทึกข้อ ${item.slot_no} แล้ว`)
 }
 const completeCount=useMemo(()=>items.filter(i=>answers[i.item_id]?.saved).length,[items,answers]);
 const flaggedCount=items.filter(i=>i.is_flagged).length;
 const canFinal=items.length>0&&completeCount===items.length&&status!=='final'&&!hasDirty;
 async function finalize(){
  if(!canFinal||finalizing)return;
  if(flaggedCount>0&&!confirm(`ยังมี ${flaggedCount} ข้อที่ติดธงเหลืองอยู่\nยืนยันว่าจะ Final จริงหรือไม่?`))return;
  if(!confirm('หลัง Final แล้วจะกลับมาแก้คำตอบไม่ได้\nยืนยันส่งคำตอบสุดท้าย?'))return;
  setFinalizing(true);setError('');const {data,error}=await vx.rpc('vx_student_finalize_assignment_v2_auth',{p_assignment_id:assignmentId});setFinalizing(false);
  if(error){setError(error.message);return}
  const result=data||[];setItems(xs=>xs.map(x=>{const r=result.find(z=>z.item_id===x.item_id);return r?{...x,...r,progress_status:'final'}:x}));setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')
 }
 if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังเตรียมชุดโจทย์...</div></div></main>;
 if(error&&!assignment)return <main className="vx-page"><div className="vx-wrap"><Link className="vx-file" href="/verifyx/student"><ArrowLeft size={15}/>Assignments</Link><div className="vx-error">{error}</div></div></main>;
 const typeLabel=assignment?.assignment_type==='mixed'?'CAD + Multiple Choice':assignment?.assignment_type==='mcq'?'Multiple Choice':'CAD / Mass Properties';
 return <main className="vx-page"><div className="vx-wrap">
  <nav style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><Link className="vx-link primary" href="/verifyx/student">Assignments</Link><Link className="vx-link secondary" href="/verifyx/student/results">Results</Link><Link className="vx-link secondary" href="/verifyx/student/profile">Profile</Link></nav>
  <header className="vx-top"><div><Link className="vx-file" href="/verifyx/student"><ArrowLeft size={15}/>Assignments</Link><p className="vx-kicker" style={{marginTop:14}}>ASSIGNMENT</p><h1>{assignment?.title||'Assignment'}</h1><p>{profile?.institution_name} · {assignment?.course||'ไม่ระบุวิชา'} · {typeLabel} · {items.length} ข้อ · {status==='final'?'Final แล้ว':'แก้ได้จนกว่าจะ Final'}</p></div>{status!=='final'&&<button className="vx-btn secondary" onClick={()=>setStage(stage==='work'?'summary':'work')}><ListChecks size={16}/>{stage==='work'?'Summary':'กลับไปทำโจทย์'}</button>}</header>
  {message&&<div className="vx-success">{message}</div>}{error&&<div className="vx-error">{error}</div>}
  {stage==='work'&&<><div className="vx-card" style={{marginBottom:14}}><div className="vx-tags"><span>บันทึกแล้ว {completeCount}/{items.length}</span><span>{flaggedCount?`🟨 ไม่แน่ใจ ${flaggedCount} ข้อ`:'ไม่มีข้อที่ติดธง'}</span><span>{hasDirty?'มีคำตอบที่แก้แล้วแต่ยังไม่ Save':'คำตอบที่แก้ล่าสุด Save แล้ว'}</span><span>ชุดโจทย์ถูกล็อกแล้ว Refresh ก็ไม่สุ่มใหม่</span></div></div>
   <section className="vx-list">{items.map(item=>{const a=answers[item.item_id]||{};const isMcq=item.question_type==='mcq';return <article className={`vx-card ${item.is_flagged?'vx-flagged-card':''}`} key={item.item_id}>
    <div className="vx-top" style={{marginBottom:10}}><div><p className="vx-kicker">QUESTION {item.slot_no} · {isMcq?'MULTIPLE CHOICE':'CAD / MASS PROPERTIES'}</p><h3>{item.title}</h3></div><span className={a.saved?'vx-progress final':'vx-progress muted'}>{a.saved?'บันทึกแล้ว':'ยังไม่บันทึก'}</span></div>
    <div className="vx-toolbar">{!isMcq&&<button className="vx-file" disabled={!item.drawing_path} onClick={()=>openFile(item.drawing_path)}><FileText size={15}/>{item.drawing_path?'Drawing PDF':'ยังไม่มี PDF'}</button>}{!isMcq&&item.show_model_preview&&item.model_image_path&&<button className="vx-file" onClick={()=>openFile(item.model_image_path)}><Eye size={15}/>Model Reference</button>}<button className={`vx-file ${item.is_flagged?'vx-flag-active':''}`} onClick={()=>toggleFlag(item)}><Flag size={15}/>{item.is_flagged?'🟨 ไม่แน่ใจ':'มาร์กไม่แน่ใจ'}</button></div>
    {isMcq?<div className="vx-form"><div className="vx-list">{(item.mcq_choices||[]).map(c=><label key={c.key} className="vx-card" style={{display:'flex',alignItems:'center',gap:12,cursor:status==='final'?'default':'pointer',padding:14}}><input type="radio" name={`q-${item.item_id}`} checked={a.choice===c.key} onChange={()=>changeChoice(item.item_id,c.key)} disabled={status==='final'}/><b style={{minWidth:28}}>{thaiKey[c.key]||c.key}.</b><span>{c.text}</span></label>)}</div>{status!=='final'&&<button className="vx-btn primary" disabled={savingId!==null} onClick={()=>saveOne(item)}><Save size={15}/>{savingId===item.item_id?'กำลังบันทึก...':'บันทึกคำตอบข้อนี้'}</button>}</div>
    :<div className="vx-form"><div className="vx-empty" style={{marginTop:0}}>เขียนชิ้นงานตาม Drawing แล้วนำค่าจาก Mass Properties มากรอกด้านล่าง</div><div className="vx-mass-grid"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(item.item_id,'volume',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(item.item_id,'surface_area',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(item.item_id,'mass',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM X<input value={a.com_x??''} onChange={e=>changeCad(item.item_id,'com_x',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM Y<input value={a.com_y??''} onChange={e=>changeCad(item.item_id,'com_y',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM Z<input value={a.com_z??''} onChange={e=>changeCad(item.item_id,'com_z',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label></div>{status!=='final'&&<button className="vx-btn primary" disabled={savingId!==null} onClick={()=>saveOne(item)}><Save size={15}/>{savingId===item.item_id?'กำลังบันทึก...':'บันทึกคำตอบข้อนี้'}</button>}</div>}
   </article>})}</section></>}
  {stage==='summary'&&<section className="vx-card"><p className="vx-kicker">SUMMARY</p><h2>{status==='final'?'ผลการตรวจ Final':'ตรวจคำตอบก่อน Final'}</h2><p>{status==='final'?`ส่ง Final แล้ว ${finalAt?new Date(finalAt).toLocaleString('th-TH'):''}`:'ตรวจรายการด้านล่างให้ครบ ก่อนกดยืนยันคำตอบสุดท้าย'}</p><div className="vx-list">{items.map(item=>{const a=answers[item.item_id]||{};const saved=a.saved||status==='final';const isMcq=item.question_type==='mcq';return <article className="vx-item" key={item.item_id}><div><h3>ข้อ {item.slot_no} · {item.title}</h3><p>{saved?(isMcq?`เลือก ${thaiKey[a.choice]||a.choice||item.selected_choice_key||'—'} และบันทึกแล้ว`:'กรอกค่าจาก Mass Properties ครบและบันทึกแล้ว'):'ยังไม่ได้บันทึกคำตอบครบ'}</p><div className="vx-tags">{item.is_flagged&&status!=='final'&&<span>🟨 ไม่แน่ใจ — ควรกลับไปตรวจ</span>}{status==='final'&&isMcq&&<><span>{item.mcq_correct?'ตอบถูก':'ตอบผิด'}</span><span>Score {Number(item.score||0).toFixed(0)}/100</span></>}{status==='final'&&!isMcq&&<><span>Volume {item.volume_pass?'PASS':'FAIL'} · Error {pct(item.volume_error_percent)}</span><span>Area {item.area_pass?'PASS':'FAIL'} · Error {pct(item.area_error_percent)}</span><span>Score {Number(item.score||0).toFixed(0)}/100</span></>}</div></div>{status!=='final'&&<button className="vx-link secondary" onClick={()=>setStage('work')}>{item.is_flagged?'ตรวจข้อนี้':'กลับไปแก้'}</button>}</article>})}</div>{status!=='final'?<><div className={canFinal?'vx-success':'vx-error'} style={{marginTop:14}}>{canFinal?(flaggedCount?`ตอบครบแล้ว แต่ยังมีธงเหลือง ${flaggedCount} ข้อ`:'ตอบครบทุกข้อแล้ว พร้อม Final'):(hasDirty?'ยังมีคำตอบที่แก้แล้วแต่ยังไม่ได้ Save':`ต้องบันทึกให้ครบ ${items.length} ข้อก่อน Final · ตอนนี้ ${completeCount}/${items.length}`)}</div><button className="vx-btn primary" style={{marginTop:12,width:'100%'}} disabled={!canFinal||finalizing} onClick={finalize}><Send size={16}/>{finalizing?'กำลังตรวจและล็อกงาน...':'ยืนยันคำตอบสุดท้าย · Final'}</button></>:<div className="vx-result"><div className="vx-score">{items.length?Math.round(items.reduce((n,x)=>n+Number(x.score||0),0)/items.length):0}/100</div><p>CAD ตรวจอัตโนมัติจากค่าตัวเลขตาม tolerance · ปรนัยตรวจจาก answer key</p></div>}</section>}
 </div></main>;
}
