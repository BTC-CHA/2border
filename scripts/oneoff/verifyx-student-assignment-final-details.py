from pathlib import Path

p=Path('app/verifyx/student/assignment/[id]/page.js')
s=p.read_text(encoding='utf-8')

old="const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({}),[finalSummary,setFinalSummary]=useState(null);"
new="const [profile,setProfile]=useState(null),[assignment,setAssignment]=useState(null),[items,setItems]=useState([]),[answers,setAnswers]=useState({}),[finalSummary,setFinalSummary]=useState(null),[finalDetails,setFinalDetails]=useState([]);"
assert old in s
s=s.replace(old,new,1)

old="const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');"
new="const [savingId,setSavingId]=useState(null),[finalizing,setFinalizing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[showFinalDetails,setShowFinalDetails]=useState(false);"
assert old in s
s=s.replace(old,new,1)

old="if(xs[0]?.progress_status==='final'){const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null)}else setFinalSummary(null);"
new="""if(xs[0]?.progress_status==='final'){
   const [{data:summary},{data:history}]=await Promise.all([
    vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId}),
    vx.rpc('vx_student_final_history_v5_auth')
   ]);
   setFinalSummary(summary?.[0]||null);
   setFinalDetails((history||[]).filter(r=>Number(r.assignment_id)===assignmentId));
  }else{setFinalSummary(null);setFinalDetails([])};"""
assert old in s
s=s.replace(old,new,1)

old="const result=data||[];const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null);setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')"
new="const result=data||[];const {data:summary}=await vx.rpc('vx_student_final_summary_auth',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null);setFinalDetails([]);setShowFinalDetails(false);setStatus('final');setFinalAt(result[0]?.final_at||new Date().toISOString());setStage('summary');setMessage('ส่ง Final เรียบร้อยแล้ว ระบบล็อกคำตอบแล้ว')"
assert old in s
s=s.replace(old,new,1)

old="function itemState(item){const saved=!!answers[item.item_id]?.saved;if(!saved)return 'unanswered';if(item.is_flagged)return 'flagged';return 'answered'}"
new="""function itemState(item){const saved=!!answers[item.item_id]?.saved;if(!saved)return 'unanswered';if(item.is_flagged)return 'flagged';return 'answered'}
 function finalItemPass(r){return r.question_type==='mcq'?Boolean(r.mcq_correct):Number(r.score||0)>=99.995}
 function finalChoiceLabel(r,key){if(!key)return '—';const c=(r.mcq_choices||[]).find(x=>x.key===key);return `${thaiKey[key]||key}. ${c?.text||''}`.trim()}
 function finalMassError(r){const a=Number(r.mass),b=Number(r.reference_mass);if(!Number.isFinite(a)||!Number.isFinite(b))return null;return b===0?Math.abs(a-b):Math.abs(a-b)/Math.abs(b)*100}
 function fmtFinal(v){return Number.isFinite(Number(v))?Number(v).toFixed(3):'—'}"""
assert old in s
s=s.replace(old,new,1)

old="<p><b>เฉลยและรายละเอียดรายข้อจะเปิดหลังครูปิดรับงาน</b></p><Link className=\"vx-btn primary\" href=\"/verifyx/student\">กลับหน้า Assignments</Link>"
new="""{finalDetails.length?<><button className=\"vx-btn secondary\" style={{marginBottom:12}} onClick={()=>setShowFinalDetails(v=>!v)}>{showFinalDetails?'ซ่อนรายละเอียดผลลัพธ์':'ดูรายละเอียดผลลัพธ์'}</button>{showFinalDetails&&<div style={{display:'grid',gap:10,margin:'4px 0 16px'}}>{finalDetails.map(r=>{const pass=finalItemPass(r),c=pass?'#2f9e5b':'#d84c4c',mErr=finalMassError(r),mPass=mErr==null?null:mErr<=Number(r.volume_tolerance_percent||0);return <div key={r.result_id} style={{border:`1px solid ${pass?'#d7eddf':'#f2ceca'}`,background:pass?'#fbfffc':'#fffafa',borderRadius:14,padding:12,textAlign:'left'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}><div><b>ข้อ {r.question_number} · {r.question_title}</b><div style={{fontSize:11,color:c,fontWeight:800,marginTop:4}}>{r.question_type==='mcq'?(pass?'✓ ถูก':'✕ ผิด'):(pass?'✓ PASS':'✕ FAIL')}</div></div><strong style={{color:c,whiteSpace:'nowrap'}}>{Math.round(Number(r.score||0))}/100</strong></div>{r.question_type==='mcq'?<div style={{marginTop:9,fontSize:13,lineHeight:1.6}}><div><b>คำตอบของคุณ:</b> {finalChoiceLabel(r,r.selected_choice_key)}</div><div style={{color:'#278c50'}}><b>เฉลย:</b> {finalChoiceLabel(r,r.snapshot_correct_choice_key)}</div>{r.explanation&&<div style={{marginTop:7,padding:9,borderRadius:10,background:'#fff6ee'}}><b>อธิบาย:</b> {r.explanation}</div>}</div>:<div style={{display:'grid',gap:6,marginTop:9,fontSize:12}}>{[['Volume','mm³',r.volume,r.reference_volume,r.volume_error_percent,r.volume_pass],['Surface Area','mm²',r.surface_area,r.reference_area,r.area_error_percent,r.area_pass],['Mass','g',r.mass,r.reference_mass,mErr,mPass]].map(x=><div key={x[0]} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,padding:'8px 10px',borderRadius:10,background:'#fffaf7'}}><span><b>{x[0]}</b> · คุณ {fmtFinal(x[2])} {x[1]} · เฉลย {fmtFinal(x[3])} {x[1]}{x[4]!=null?` · Error ${Number(x[4]).toFixed(2)}%`:''}</span><b style={{color:x[5]===null?'#927667':x[5]?'#278c50':'#c44242'}}>{x[5]===null?'—':x[5]?'PASS':'FAIL'}</b></div>)}</div>}</div>})}</div>}</>:<p><b>เฉลยและรายละเอียดรายข้อจะเปิดหลังครูปิดรับงาน</b></p>}<Link className=\"vx-btn primary\" href=\"/verifyx/student\">กลับหน้า Assignments</Link>"""
assert old in s
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('patched',p)
