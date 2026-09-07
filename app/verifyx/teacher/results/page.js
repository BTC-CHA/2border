'use client';

import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,ChevronDown,ChevronUp} from 'lucide-react';
import {vx} from '../../vxClient';
import TeacherNav from '../TeacherNav';

const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(3):'—';
const diffLabel={basic:'Basic',pro:'Pro',advanced:'Advanced'};
const typeLabel={cad:'CAD',mcq:'ปรนัย'};
const thaiKey={A:'ก',B:'ข',C:'ค',D:'ง'};
const avgRows=xs=>xs.length?xs.reduce((n,x)=>n+Number(x.score||0),0)/xs.length:null;
const avgNumbers=xs=>xs.length?xs.reduce((n,x)=>n+Number(x||0),0)/xs.length:null;
const groupKey=r=>`${r.student_id}:${r.assignment_id}`;

export default function ResultsPage(){
 const [rows,setRows]=useState([]),[assignmentMeta,setAssignmentMeta]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[assignment,setAssignment]=useState('all'),[student,setStudent]=useState('all'),[difficulty,setDifficulty]=useState('all'),[type,setType]=useState('all'),[result,setResult]=useState('all'),[selected,setSelected]=useState(null),[expanded,setExpanded]=useState(new Set()),[error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  const [{data,error},{data:as,error:ae}]=await Promise.all([
   vx.rpc('vx_teacher_final_results_v4'),
   vx.from('vx_assignments').select('id,title,difficulty,course,status,cad_question_count,mcq_question_count,pass_score').order('created_at',{ascending:false})
  ]);
  if(error||ae)setError((error||ae).message);
  setRows(data||[]);setAssignmentMeta(as||[]);setLoading(false)
 }
 useEffect(()=>{load()},[]);

 const metaMap=useMemo(()=>Object.fromEntries(assignmentMeta.map(a=>[String(a.id),a])),[assignmentMeta]);
 const enriched=useMemo(()=>rows.map(r=>({...r,difficulty:metaMap[String(r.assignment_id)]?.difficulty||null,course:metaMap[String(r.assignment_id)]?.course||''})),[rows,metaMap]);
 const assignments=useMemo(()=>Array.from(new Map(enriched.map(r=>[String(r.assignment_id),r.assignment_title])).entries()),[enriched]);
 const students=useMemo(()=>Array.from(new Map(enriched.map(r=>[String(r.student_id),`${r.student_name} · ${r.student_code}`])).entries()),[enriched]);

 const fullGroups=useMemo(()=>{
  const m=new Map();
  for(const r of enriched){const k=groupKey(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}
  return m
 },[enriched]);

 const rankMap=useMemo(()=>{
  const byAssignment=new Map();
  for(const [key,rs] of fullGroups){const first=rs[0],overall=Number(first?.assignment_total_score??avgRows(rs));if(!byAssignment.has(String(first.assignment_id)))byAssignment.set(String(first.assignment_id),[]);byAssignment.get(String(first.assignment_id)).push({key,overall})}
  const out=new Map();
  for(const xs of byAssignment.values()){
   xs.sort((a,b)=>Number(b.overall||0)-Number(a.overall||0));
   let lastScore=null,lastRank=0;
   xs.forEach((x,i)=>{const score=Number(x.overall||0);const rank=lastScore!==null&&Math.abs(score-lastScore)<0.000001?lastRank:i+1;out.set(x.key,rank);lastScore=score;lastRank=rank})
  }
  return out
 },[fullGroups]);

 const duplicateDevices=useMemo(()=>{
  const deviceStudents=new Map(),seen=new Set();
  for(const r of enriched){
   const device=String(r.final_device_id||'').trim();if(!device)continue;
   const studentOnce=`${r.assignment_id}:${device}:${r.student_id}`;if(seen.has(studentOnce))continue;seen.add(studentOnce);
   const k=`${r.assignment_id}:${device}`;if(!deviceStudents.has(k))deviceStudents.set(k,new Set());deviceStudents.get(k).add(String(r.student_id));
  }
  const grouped=new Map();
  const byAssignment=new Map();
  for(const [k,students] of deviceStudents){if(students.size<=1)continue;const sep=k.indexOf(':');const assignmentId=k.slice(0,sep),device=k.slice(sep+1);if(!byAssignment.has(assignmentId))byAssignment.set(assignmentId,[]);byAssignment.get(assignmentId).push({k,device,count:students.size})}
  const labelFor=i=>{let n=i+1,out='';while(n>0){n--;out=String.fromCharCode(65+(n%26))+out;n=Math.floor(n/26)}return out};
  for(const groups of byAssignment.values()){groups.sort((a,b)=>a.device.localeCompare(b.device));groups.forEach((g,i)=>grouped.set(g.k,{count:g.count,label:labelFor(i)}))}
  return grouped
 },[enriched]);

 const detailFiltered=useMemo(()=>{
  const q=search.toLowerCase().trim();
  return enriched.filter(r=>{
   const qOk=!q||`${r.student_name} ${r.student_code} ${r.assignment_title} ${r.question_title} ${r.course}`.toLowerCase().includes(q);
   return qOk&&(assignment==='all'||String(r.assignment_id)===assignment)&&(student==='all'||String(r.student_id)===student)&&(difficulty==='all'||r.difficulty===difficulty)&&(type==='all'||r.question_type===type)
  })
 },[enriched,search,assignment,student,difficulty,type]);

 const candidateGroups=useMemo(()=>{
  const shown=new Map();for(const r of detailFiltered){const k=groupKey(r);if(!shown.has(k))shown.set(k,[]);shown.get(k).push(r)}
  return Array.from(shown.entries()).map(([key,shownRows])=>{
   const fullRows=fullGroups.get(key)||shownRows,first=fullRows[0];
   const cad=fullRows.filter(x=>x.question_type==='cad'),mcq=fullRows.filter(x=>x.question_type==='mcq');
   const earned=xs=>xs.reduce((n,x)=>n+Number(x.item_points||0),0),max=xs=>xs.reduce((n,x)=>n+Number(x.item_max_points||0),0),cadMax=max(cad),mcqMax=max(mcq);
   const overall=Number(first.assignment_total_score??avgRows(fullRows)),passScore=Number(first.pass_score??metaMap[String(first.assignment_id)]?.pass_score??60);
   const categoryBreakdown=[['part_modeling','Part'],['assembly','ASSY'],['drawing','Drawing'],['mcq','MCQ']].map(([code,label])=>{const xs=fullRows.filter(x=>x.score_category===code),mx=max(xs);return {code,label,earned:earned(xs),max:mx}}).filter(x=>x.max>0);
   const device=String(first.final_device_id||'').trim();
   return {key,student_id:first.student_id,student_code:first.student_code,student_name:first.student_name,assignment_id:first.assignment_id,assignment_title:first.assignment_title,submitted_at:first.submitted_at,rows:shownRows,fullRows,total:fullRows.length,overall,cad:cadMax?earned(cad)*100/cadMax:null,mcq:mcqMax?earned(mcq)*100/mcqMax:null,cadCount:cad.length,mcqCount:mcq.length,categoryBreakdown,passScore,passed:Number(overall||0)>=passScore,rank:rankMap.get(key)||null,duplicateDeviceCount:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.count||0):0,duplicateDeviceLabel:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.label||''):''}
  })
 },[detailFiltered,fullGroups,metaMap,rankMap,duplicateDevices]);

 const summaryRows=useMemo(()=>candidateGroups.filter(g=>result==='all'||(result==='pass'?g.passed:!g.passed)).sort((a,b)=>{
  if(String(a.assignment_id)!==String(b.assignment_id))return String(a.assignment_title).localeCompare(String(b.assignment_title),'th');
  return Number(a.rank||999999)-Number(b.rank||999999)||String(a.student_code).localeCompare(String(b.student_code))
 }),[candidateGroups,result]);

 const visibleKeys=useMemo(()=>new Set(summaryRows.map(g=>g.key)),[summaryRows]);
 const exportRows=useMemo(()=>detailFiltered.filter(r=>visibleKeys.has(groupKey(r))),[detailFiltered,visibleKeys]);
 const overallAvg=avgNumbers(summaryRows.map(g=>g.overall).filter(v=>v!=null));
 const cadAvg=avgNumbers(summaryRows.map(g=>g.cad).filter(v=>v!=null));
 const mcqAvg=avgNumbers(summaryRows.map(g=>g.mcq).filter(v=>v!=null));
 const scoreText=v=>v==null?'—':`${Number(v).toFixed(0)}/100`;
 const pointText=(earned,max)=>`${Number(earned||0).toFixed(Number(earned||0)%1?2:0)}/${Number(max||0).toFixed(Number(max||0)%1?2:0)}`;
 const typePass=r=>r.question_type==='cad'?Number(r.score||0)>=99.995:Boolean(r.mcq_correct);
 function clearFilters(){setSearch('');setAssignment('all');setStudent('all');setDifficulty('all');setType('all');setResult('all')}
 function toggleExpand(key){setExpanded(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next})}
 function massError(r){const a=Number(r.mass),b=Number(r.reference_mass);if(!Number.isFinite(a)||!Number.isFinite(b))return null;return b===0?Math.abs(a-b):Math.abs(a-b)/Math.abs(b)*100}
 function csv(){const h=['student_code','student_name','assignment','difficulty','question_number','question_type','question_title','score_percent','score_category','item_points','item_max_points','assignment_total_score','selected_choice','correct_choice','mcq_correct','volume','reference_volume','volume_error_percent','volume_pass','surface_area','reference_area','area_error_percent','area_pass','mass','reference_mass','final_device_id','final_ip','final_at'];const lines=exportRows.map(r=>[r.student_code,r.student_name,r.assignment_title,r.difficulty,r.question_number,r.question_type,r.question_title,r.score,r.score_category,r.item_points,r.item_max_points,r.assignment_total_score,r.selected_choice_key,r.snapshot_correct_choice_key,r.mcq_correct,r.volume,r.reference_volume,r.volume_error_percent,r.volume_pass,r.surface_area,r.reference_area,r.area_error_percent,r.area_pass,r.mass,r.reference_mass,r.final_device_id,r.final_ip,r.submitted_at].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','));const b=new Blob(['\ufeff'+h.join(',')+'\n'+lines.join('\n')],{type:'text/csv'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='verifyx-final-results.csv';a.click();URL.revokeObjectURL(u)}

 return <main className="vx-page"><div className="vx-wrap"><TeacherNav active="results"/><div className="vx-top"><div><p className="vx-kicker">TEACHER MODE</p><h1>Results</h1><p>ผล Final · คะแนนรวมและแยก CAD / ปรนัย · ตรวจอัตโนมัติ</p></div></div>
 <div className="vx-grid vx-result-stats" style={{marginBottom:16}}><div className="vx-card"><small>Overall Average</small><h2>{scoreText(overallAvg)}</h2></div><div className="vx-card"><small>CAD Average</small><h2>{scoreText(cadAvg)}</h2></div><div className="vx-card"><small>ปรนัย Average</small><h2>{scoreText(mcqAvg)}</h2></div></div>
 <section className="vx-card"><div className="vx-form" style={{marginTop:0}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ / รหัส / Assignment / วิชา / ชื่อข้อ"/><div className="vx-form-row"><label>Assignment<select value={assignment} onChange={e=>setAssignment(e.target.value)}><option value="all">ทั้งหมด</option>{assignments.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label><label>Student<select value={student} onChange={e=>setStudent(e.target.value)}><option value="all">ทั้งหมด</option>{students.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div><div className="vx-form-row"><label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="all">ทั้งหมด</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="advanced">Advanced</option></select></label><label>ประเภทข้อ<select value={type} onChange={e=>setType(e.target.value)}><option value="all">ทั้งหมด</option><option value="cad">CAD</option><option value="mcq">ปรนัย</option></select></label><label>ผลรวม<select value={result} onChange={e=>setResult(e.target.value)}><option value="all">ทั้งหมด</option><option value="pass">ผ่าน</option><option value="fail">ไม่ผ่าน</option></select></label></div><div className="vx-toolbar"><button className="vx-link secondary" onClick={clearFilters}>ล้างตัวกรอง</button><button className="vx-link secondary" onClick={csv} disabled={!exportRows.length}>Export CSV ({summaryRows.length} คน)</button><button className="vx-link primary" onClick={load}>Refresh</button></div></div>
 {error&&<p style={{color:'#b85d58'}}>{error}</p>}
 {loading?<p>กำลังโหลด...</p>:<div style={{display:'grid',gap:10,marginTop:14}}>{summaryRows.length?summaryRows.map(g=>{const isOpen=expanded.has(g.key),statusColor=g.passed?'#2f9e5b':'#d84c4c',statusBg=g.passed?'#edf9f1':'#fff1f0';return <article className="vx-card vx-result-student-card" key={g.key} style={{padding:14,color:'#4b382e',borderColor:g.passed?'#cdebd7':'#f2c8c4'}}><div className="vx-result-student-main" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:14,alignItems:'center'}}><div style={{minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:11,fontWeight:800,padding:'4px 8px',borderRadius:999,background:'#fff4ec',color:'#a85c31'}}>อันดับ {g.rank||'—'}</span><b style={{fontSize:16,color:'#4b382e'}}>{g.student_name}</b>{g.duplicateDeviceCount>1&&<span title="พบ Device ID เดียวกันใน Assignment นี้" style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:800,padding:'4px 8px',borderRadius:999,background:'#fff6df',color:'#a66a00'}}><AlertTriangle size={13}/>Device {g.duplicateDeviceLabel} · ซ้ำ {g.duplicateDeviceCount} คน</span>}</div><div style={{fontSize:11,color:'#927667',marginTop:3}}>{g.student_code} · {g.assignment_title} · {g.total} ข้อ</div><div className="vx-tags">{g.categoryBreakdown.map(x=><span key={x.code}>{x.label} {pointText(x.earned,x.max)}</span>)}<span>Final {g.submitted_at?new Date(g.submitted_at).toLocaleString('th-TH'):'—'}</span></div></div><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 9px',borderRadius:999,background:statusBg}}><span aria-hidden="true" style={{width:12,height:12,borderRadius:'50%',background:statusColor,display:'inline-block',boxShadow:`0 0 0 3px ${g.passed?'#dff3e6':'#fde2df'}`}}/><strong style={{fontSize:24,color:statusColor,whiteSpace:'nowrap'}}>{scoreText(g.overall)}</strong></div><button className="vx-link secondary" style={{width:'auto',padding:'8px 10px'}} onClick={()=>toggleExpand(g.key)} aria-expanded={isOpen}>{isOpen?<ChevronUp size={16}/>:<ChevronDown size={16}/>}<span>{isOpen?'ซ่อน':'ดูรายละเอียด'}</span></button></div></div>{isOpen&&<div style={{display:'grid',gap:7,marginTop:12,paddingTop:12,borderTop:'1px solid #efddd2'}}>{g.rows.map(r=>{const pass=typePass(r);return <button key={r.result_id} onClick={()=>setSelected(r)} style={{textAlign:'left',color:'#4b382e',border:`1px solid ${pass?'#d7eddf':'#f2ceca'}`,background:pass?'#fbfffc':'#fffafa',borderRadius:12,padding:10,cursor:'pointer',display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center'}}><div><b style={{color:'#4b382e'}}>ข้อ {r.question_number} · {r.question_title}</b><div className="vx-tags"><span>{typeLabel[r.question_type]}</span><span>{diffLabel[r.difficulty]||'—'}</span><span style={{color:pass?'#278c50':'#c44242',fontWeight:800}}>{pass?'PASS / ถูก':'FAIL / ผิด'}</span></div></div><div style={{display:'flex',alignItems:'center',gap:7}}><span style={{width:10,height:10,borderRadius:'50%',background:pass?'#2f9e5b':'#d84c4c',display:'inline-block'}}/><strong style={{color:pass?'#278c50':'#c44242'}}>{pointText(r.item_points,r.item_max_points)}</strong></div></button>})}</div>}</article>}):<div className="vx-empty">ไม่พบผล Final ตามตัวกรอง</div>}</div>}
 </section>
 {selected&&<div style={{position:'fixed',inset:0,background:'rgba(50,30,20,.25)',display:'flex',justifyContent:'flex-end',zIndex:99}} onClick={()=>setSelected(null)}><aside onClick={e=>e.stopPropagation()} style={{width:'min(520px,94vw)',height:'100%',overflow:'auto',background:'#fffaf7',padding:22,color:'#4b382e'}}><button onClick={()=>setSelected(null)} style={{float:'right'}}>✕</button><p className="vx-kicker">FINAL RESULT · {typeLabel[selected.question_type]}</p><h2>{selected.student_name}</h2><p>{selected.student_code} · {selected.assignment_title} · ข้อ {selected.question_number}</p><h1 style={{color:typePass(selected)?'#2f9e5b':'#d84c4c'}}>{pointText(selected.item_points,selected.item_max_points)}</h1>{selected.question_type==='mcq'?<><div className="vx-card"><b>{selected.question_title}</b><p>คำตอบนักเรียน: {thaiKey[selected.selected_choice_key]||selected.selected_choice_key||'—'}</p><p>เฉลย snapshot: {thaiKey[selected.snapshot_correct_choice_key]||selected.snapshot_correct_choice_key||'—'}</p></div><div className="vx-list" style={{marginTop:10}}>{(selected.mcq_choices||[]).map(c=><div className="vx-item" key={c.key}><span><b>{thaiKey[c.key]||c.key}.</b> {c.text}</span>{c.key===selected.snapshot_correct_choice_key&&<span>✓ เฉลย</span>}</div>)}</div></>:<>{[['Volume','mm³',selected.volume,selected.reference_volume,selected.volume_error_percent,selected.volume_pass],['Surface Area','mm²',selected.surface_area,selected.reference_area,selected.area_error_percent,selected.area_pass],['Mass','g',selected.mass,selected.reference_mass,massError(selected),massError(selected)==null?null:massError(selected)<=Number(selected.volume_tolerance_percent||0)]].map(x=><div key={x[0]} className="vx-card" style={{marginBottom:10}}><b>{x[0]} {x[5]===null?'':x[5]?'PASS':'FAIL'}</b><p>Student {fmt(x[2])} {x[1]}</p><p>Reference {fmt(x[3])} {x[1]}</p>{x[4]!=null&&<small>Error {Number(x[4]).toFixed(2)}%</small>}</div>)}</>}</aside></div>}
 </div></main>;
}
