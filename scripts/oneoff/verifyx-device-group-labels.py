from pathlib import Path

p=Path('app/verifyx/teacher/results/page.js')
s=p.read_text(encoding='utf-8')
old=""" const duplicateDevices=useMemo(()=>{\n  const deviceStudents=new Map(),seen=new Set();\n  for(const r of enriched){\n   const device=String(r.final_device_id||'').trim();if(!device)continue;\n   const studentOnce=`${r.assignment_id}:${device}:${r.student_id}`;if(seen.has(studentOnce))continue;seen.add(studentOnce);\n   const k=`${r.assignment_id}:${device}`;if(!deviceStudents.has(k))deviceStudents.set(k,new Set());deviceStudents.get(k).add(String(r.student_id));\n  }\n  return new Map(Array.from(deviceStudents.entries()).map(([k,s])=>[k,s.size]).filter(([,n])=>n>1))\n },[enriched]);\n"""
new=""" const duplicateDevices=useMemo(()=>{\n  const deviceStudents=new Map(),seen=new Set();\n  for(const r of enriched){\n   const device=String(r.final_device_id||'').trim();if(!device)continue;\n   const studentOnce=`${r.assignment_id}:${device}:${r.student_id}`;if(seen.has(studentOnce))continue;seen.add(studentOnce);\n   const k=`${r.assignment_id}:${device}`;if(!deviceStudents.has(k))deviceStudents.set(k,new Set());deviceStudents.get(k).add(String(r.student_id));\n  }\n  const grouped=new Map();\n  const byAssignment=new Map();\n  for(const [k,students] of deviceStudents){if(students.size<=1)continue;const sep=k.indexOf(':');const assignmentId=k.slice(0,sep),device=k.slice(sep+1);if(!byAssignment.has(assignmentId))byAssignment.set(assignmentId,[]);byAssignment.get(assignmentId).push({k,device,count:students.size})}\n  const labelFor=i=>{let n=i+1,out='';while(n>0){n--;out=String.fromCharCode(65+(n%26))+out;n=Math.floor(n/26)}return out};\n  for(const groups of byAssignment.values()){groups.sort((a,b)=>a.device.localeCompare(b.device));groups.forEach((g,i)=>grouped.set(g.k,{count:g.count,label:labelFor(i)}))}\n  return grouped\n },[enriched]);\n"""
if old not in s:
    raise SystemExit('duplicateDevices block not found')
s=s.replace(old,new,1)
old2="""duplicateDeviceCount:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)||0):0"""
new2="""duplicateDeviceCount:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.count||0):0,duplicateDeviceLabel:device?(duplicateDevices.get(`${first.assignment_id}:${device}`)?.label||''):''"""
if old2 not in s:
    raise SystemExit('candidate duplicate field not found')
s=s.replace(old2,new2,1)
old3="""<AlertTriangle size={13}/>Device ซ้ำ {g.duplicateDeviceCount} คน</span>"""
new3="""<AlertTriangle size={13}/>Device {g.duplicateDeviceLabel} · ซ้ำ {g.duplicateDeviceCount} คน</span>"""
if old3 not in s:
    raise SystemExit('badge text not found')
s=s.replace(old3,new3,1)
p.write_text(s,encoding='utf-8')
print('patched device duplicate group labels')
