'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,FileText,Flag,Save,Send,ListChecks} from 'lucide-react';
import {vx,VX_BUCKET} from '../../../vxClient';

const blankCad={volume:'',surface_area:'',mass:'',saved:false,dirty:false};
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};
const VX_DEVICE_KEY='verifyx_device_id_v1';
function getVerifyXDeviceId(){
 try{
  let id=localStorage.getItem(VX_DEVICE_KEY);
  if(!id){id=`VX-${crypto.randomUUID()}`;localStorage.setItem(VX_DEVICE_KEY,id)}
  return id;
 }catch{return `VX-${crypto.randomUUID()}`}
}

export default function StudentAssignment(){
 const {id}=useParams();
 const assignmentId=Number(id);
 const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({}),[finalSummary,setFinalSummary]=useState(null),[finalDetails,setFinalDetails]=useState([]);
 const [stage,setStage]=useState('work'),[status,setStatus]=useState('in_progress'),[finalAt,setFinalAt]=useState(null),[currentIndex,setCurrentIndex]=useState(0);
 const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[showFinalDetails,setShowFinalDetails]=useState(false);
 const hasDirty=useMemo(()=>Object.values(answers).some(a=>a?.dirty),[answers]);
 const current=items[currentIndex]||null;

 useEffect(()=>{if(assignmentId)load()},[assignmentId]);
 useEffect(()=>{const warn=e=>{if(!hasDirty||status==='final')return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[hasDirty,status]);

 async function load(){
  setLoading(true);setError('');
  const {data:me,error:meErr}=await vx.rpc('vx_student_me');
  if(meErr||!me?.[0]){setError(meErr?.message||'กรุณา Login และผูกบัญชีนักเรียนก่อน');setLoading(false);return}
  const p=me[0];setProfile(p);
  const [{data:list,error:le},{data:rows,error:re}]=await Promise.all([
   vx.rpc('vx_student_assignments_v2_auth'),
   vx.rpc('vx_student_start_assignment_v3_auth',{p_assignment_id:assignmentId})
  ]);
  if(le||re){setError((le||re).message);setLoading(false);return}
  setAssignment((list||[]).find(x=>Number(x.id)===assignmentId)||null);
  const xs=rows||[];setItems(xs);
  if(xs[0]){setStatus(xs[0].progress_status);setFinalAt(xs[0].final_at||null);if(xs[0].progress_status==='final')setStage('summary')}
  setAnswers(Object.fromEntries(xs.map(x=>x.question_type==='mcq'
   ?[x.item_id,{choice:x.selected_choice_key||'',saved:!!x.selected_choice_key,dirty:false}]
   :[x.item_id,{volume:x.volume??'',surface_area:x.surface_area??'',mass:x.mass??'',saved:[x.volume,x.surface_area,x.mass].every(v=>v!==null&&v!==undefined),dirty:false}]
  )));
  if(xs[0]?.progress_status==='final'){
   const [{data:summary},{data:history}]=await Promise.all([
    vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId}),
    vx.rpc('vx_student_final_history_v6_auth')
   ]);
   setFinalSummary(summary?.[0]||null);
   setFinalDetails((history||[]).filter(r=>Number(r.assignment_id)===assignmentId));
  }else{setFinalSummary(null);setFinalDetails([])};
  setLoading(false)
 }

 function changeCad(itemId,key,value){setAnswers(a=>({...a,[itemId]:{...(a[itemId]||blankCad),[key]:value,saved:false,dirty:true}}))}
 async function openFile(path){if(!path)return;const {data,error}=await vx.storage.from(VX_BUCKET).createSignedUrl(path,300);if(error)return setError(error.message);window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 async function toggleFlag(item){if(status==='final')return;const next=!item.is_flagged;setItems(xs=>xs.map(x=>x.item_id===item.item_id?{...x,is_flagged:next}:x));const {error}=await vx.rpc('vx_student_set_flag_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_is_flagged:next});if(error){setError(error.message);load()}}

 async function chooseMcq(item,value){
  if(status==='final'||savingId)return;
  setSavingId(item.item_id);setError('');setMessage('');
  setAnswers(a=>({...a,[item.item_id]:{...(a[item.item_id]||{}),choice:value,saved:false,dirty:true}}));
  const {error}=await vx.rpc('vx_student_save_mcq_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_choice_key:value,p_is_flagged:item.is_flagged});
  setSavingId(null);
  if(error){setError(error.message);return}
  setAnswers(a=>({...a,[item.item_id]:{...(a[item.item_id]||{}),choice:value,saved:true,dirty:false}}));
  setMessage(`บันทึกข้อ ${item.slot_no} แล้ว`);
  if(currentIndex<items.length-1)setTimeout(()=>setCurrentIndex(i=>Math.min(i+1,items.length-1)),180);
 }

 async function saveCad(item){
  if(savingId)return;const a=answers[item.item_id]||{};const vals=[a.volume,a.surface_area,a.mass];
  if(vals.some(v=>v===''||v===null||v===undefined||!Number.isFinite(Number(v)))){setError(`ข้อ ${item.slot_no} ยังกรอกข้อมูลไม่ครบหรือมีค่าที่ไม่ถูกต้อง`);return}
  setSavingId(item.item_id);setError('');setMessage('');
  const {error}=await vx.rpc('vx_student_save_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_volume:Number(a.volume).toFixed(3),p_surface_area:Number(a.surface_area).toFixed(3),p_mass:Number(a.mass).toFixed(3),p_com_x:null,p_com_y:null,p_com_z:null,p_is_flagged:item.is_flagged});
  setSavingId(null);if(error){setError(error.message);return}
  setAnswers(x=>({...x,[item.item_id]:{...a,saved:true,dirty:false}}));setMessage(`บันทึกข้อ ${item.slot_no} แล้ว`);
 }

 const completeCount=useMemo(()=>items.filter(i=>answers[i.item_id]?.saved).length,[items,answers]);
 const flaggedCount=items.filter(i=>i.is_flagged).length;
 const canFinal=items.length>0&&completeCount===items.length&&status!=='final'&&!hasDirty;

 async function finalize(){
  if(!canFinal||finalizing)return;
  if(flaggedCount>0&&!confirm(`ยังมี ${flaggedCount} ข้อที่ติดธงอยู่\nยืนยันว่าจะ Final จริงหรือไม่?`))return;
  if(!confirm('หลัง Final แล้วจะกลับมาแก้คำตอบไม่ได้\nยืนยันส่งคำตอบสุดท้าย?'))return;
  setFinalizing(true);setError('');const deviceId=getVerifyXDeviceId();const {data,error}=await vx.rpc('vx_student_finalize_assignment_v4_auth',{p_assignment_id:assignmentId,p_device_id:deviceId,p_user_agent:navigator.userAgent||''});setFinalizing(false);
  if(error){setError(error.message);return}
  const result=data||[];const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null);setFinalDetails([]);setShowFinalDetails(false);setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')
 }

 function jumpTo(idx){setCurrentIndex(idx);setStage('work');window.scrollTo({top:0,behavior:'smooth'})}
 function itemState(item){const saved=!!answers[item.item_id]?.saved;if(!saved)return 'unanswered';if(item.is_flagged)return 'flagged';return 'answered'}
 function finalItemPass(r){return r.question_type==='mcq'?Boolean(r.mcq_correct):Number(r.score||0)>=99.995}
 function finalChoiceLabel(r,key){if(!key)return '—';const c=(r.mcq_choices||[]).find(x=>x.key===key);return `${thaiKey[key]||key}. ${c?.text||''}`.trim()}
 function finalMassError(r){const a=Number(r.mass),b=Number(r.reference_mass);if(!Number.isFinite(a)||!Number.isFinite(b))return null;return b===0?Math.abs(a-b):Math.abs(a-b)/Math.abs(b)*100}
 function fmtFinal(v){return Number.isFinite(Number(v))?Number(v).toFixed(3):'—'}

 if(loading)return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังเตรียมชุดโจทย์...</div></div></main>;
 if(error&&!assignment)return <main className="vx-page"><div className="vx-wrap"><Link className="vx-file" href="/verifyx/student"><ArrowLeft size={15}/>Assignments</Link><div className="vx-error">{error}</div></div></main>;

 const typeLabel=assignment?.assignment_type==='mixed'?'CAD + Multiple Choice':assignment?.assignment_type==='mcq'?'Multiple Choice':'CAD / Mass Properties';
 const a=current?answers[current.item_id]||{}:{};
 const isMcq=current?.question_type==='mcq';

 return <main className="vx-page"><div className="vx-wrap vx-exam-wrap">
  <nav className="vx-exam-nav"><Link className="vx-file" href="/verifyx/student"><ArrowLeft size={15}/>Assignments</Link><div><b>{assignment?.title||'Assignment'}</b><small>{profile?.full_name} · {typeLabel}</small></div></nav>
  {message&&<div className="vx-success vx-exam-message">{message}</div>}{error&&<div className="vx-error vx-exam-message">{error}</div>}

  {stage==='work'&&current&&<>
   <div className="vx-exam-progress"><strong>Q{current.slot_no}</strong><span>{currentIndex+1}/{items.length}</span></div>
   <section className={`vx-card vx-exam-question ${current.is_flagged?'vx-flagged-card':''}`}>
    <div className="vx-exam-question-head"><div><p className="vx-kicker">QUESTION {current.slot_no} · {isMcq?'MULTIPLE CHOICE':'CAD / MASS PROPERTIES'}</p><h2>{current.title}</h2></div><span className={a.saved?'vx-progress final':'vx-progress muted'}>{savingId===current.item_id?'กำลังบันทึก…':a.saved?'บันทึกแล้ว':'ยังไม่ตอบ'}</span></div>
    <div className="vx-toolbar vx-exam-tools">{!isMcq&&<button className="vx-file" disabled={!current.drawing_path} onClick={()=>openFile(current.drawing_path)}><FileText size={15}/>{current.drawing_path?'Drawing PDF':'ยังไม่มี PDF'}</button>}<button className={`vx-file ${current.is_flagged?'vx-flag-active':''}`} onClick={()=>toggleFlag(current)}><Flag size={15}/>{current.is_flagged?'ติดธงแล้ว':'มาร์กไม่แน่ใจ'}</button></div>

    {isMcq?<div className="vx-exam-choices">{(current.mcq_choices||[]).map(c=><label key={c.key} className={`vx-exam-choice ${a.choice===c.key?'selected':''}`}><input type="radio" name={`q-${current.item_id}`} checked={a.choice===c.key} onChange={()=>chooseMcq(current,c.key)} disabled={status==='final'||savingId!==null}/><b>{thaiKey[c.key]||c.key}.</b><span>{c.text}</span></label>)}</div>
    :<div className="vx-form"><div className="vx-empty" style={{marginTop:0}}>เขียนชิ้นงานตาม Drawing แล้วนำค่าจาก Mass Properties มากรอกด้านล่าง</div><div className="vx-mass-grid"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label></div>{status!=='final'&&<button className="vx-btn primary" disabled={savingId!==null} onClick={()=>saveCad(current)}><Save size={15}/>{savingId===current.item_id?'กำลังบันทึก...':'บันทึกค่า CAD'}</button>}</div>}
   </section>

   <div className="vx-exam-footer"><button className="vx-exam-arrow" disabled={currentIndex===0} onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))}><ArrowLeft size={28}/></button><button className="vx-btn secondary vx-exam-summary-btn" onClick={()=>setStage('summary')}><ListChecks size={17}/>Summary</button><button className="vx-exam-arrow" disabled={currentIndex===items.length-1} onClick={()=>setCurrentIndex(i=>Math.min(items.length-1,i+1))}><ArrowRight size={28}/></button></div>
  </>}

  {stage==='summary'&&<section className="vx-card vx-exam-summary"><div className="vx-exam-summary-head"><div><p className="vx-kicker">SUMMARY</p><h2>{status==='final'?'ส่งการบ้านเรียบร้อยแล้ว':'ภาพรวมคำตอบ'}</h2></div>{status!=='final'&&<button className="vx-file" onClick={()=>setStage('work')}>กลับไปทำต่อ</button>}</div>
   {status==='final'?<div className="vx-result"><h3 style={{marginTop:0}}>ส่ง Final แล้ว</h3><p>ส่งเมื่อ {finalAt?new Date(finalAt).toLocaleString('th-TH'):''}</p>{finalSummary?<div className="vx-overview-strip" style={{margin:'16px 0'}}><div><small>คะแนนรวม</small><strong>{Number(finalSummary.total_score||0).toFixed(2)}</strong></div><div><small>เกณฑ์ผ่าน</small><strong>{Number(finalSummary.pass_score||60).toFixed(0)}</strong></div><div><small>ผล</small><strong>{finalSummary.passed?'ผ่าน':'ไม่ผ่าน'}</strong></div></div>:<p>กำลังสรุปคะแนน...</p>}{finalDetails.length?<><button className="vx-btn secondary" style={{marginBottom:12}} onClick={()=>setShowFinalDetails(v=>!v)}>{showFinalDetails?'ซ่อนรายละเอียดผลลัพธ์':'ดูรายละเอียดผลลัพธ์'}</button>{showFinalDetails&&<div style={{display:'grid',gap:10,margin:'4px 0 16px'}}>{finalDetails.map(r=>{const pass=finalItemPass(r),c=pass?'#2f9e5b':'#d84c4c',mErr=finalMassError(r),mPass=mErr==null?null:mErr<=Number(r.volume_tolerance_percent||0);return <div key={r.result_id} style={{border:`1px solid ${pass?'#d7eddf':'#f2ceca'}`,background:pass?'#fbfffc':'#fffafa',borderRadius:14,padding:12,textAlign:'left'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}><div><b>ข้อ {r.question_number} · {r.question_title}</b><div style={{fontSize:11,color:c,fontWeight:800,marginTop:4}}>{r.question_type==='mcq'?(pass?'✓ ถูก':'✕ ผิด'):(pass?'✓ PASS':'✕ FAIL')}</div></div><strong style={{color:c,whiteSpace:'nowrap'}}>{Number(r.item_points||0).toFixed(Number(r.item_points||0)%1?2:0)}/{Number(r.item_max_points||0).toFixed(Number(r.item_max_points||0)%1?2:0)}</strong></div>{r.question_type==='mcq'?<div style={{marginTop:9,fontSize:13,lineHeight:1.6}}><div><b>คำตอบของคุณ:</b> {finalChoiceLabel(r,r.selected_choice_key)}</div><div style={{color:'#278c50'}}><b>เฉลย:</b> {finalChoiceLabel(r,r.snapshot_correct_choice_key)}</div>{r.explanation&&<div style={{marginTop:7,padding:9,borderRadius:10,background:'#fff6ee'}}><b>อธิบาย:</b> {r.explanation}</div>}</div>:<div style={{display:'grid',gap:6,marginTop:9,fontSize:12}}>{[['Volume','mm³',r.volume,r.reference_volume,r.volume_error_percent,r.volume_pass],['Surface Area','mm²',r.surface_area,r.reference_area,r.area_error_percent,r.area_pass],['Mass','g',r.mass,r.reference_mass,mErr,mPass]].map(x=><div key={x[0]} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,padding:'8px 10px',borderRadius:10,background:'#fffaf7'}}><span><b>{x[0]}</b> · คุณ {fmtFinal(x[2])} {x[1]} · เฉลย {fmtFinal(x[3])} {x[1]}{x[4]!=null?` · Error ${Number(x[4]).toFixed(2)}%`:''}</span><b style={{color:x[5]===null?'#927667':x[5]?'#278c50':'#c44242'}}>{x[5]===null?'—':x[5]?'PASS':'FAIL'}</b></div>)}</div>}</div>})}</div>}</>:<p><b>เฉลยและรายละเอียดรายข้อจะเปิดหลังครูปิดรับงาน</b></p>}<Link className="vx-btn primary" href="/verifyx/student">กลับหน้า Assignments</Link></div>:<>
    <div className="vx-summary-grid">{items.map((item,idx)=>{const s=itemState(item);return <button key={item.item_id} className={`vx-summary-cell ${s}`} onClick={()=>jumpTo(idx)}><b>Q{item.slot_no}</b><span>{s==='answered'?'✓':s==='flagged'?'⚑':'×'}</span></button>})}</div>
    <div className="vx-summary-legend"><span>✓ ตอบแล้ว {Math.max(0,completeCount-flaggedCount)}</span><span>⚑ ไม่แน่ใจ {flaggedCount}</span><span>× ยังไม่ตอบ {items.length-completeCount}</span></div>
    <div className={canFinal?'vx-success':'vx-error'}>{canFinal?'ตอบครบทุกข้อแล้ว พร้อม Final':`ยังตอบไม่ครบ ${items.length-completeCount} ข้อ`}</div>
    <button className="vx-btn primary vx-final-btn" disabled={!canFinal||finalizing} onClick={finalize}><Send size={16}/>{finalizing?'กำลังส่ง...':'ยืนยันคำตอบสุดท้าย · Final'}</button>
   </>}
  </section>}
 </div></main>;
}
