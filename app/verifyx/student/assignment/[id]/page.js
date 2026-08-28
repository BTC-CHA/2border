'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,FileText,Flag,Save,Send,ListChecks} from 'lucide-react';
import {vx,VX_BUCKET} from '../../../vxClient';

const blankCad={volume:'',surface_area:'',mass:'',com_x:'',com_y:'',com_z:'',saved:false,dirty:false};
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};

export default function StudentAssignment(){
 const {id}=useParams();
 const assignmentId=Number(id);
 const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({});
 const [stage,setStage]=useState('work'),[status,setStatus]=useState('in_progress'),[finalAt,setFinalAt]=useState(null),[currentIndex,setCurrentIndex]=useState(0);
 const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
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
   :[x.item_id,{volume:x.volume??'',surface_area:x.surface_area??'',mass:x.mass??'',com_x:x.com_x??'',com_y:x.com_y??'',com_z:x.com_z??'',saved:[x.volume,x.surface_area,x.mass,x.com_x,x.com_y,x.com_z].every(v=>v!==null&&v!==undefined),dirty:false}]
  )));
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
  if(savingId)return;const a=answers[item.item_id]||{};const vals=[a.volume,a.surface_area,a.mass,a.com_x,a.com_y,a.com_z];
  if(vals.some(v=>v===''||v===null||v===undefined||!Number.isFinite(Number(v)))){setError(`ข้อ ${item.slot_no} ยังกรอกข้อมูลไม่ครบหรือมีค่าที่ไม่ถูกต้อง`);return}
  setSavingId(item.item_id);setError('');setMessage('');
  const {error}=await vx.rpc('vx_student_save_answer_auth',{p_assignment_id:assignmentId,p_item_id:item.item_id,p_volume:Number(a.volume).toFixed(3),p_surface_area:Number(a.surface_area).toFixed(3),p_mass:Number(a.mass).toFixed(3),p_com_x:Number(a.com_x).toFixed(3),p_com_y:Number(a.com_y).toFixed(3),p_com_z:Number(a.com_z).toFixed(3),p_is_flagged:item.is_flagged});
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
  setFinalizing(true);setError('');const {data,error}=await vx.rpc('vx_student_finalize_assignment_v3_auth',{p_assignment_id:assignmentId});setFinalizing(false);
  if(error){setError(error.message);return}
  const result=data||[];setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')
 }

 function jumpTo(idx){setCurrentIndex(idx);setStage('work');window.scrollTo({top:0,behavior:'smooth'})}
 function itemState(item){const saved=!!answers[item.item_id]?.saved;if(!saved)return 'unanswered';if(item.is_flagged)return 'flagged';return 'answered'}

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
    :<div className="vx-form"><div className="vx-empty" style={{marginTop:0}}>เขียนชิ้นงานตาม Drawing แล้วนำค่าจาก Mass Properties มากรอกด้านล่าง</div><div className="vx-mass-grid"><label>Volume mm³<input value={a.volume??''} onChange={e=>changeCad(current.item_id,'volume',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Surface Area mm²<input value={a.surface_area??''} onChange={e=>changeCad(current.item_id,'surface_area',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>Mass g<input value={a.mass??''} onChange={e=>changeCad(current.item_id,'mass',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM X<input value={a.com_x??''} onChange={e=>changeCad(current.item_id,'com_x',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM Y<input value={a.com_y??''} onChange={e=>changeCad(current.item_id,'com_y',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label><label>COM Z<input value={a.com_z??''} onChange={e=>changeCad(current.item_id,'com_z',e.target.value)} type="number" step="0.001" disabled={status==='final'}/></label></div>{status!=='final'&&<button className="vx-btn primary" disabled={savingId!==null} onClick={()=>saveCad(current)}><Save size={15}/>{savingId===current.item_id?'กำลังบันทึก...':'บันทึกค่า CAD'}</button>}</div>}
   </section>

   <div className="vx-exam-footer"><button className="vx-exam-arrow" disabled={currentIndex===0} onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))}><ArrowLeft size={28}/></button><button className="vx-btn secondary vx-exam-summary-btn" onClick={()=>setStage('summary')}><ListChecks size={17}/>Summary</button><button className="vx-exam-arrow" disabled={currentIndex===items.length-1} onClick={()=>setCurrentIndex(i=>Math.min(items.length-1,i+1))}><ArrowRight size={28}/></button></div>
  </>}

  {stage==='summary'&&<section className="vx-card vx-exam-summary"><div className="vx-exam-summary-head"><div><p className="vx-kicker">SUMMARY</p><h2>{status==='final'?'ส่งการบ้านเรียบร้อยแล้ว':'ภาพรวมคำตอบ'}</h2></div>{status!=='final'&&<button className="vx-file" onClick={()=>setStage('work')}>กลับไปทำต่อ</button>}</div>
   {status==='final'?<div className="vx-result"><h3 style={{marginTop:0}}>ส่ง Final แล้ว</h3><p>ส่งเมื่อ {finalAt?new Date(finalAt).toLocaleString('th-TH'):''}</p><p><b>คะแนนจะเปิดให้นักเรียนเห็นหลังครูปิดรับงานเท่านั้น</b></p><Link className="vx-btn primary" href="/verifyx/student">กลับหน้า Assignments</Link></div>:<>
    <div className="vx-summary-grid">{items.map((item,idx)=>{const s=itemState(item);return <button key={item.item_id} className={`vx-summary-cell ${s}`} onClick={()=>jumpTo(idx)}><b>Q{item.slot_no}</b><span>{s==='answered'?'✓':s==='flagged'?'⚑':'×'}</span></button>})}</div>
    <div className="vx-summary-legend"><span>✓ ตอบแล้ว {Math.max(0,completeCount-flaggedCount)}</span><span>⚑ ไม่แน่ใจ {flaggedCount}</span><span>× ยังไม่ตอบ {items.length-completeCount}</span></div>
    <div className={canFinal?'vx-success':'vx-error'}>{canFinal?'ตอบครบทุกข้อแล้ว พร้อม Final':`ยังตอบไม่ครบ ${items.length-completeCount} ข้อ`}</div>
    <button className="vx-btn primary vx-final-btn" disabled={!canFinal||finalizing} onClick={finalize}><Send size={16}/>{finalizing?'กำลังส่ง...':'ยืนยันคำตอบสุดท้าย · Final'}</button>
   </>}
  </section>}
 </div></main>;
}
